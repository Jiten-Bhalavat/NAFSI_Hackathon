"""
build_catalogs.py
-----------------
Populates the `opportunities` array in nourishnet/public/data/catalog.json
from the volunteer CSVs in data/unified/volunteer/.

Rules:
  - Every food bank (food_banks_cafb.csv) → 1 volunteering opportunity
  - Every pantry (food_pantries_unified.csv) that has a phone number → 1 opportunity
  - Farmers markets are skipped (no stable volunteer contact info)

The script reads the existing catalog.json, replaces opportunities[], and
writes it back in-place.
"""

import json
import uuid
import re
from pathlib import Path
import pandas as pd

CATALOG_PATH = Path("nourishnet/public/data/catalog.json")
VOLUNTEER_DIR = Path("data/unified/volunteer")

# ── helpers ───────────────────────────────────────────────────────────────────

def clean(val) -> str:
    """Return stripped string or empty string for NaN / None."""
    if pd.isna(val):
        return ""
    return str(val).strip()


def build_schedule(row: pd.Series) -> str:
    """
    Reconstruct a human-readable schedule string from the per-day hour columns
    present in food_banks_cafb.csv.  Falls back to a generic string.
    """
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    parts = []
    for day in days:
        col = f"hours_{day}"
        if col in row.index:
            val = clean(row[col])
            if val and val.lower() not in ("no", "closed", "n/a", ""):
                parts.append(f"{day.capitalize()}: {val}")
    if parts:
        return "; ".join(parts)
    return "Call for current schedule"


def needs_tags_for(source: str) -> list[str]:
    if source == "food_bank":
        return ["Food sorting", "Client services", "Warehouse", "Delivery"]
    return ["Food sorting", "Client services"]


# ── load catalog ──────────────────────────────────────────────────────────────

with open(CATALOG_PATH, encoding="utf-8") as f:
    catalog = json.load(f)

# Build a lookup: name+city → place id  (used to link opportunities to places)
place_lookup: dict[str, str] = {}
for p in catalog["places"]:
    key = f"{p['name'].lower().strip()}|{p['city'].lower().strip()}"
    place_lookup[key] = p["id"]

# Also build a phone → place id lookup as fallback
phone_lookup: dict[str, str] = {}
for p in catalog["places"]:
    ph = re.sub(r"\D", "", p.get("phone", ""))
    if ph:
        phone_lookup[ph] = p["id"]

opportunities: list[dict] = []
seen_place_ids: set[str] = set()   # one opportunity per place


def find_place_id(name: str, city: str, phone: str) -> str | None:
    key = f"{name.lower().strip()}|{city.lower().strip()}"
    if key in place_lookup:
        return place_lookup[key]
    ph = re.sub(r"\D", "", phone)
    if ph and ph in phone_lookup:
        return phone_lookup[ph]
    return None


def add_opportunity(place_id: str, name: str, phone: str, email: str,
                    schedule: str, source: str):
    if place_id in seen_place_ids:
        return
    seen_place_ids.add(place_id)
    opportunities.append({
        "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"vol:{place_id}")),
        "placeId": place_id,
        "type": "volunteering",
        "title": f"Volunteer at {name}",
        "summary": (
            "Help neighbors in need by sorting food, assisting clients, "
            "and supporting daily operations at this community food resource."
        ),
        "contactName": None,
        "contactEmail": email or None,
        "contactPhone": phone or None,
        "schedule": schedule or "Call for current schedule",
        "needsTags": needs_tags_for(source),
    })


# ── 1. Food banks (food_banks_cafb.csv) ───────────────────────────────────────

banks_path = VOLUNTEER_DIR / "food_banks_cafb.csv"
if banks_path.exists():
    banks = pd.read_csv(banks_path, dtype=str).fillna("")
    print(f"[food_banks] {len(banks)} rows")
    for _, row in banks.iterrows():
        name  = clean(row.get("name", ""))
        city  = clean(row.get("city", ""))
        phone = clean(row.get("phone", ""))
        email = clean(row.get("email", ""))
        schedule = build_schedule(row)

        if not name:
            continue

        place_id = find_place_id(name, city, phone)
        if place_id is None:
            # Create a synthetic place_id so the opportunity still appears
            # (the map won't pin it, but the list card will show)
            place_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"bank:{name}|{city}"))

        add_opportunity(place_id, name, phone, email, schedule, "food_bank")

    print(f"  → {len(opportunities)} opportunities after food banks")


# ── 2. Pantries (food_pantries_unified.csv) ───────────────────────────────────

pantries_path = VOLUNTEER_DIR / "food_pantries_unified.csv"
before = len(opportunities)
if pantries_path.exists():
    pantries = pd.read_csv(pantries_path, dtype=str).fillna("")
    print(f"[pantries]   {len(pantries)} rows")
    for _, row in pantries.iterrows():
        phone = clean(row.get("phone", ""))
        if not phone:
            continue   # skip pantries with no contact phone

        name  = clean(row.get("name", ""))
        city  = clean(row.get("city", ""))
        email = ""     # pantry CSV has no email column

        # Use the id column directly if present
        place_id = clean(row.get("id", ""))
        if not place_id:
            place_id = find_place_id(name, city, phone)
        if not place_id:
            place_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"pantry:{name}|{city}"))

        # Build schedule from hours/days columns if present
        hours = clean(row.get("hours", ""))
        days  = clean(row.get("days", ""))
        if hours and days:
            schedule = f"{days}: {hours}"
        elif hours:
            schedule = hours
        else:
            schedule = "Call for current schedule"

        add_opportunity(place_id, name, phone, email, schedule, "pantry")

    print(f"  → {len(opportunities) - before} new opportunities from pantries")


# ── write back ────────────────────────────────────────────────────────────────

catalog["opportunities"] = opportunities
with open(CATALOG_PATH, "w", encoding="utf-8") as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

print(f"\n✓ Wrote {len(opportunities)} opportunities → {CATALOG_PATH}")
