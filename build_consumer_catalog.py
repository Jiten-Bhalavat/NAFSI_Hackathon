"""
build_consumer_catalog.py
--------------------------
Rebuilds nourishnet/public/data/catalog.json with four typed place sources:

  pantry         ← data/unified/consumer/food_pantries_unified.csv
  food-bank      ← data/unified/consumer/food_banks_cafb.csv  (all geolocated)
  snap-store     ← data/unified/consumer/snap_retailer_locator.csv
  farmers-market ← data/unified/consumer/farmers_markets.csv

Each place record gains a `type` field.
The existing `opportunities` array is preserved from the current catalog.json.
"""

import json
import uuid
import re
from datetime import datetime, timezone
from pathlib import Path
import pandas as pd

CATALOG_PATH = Path("nourishnet/public/data/catalog.json")
CONSUMER_DIR = Path("data/unified/consumer")

# ── helpers ───────────────────────────────────────────────────────────────────

def clean(val) -> str:
    if pd.isna(val):
        return ""
    return str(val).strip()


def make_id(namespace: str, key: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{namespace}:{key}"))


# ── county normalization ──────────────────────────────────────────────────────

# Canonical Maryland counties (+ Baltimore City, DC)
_CANONICAL_COUNTIES = [
    "Allegany", "Anne Arundel", "Baltimore", "Baltimore City",
    "Calvert", "Caroline", "Carroll", "Cecil", "Charles",
    "Dorchester", "Frederick", "Garrett", "Harford", "Howard",
    "Kent", "Montgomery", "Prince George's", "Queen Anne's",
    "Somerset", "St. Mary's", "Talbot", "Washington",
    "Wicomico", "Worcester", "District of Columbia",
]

# Build a lookup: lowered stripped form → canonical name
_COUNTY_ALIAS: dict[str, str] = {}
for _c in _CANONICAL_COUNTIES:
    _COUNTY_ALIAS[_c.lower()] = _c
    _COUNTY_ALIAS[_c.lower().replace("'", "")] = _c
    _COUNTY_ALIAS[_c.lower().replace(".", "")] = _c
    _COUNTY_ALIAS[_c.lower().replace("'", "").replace(".", "")] = _c
    # "X County" → X
    _COUNTY_ALIAS[_c.lower() + " county"] = _c

# Extra manual aliases
_COUNTY_ALIAS.update({
    "prince georges":           "Prince George's",
    "prince george's county":   "Prince George's",
    "prince georges county":    "Prince George's",
    "queen annes":              "Queen Anne's",
    "queen anne's county":      "Queen Anne's",
    "queen annes county":       "Queen Anne's",
    "st marys":                 "St. Mary's",
    "st. marys":                "St. Mary's",
    "st mary's":                "St. Mary's",
    "saint marys":              "St. Mary's",
    "saint mary's":             "St. Mary's",
    "montgomery county":        "Montgomery",
    "baltimore county":         "Baltimore",
    "baltimore city":           "Baltimore City",
    "harford county":           "Harford",
    "howard county":            "Howard",
    "frederick county":         "Frederick",
    "dist of columbia":         "District of Columbia",
    "washington dc":            "District of Columbia",
    "washington, dc":           "District of Columbia",
    "dc":                       "District of Columbia",
})
# DC wards → District of Columbia
for _w in range(1, 9):
    _COUNTY_ALIAS[f"ward {_w}"] = "District of Columbia"


def normalize_county(raw: str) -> str | None:
    """Map a raw county string to its canonical form, or None if unrecognized."""
    if not raw:
        return None
    key = raw.strip().lower()
    if key in _COUNTY_ALIAS:
        return _COUNTY_ALIAS[key]
    # Strip trailing " county" and retry
    if key.endswith(" county"):
        key2 = key[:-7].strip()
        if key2 in _COUNTY_ALIAS:
            return _COUNTY_ALIAS[key2]
    # Skip non-MD entries like "Fairfax County", "Arlington County", etc.
    return None


def lat_lng(row, lat_col="latitude", lng_col="longitude"):
    try:
        lat = float(row[lat_col])
        lng = float(row[lng_col])
        if lat == 0 and lng == 0:
            return None, None
        return lat, lng
    except (ValueError, KeyError):
        return None, None


# ── 1. Pantries ───────────────────────────────────────────────────────────────

def load_pantries() -> list[dict]:
    path = CONSUMER_DIR / "food_pantries_unified.csv"
    df = pd.read_csv(path, dtype=str).fillna("")
    places = []
    for _, row in df.iterrows():
        rid = clean(row.get("id", ""))
        name = clean(row.get("name", ""))
        if not name:
            continue
        street = clean(row.get("street", ""))
        city   = clean(row.get("city", ""))
        state  = clean(row.get("state", "MD"))
        zip_   = clean(row.get("zip", ""))
        county = normalize_county(clean(row.get("county", "")))
        phone  = clean(row.get("phone", ""))
        website = clean(row.get("website", ""))
        hours  = clean(row.get("hours", "")) or "Hours not available"
        days   = clean(row.get("days", ""))
        if days and hours != "Hours not available":
            hours = f"{days}: {hours}"
        cats   = clean(row.get("categories", ""))
        tags   = [t.strip() for t in cats.split(";") if t.strip()] if cats else []

        place_id = rid if rid else make_id("pantry", f"{name}|{city}")
        places.append({
            "id": place_id,
            "type": "pantry",
            "name": name,
            "address": street,
            "city": city,
            "state": state or "MD",
            "zip": zip_,
            "county": county,
            "lat": None,
            "lng": None,
            "phone": phone,
            "email": None,
            "hours": hours,
            "eligibility": "",
            "requirements": None,
            "tags": tags,
            "source": clean(row.get("source", "food_pantries_unified")),
            "distributionModel": [],
            "foodFormats": [],
            "dietaryInfo": [],
            "website": website or None,
            "hoursStructured": None,
            "acceptsSnap": False,
            "acceptsWic": False,
        })
    print(f"[pantries]       {len(places)} records")
    return places


# ── 2. Food banks (CAFB) ──────────────────────────────────────────────────────

def build_hours_str(row: pd.Series) -> str:
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    parts = []
    for day in days:
        col = f"hours_{day}"
        val = clean(row.get(col, ""))
        if val and val.lower() not in ("no", "closed", "n/a", ""):
            parts.append(f"{day[:3].capitalize()}: {val}")
    return "; ".join(parts) if parts else "Call for current schedule"


def load_food_banks() -> list[dict]:
    path = CONSUMER_DIR / "food_banks_cafb.csv"
    df = pd.read_csv(path, dtype=str).fillna("")
    places = []
    for _, row in df.iterrows():
        name = clean(row.get("name", ""))
        if not name:
            continue
        city   = clean(row.get("city", ""))
        state  = clean(row.get("state", "MD"))
        county = normalize_county(clean(row.get("county_clean", "")) or clean(row.get("county_name", "")))
        zip_   = clean(row.get("zip", ""))
        addr   = clean(row.get("address1", ""))
        phone  = clean(row.get("phone", ""))
        email  = clean(row.get("email", "")) or None
        hours  = build_hours_str(row)
        lat, lng = lat_lng(row)

        place_id = make_id("food-bank", f"{name}|{city}")
        places.append({
            "id": place_id,
            "type": "food-bank",
            "name": name,
            "address": addr,
            "city": city,
            "state": state or "MD",
            "zip": zip_,
            "county": county,
            "lat": lat,
            "lng": lng,
            "phone": phone,
            "email": email,
            "hours": hours,
            "eligibility": "",
            "requirements": None,
            "tags": ["Food Bank", "CAFB"],
            "source": "food_banks_cafb",
            "distributionModel": ["walk-in"],
            "foodFormats": ["groceries"],
            "dietaryInfo": [],
            "website": None,
            "hoursStructured": None,
            "acceptsSnap": False,
            "acceptsWic": False,
        })
    print(f"[food-banks]     {len(places)} records")
    return places


# ── 3. SNAP retailers ─────────────────────────────────────────────────────────

def load_snap_stores() -> list[dict]:
    path = CONSUMER_DIR / "snap_retailer_locator.csv"
    df = pd.read_csv(path, dtype=str).fillna("")
    places = []
    for _, row in df.iterrows():
        name = clean(row.get("name", ""))
        if not name:
            continue
        addr   = clean(row.get("address", ""))
        city   = clean(row.get("city", ""))
        county = normalize_county(clean(row.get("county", "")))
        state  = clean(row.get("state", "MD"))
        zip_   = clean(row.get("zip", ""))
        store_type = clean(row.get("store_type", ""))
        lat, lng = lat_lng(row)

        rid = clean(row.get("record_id", "")) or clean(row.get("object_id", ""))
        place_id = make_id("snap", rid if rid else f"{name}|{addr}|{city}")
        places.append({
            "id": place_id,
            "type": "snap-store",
            "name": name,
            "address": addr,
            "city": city,
            "state": state or "MD",
            "zip": zip_,
            "county": county,
            "lat": lat,
            "lng": lng,
            "phone": "",
            "email": None,
            "hours": "Hours not available",
            "eligibility": "SNAP EBT accepted",
            "requirements": None,
            "tags": ["SNAP", store_type] if store_type else ["SNAP"],
            "source": "snap_retailer_locator",
            "distributionModel": ["walk-in"],
            "foodFormats": ["groceries"],
            "dietaryInfo": [],
            "website": None,
            "hoursStructured": None,
            "acceptsSnap": True,
            "acceptsWic": False,
        })
    print(f"[snap-stores]    {len(places)} records")
    return places


# ── 4. Farmers markets ────────────────────────────────────────────────────────

def build_market_hours(row: pd.Series) -> str:
    parts = []
    for i in range(1, 5):
        dates = clean(row.get(f"season_{i}_dates", ""))
        hours = clean(row.get(f"season_{i}_hours", ""))
        if dates and hours:
            parts.append(f"{dates}: {hours}")
        elif hours:
            parts.append(hours)
    return "; ".join(parts) if parts else "See website for hours"


def parse_bool(val: str) -> bool:
    return str(val).strip().lower() in ("true", "yes", "1")


def load_farmers_markets() -> list[dict]:
    path = CONSUMER_DIR / "farmers_markets.csv"
    df = pd.read_csv(path, dtype=str).fillna("")
    places = []
    for _, row in df.iterrows():
        name = clean(row.get("name", ""))
        if not name:
            continue
        street  = clean(row.get("street", ""))
        city    = clean(row.get("city", ""))
        state   = clean(row.get("state", "MD"))
        zip_    = clean(row.get("zip", ""))
        website = clean(row.get("website", "")) or None
        hours   = build_market_hours(row)
        lat, lng = lat_lng(row)
        accepts_snap = parse_bool(row.get("accepts_snap", ""))
        accepts_wic  = parse_bool(row.get("accepts_wic", ""))
        products = clean(row.get("products_available", ""))
        tags = [p.strip() for p in products.split(";") if p.strip()] if products else []

        mid = clean(row.get("market_id", ""))
        place_id = make_id("market", mid if mid else f"{name}|{city}")
        places.append({
            "id": place_id,
            "type": "farmers-market",
            "name": name,
            "address": street,
            "city": city,
            "state": state or "MD",
            "zip": zip_,
            "county": None,
            "lat": lat,
            "lng": lng,
            "phone": "",
            "email": None,
            "hours": hours,
            "eligibility": "",
            "requirements": None,
            "tags": tags,
            "source": "farmers_markets",
            "distributionModel": ["walk-in"],
            "foodFormats": ["produce"],
            "dietaryInfo": [],
            "website": website,
            "hoursStructured": None,
            "acceptsSnap": accepts_snap,
            "acceptsWic": accepts_wic,
        })
    print(f"[farmers-markets] {len(places)} records")
    return places


# ── assemble & write ──────────────────────────────────────────────────────────

# Preserve existing opportunities
existing_opps = []
if CATALOG_PATH.exists():
    with open(CATALOG_PATH, encoding="utf-8") as f:
        old = json.load(f)
    existing_opps = old.get("opportunities", [])

all_places = (
    load_pantries() +
    load_food_banks() +
    load_snap_stores() +
    load_farmers_markets()
)

now = datetime.now(timezone.utc).isoformat()

catalog = {
    "schemaVersion": "3.0.0",
    "generatedAt": now,
    "sources": [
        {"id": "food_pantries_unified", "name": "food_pantries_unified", "recordCount": sum(1 for p in all_places if p["type"] == "pantry"), "lastUpdated": now},
        {"id": "food_banks_cafb",       "name": "food_banks_cafb",       "recordCount": sum(1 for p in all_places if p["type"] == "food-bank"), "lastUpdated": now},
        {"id": "snap_retailer_locator", "name": "snap_retailer_locator", "recordCount": sum(1 for p in all_places if p["type"] == "snap-store"), "lastUpdated": now},
        {"id": "farmers_markets",       "name": "farmers_markets",       "recordCount": sum(1 for p in all_places if p["type"] == "farmers-market"), "lastUpdated": now},
    ],
    "places": all_places,
    "opportunities": existing_opps,
}

with open(CATALOG_PATH, "w", encoding="utf-8") as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

print(f"\n✓ Wrote {len(all_places)} places → {CATALOG_PATH}")
for t in ("pantry", "food-bank", "snap-store", "farmers-market"):
    n = sum(1 for p in all_places if p["type"] == t)
    print(f"  {t}: {n}")
