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

SYSTEM_INSTRUCTION = """You are a helpful assistant for food donors in Maryland.
You help donors find food pantries, food banks, SNAP retailers, and other food
assistance locations where they can donate food or volunteer.

Below are relevant records from the food resource database. Use ONLY this data
to answer questions. If the data doesn't contain enough information, say so.

CROSS-REFERENCING HUNGER DATA:
- The data includes Feeding America county-level food insecurity rates and
  tract-level Healthy Food Priority Area (HFPA) designations.
- When users ask about "highest hunger", "most need", or "food insecurity",
  use food_insecurity_rate (higher = more hunger) from Feeding America data
  and is_healthy_food_priority_area=Yes from tracts data to rank areas.
- When users ask about locations near a ZIP code, check tracts data for that
  ZIP to determine if it's a Healthy Food Priority Area, and find the LOCAL
  county's food insecurity rate from Feeding America data.
- IMPORTANT: Always prioritize LOCAL context. If a user asks about a specific
  ZIP code, report the food insecurity rate for THAT ZIP's county, not the
  statewide highest. You may mention the statewide highest separately for
  comparison, but clearly label it as statewide vs local.
- Use municipality_city and municipality_zip from tracts data to map ZIP codes
  to their local area.

RESPONSE RULES:
- Only include meaningful, useful information in your response.
- NEVER include fields that are empty, missing, "None", "None specified", "N/A",
  "Not available", or have no real value. Simply omit them entirely.
- Always include: name, address, phone number, and hours when available.
- Keep answers concise and actionable. Use bullet points when listing locations.
- Do not pad responses with filler or placeholder text.
- Do NOT include food insecurity rates, hunger statistics, or HFPA data unless
  the user specifically asks about hunger, food insecurity, or food deserts.
  For general location or donation questions, just list the relevant places."""


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
    zip_note = f"\nThe user is located near ZIP code {req.zip_code}. Prioritize results near this area." if req.zip_code else ""
    contents.append(types.Content(
        role="user",
        parts=[types.Part(text=f"RELEVANT DATA:\n{context}{zip_note}\n\nUser question: {req.message}")]
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
