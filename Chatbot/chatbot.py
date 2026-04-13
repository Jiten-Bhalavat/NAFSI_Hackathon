#!/usr/bin/env python3
"""
Donor Chatbot API — reads unified CSV data, filters by keyword,
sends relevant rows to Gemini for answers. Uses google-genai SDK.
"""
import os
import csv
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

# ── Config ──────────────────────────────────────────────────
CHATBOT_DIR = Path(__file__).resolve().parent
load_dotenv(CHATBOT_DIR / ".env")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is required")
client = genai.Client(api_key=GEMINI_API_KEY)

DONOR_DIR = CHATBOT_DIR / "data" / "donor"
SNAP_FILE = CHATBOT_DIR / "data" / "consumer" / "snap_retailer_locator.csv"
MAX_ROWS = 150
MODEL = "gemini-2.0-flash"

SYSTEM_INSTRUCTION = """You are a concise assistant for food donors in Maryland.
You help donors find food pantries, food banks, SNAP retailers, and other food
assistance locations where they can donate food or volunteer.

STRICT RULES — follow these exactly:
1. Answer ONLY what the user asked. Nothing more.
2. If the user asks for locations to donate, list ONLY locations with name,
   address, phone, and hours. Do not add statistics, context, or commentary.
3. If the user asks about hunger or food insecurity, respond with ONLY the
   county name and its food insecurity rate. Do NOT mention tract IDs,
   HFPA designations, or any technical data fields. Keep it simple like:
   "Prince George's County has a 12.1% food insecurity rate."
4. NEVER mention tract numbers, tract IDs, or "Healthy Food Priority Area"
   in any response. These are internal data fields, not useful to users.
5. Do NOT add introductory sentences, summaries, conclusions, or extra context
   the user did not ask for.
6. Do NOT include fields that are empty, "None", "N/A", or have no real value.
7. Use bullet points when listing multiple locations. Keep it short.
   Format each location like this:
   • **Name**
     Address line
     Phone: (xxx) xxx-xxxx
     Hours: if available
   Put each detail on its own line for readability.
8. If the data doesn't have enough info to answer, say so in one sentence.
9. Do NOT answer questions unrelated to food donation, food assistance, or
   Maryland food resources. Politely decline and redirect."""


# ── Load CSV data at startup ────────────────────────────────
def load_csv_rows(csv_path: Path) -> list[dict]:
    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    source = csv_path.stem.replace("_", " ").title()
    for row in rows:
        row["_source"] = source
    return rows


def load_all_rows() -> list[dict]:
    all_rows = []
    for csv_path in sorted(DONOR_DIR.glob("*.csv")):
        all_rows.extend(load_csv_rows(csv_path))
    if SNAP_FILE.exists():
        all_rows.extend(load_csv_rows(SNAP_FILE))
    return all_rows


print("Loading data from unified folder...")
ALL_ROWS = load_all_rows()
print(f"Loaded {len(ALL_ROWS):,} total rows")


def row_to_text(row: dict) -> str:
    parts = []
    for k, v in row.items():
        if k == "_source":
            continue
        v_str = str(v).strip()
        if v_str and v_str.lower() not in ("", "none", "n/a", "nan", "null", "none specified"):
            parts.append(f"{k}: {v_str}")
    return f"[{row['_source']}] " + " | ".join(parts)


def search_rows(query: str) -> str:
    keywords = [w.lower() for w in query.split() if len(w) > 2]

    # Always include hunger-related data when query mentions location/zip/hunger
    hunger_keywords = {"hunger", "hungry", "insecurity", "insecure", "need", "priority",
                       "highest", "worst", "most", "rank", "food desert"}
    include_hunger = any(kw in query.lower() for kw in hunger_keywords)

    scored = []
    for row in ALL_ROWS:
        row_text = " ".join(str(v).lower() for v in row.values() if v)
        score = sum(1 for kw in keywords if kw in row_text)
        # Boost hunger-related data when relevant
        if include_hunger and row.get("_source") in ("Feeding America Maryland", "Tracts With Municipality"):
            score += 3
        if score > 0:
            scored.append((score, row))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_rows = [row for _, row in scored[:MAX_ROWS]]

    # If a ZIP code is in the query, always append matching hunger context
    zip_codes = [w for w in query.split() if w.isdigit() and len(w) == 5]
    if zip_codes:
        # Find which municipality/county this ZIP belongs to from tracts data
        local_cities = set()
        for row in ALL_ROWS:
            src = row.get("_source", "")
            if src == "Tracts With Municipality":
                row_zip = str(row.get("municipality_zip", "")).replace(".0", "")
                if row_zip in zip_codes:
                    city = row.get("municipality_city", "")
                    if city:
                        local_cities.add(city.lower())
                    if row not in top_rows:
                        top_rows.append(row)

        # Also include county-level feeding america data
        for row in ALL_ROWS:
            src = row.get("_source", "")
            if src == "Feeding America Maryland":
                if row not in top_rows:
                    top_rows.append(row)

    if not top_rows:
        sources = {}
        for row in ALL_ROWS:
            src = row["_source"]
            if src not in sources:
                sources[src] = []
            if len(sources[src]) < 10:
                sources[src].append(row)
        top_rows = [row for rows in sources.values() for row in rows]

    lines = [row_to_text(r) for r in top_rows]
    return f"({len(top_rows)} matching records)\n" + "\n".join(lines)


# ── FastAPI app ─────────────────────────────────────────────
app = FastAPI(title="Food Pantry Donor Chatbot")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    zip_code: str = ""


class ChatResponse(BaseModel):
    answer: str


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # Prepend ZIP context to the query for better search results
    query_with_zip = req.message
    if req.zip_code:
        query_with_zip = f"{req.message} near ZIP {req.zip_code}"

    context = search_rows(query_with_zip)

    # Build conversation history
    contents = []
    for msg in req.history[-6:]:
        role = "user" if msg.get("role") == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))

    # Add current user message with data context
    zip_note = f"\nUser's ZIP code: {req.zip_code}." if req.zip_code else ""
    contents.append(types.Content(
        role="user",
        parts=[types.Part(text=f"DATA:\n{context}{zip_note}\n\nQuestion: {req.message}\n\nAnswer ONLY what was asked. No extra info.")]
    ))

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
            ),
        )
        return ChatResponse(answer=response.text)
    except Exception as e:
        error_msg = str(e)
        return ChatResponse(answer=f"Sorry, I encountered an error: {error_msg}")
        

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
