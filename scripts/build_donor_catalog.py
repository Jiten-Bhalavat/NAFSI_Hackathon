"""
Build donor_catalog.json from unified donor data.

Reads all 6 donor CSVs and produces a single JSON file for the NourishNet Donor page.
Output goes to nourishnet/public/data/donor_catalog.json
"""

import csv
import json
import hashlib
import os
from pathlib import Path

DONOR_DIR = Path("data/unified/donor")
OUT_PATH = Path("nourishnet/public/data/donor_catalog.json")
GEOCACHE_PATH = DONOR_DIR / "pantry_geocache.json"


def load_geocache() -> dict:
    if GEOCACHE_PATH.exists():
        with open(GEOCACHE_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {}


def stable_id(prefix: str, *parts: str) -> str:
    raw = "|".join(str(p).strip().lower() for p in parts)
    return prefix + "-" + hashlib.md5(raw.encode()).hexdigest()[:12]


def read_csv(filename: str) -> list[dict]:
    path = DONOR_DIR / filename
    if not path.exists():
        print(f"  SKIP {filename} (not found)")
        return []
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    print(f"  {filename}: {len(rows)} rows")
    return rows


def safe_float(val: str | None) -> float | None:
    if not val or val.strip() == "":
        return None
    try:
        return float(val.strip())
    except ValueError:
        return None


def clean(val: str | None) -> str:
    if not val:
        return ""
    return val.strip()


def build_hours_from_cafb(row: dict) -> str:
    """Build a human-readable hours string from per-day CAFB columns."""
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    abbr = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    parts = []
    for day, ab in zip(days, abbr):
        h = clean(row.get(f"hours_{day}", ""))
        if h:
            parts.append(f"{ab}: {h}")
    return "; ".join(parts) if parts else ""


def process_food_pantries(rows: list[dict], geocache: dict) -> list[dict]:
    """Convert food_pantries_unified.csv rows to places, merging geocache coords."""
    places = []
    for r in rows:
        name = clean(r.get("name", ""))
        if not name:
            continue
        pid = clean(r.get("id", "")) or stable_id("pan", name, clean(r.get("street", "")))
        city = clean(r.get("city", ""))
        state = clean(r.get("state", ""))
        zipcode = clean(r.get("zip", ""))
        street = clean(r.get("street", ""))
        county = clean(r.get("county", "")) or None
        phone = clean(r.get("phone", ""))
        website = clean(r.get("website", ""))
        hours = clean(r.get("hours", ""))
        days = clean(r.get("days", ""))
        hours_str = f"{hours} ({days})" if hours and days else hours or days or ""
        categories = clean(r.get("categories", ""))
        description = clean(r.get("description", ""))
        summary = ""
        if description:
            dot = description.find(".")
            if 0 < dot < 200:
                summary = description[:dot + 1]
            else:
                summary = description[:200] + ("…" if len(description) > 200 else "")

        tags = [t.strip() for t in categories.split(";") if t.strip()] if categories else ["pantry"]

        # Merge geocache coordinates
        cached = geocache.get(pid) or {}
        lat = cached.get("lat") if cached else None
        lng = cached.get("lng") if cached else None

        places.append({
            "id": pid,
            "name": name,
            "address": street,
            "city": city,
            "state": state or "MD",
            "zip": zipcode,
            "county": county,
            "lat": lat,
            "lng": lng,
            "phone": phone,
            "website": website,
            "hours": hours_str,
            "eligibility": "",
            "requirements": None,
            "tags": tags,
            "source": "food_pantries_unified",
            "summary": summary,
            "donorType": "pantry",
        })
    return places


def process_food_banks(rows: list[dict]) -> list[dict]:
    """Convert food_banks_cafb.csv rows to places."""
    places = []
    for r in rows:
        name = clean(r.get("name", ""))
        if not name:
            continue
        pid = stable_id("cafb", clean(r.get("agency_ref", "")), name)
        lat = safe_float(r.get("latitude"))
        lng = safe_float(r.get("longitude"))
        county = clean(r.get("county_clean", "")) or clean(r.get("county_name", "")) or None
        email = clean(r.get("email", ""))
        tefap = clean(r.get("tefap", ""))
        hours_str = build_hours_from_cafb(r)

        tags = ["food-bank"]
        if tefap and "TEFAP" in tefap.upper() and "NON" not in tefap.upper():
            tags.append("TEFAP")
        if email:
            tags.append("accepts-email-contact")

        places.append({
            "id": pid,
            "name": name,
            "address": clean(r.get("address1", "")),
            "city": clean(r.get("city", "")),
            "state": clean(r.get("state", "")) or "MD",
            "zip": clean(r.get("zip", "")),
            "county": county,
            "lat": lat,
            "lng": lng,
            "phone": clean(r.get("phone", "")),
            "website": "",
            "email": email,
            "hours": hours_str,
            "eligibility": f"TEFAP: {tefap}" if tefap else "",
            "requirements": None,
            "tags": tags,
            "source": "food_banks_cafb",
            "summary": f"CAFB partner food bank in {clean(r.get('city', ''))}.",
            "donorType": "food-bank",
        })
    return places


def process_farmers_markets(rows: list[dict]) -> list[dict]:
    """Convert farmers_markets.csv rows to places."""
    places = []
    for r in rows:
        name = clean(r.get("name", ""))
        if not name:
            continue
        pid = stable_id("fm", clean(r.get("market_id", "")), name)
        lat = safe_float(r.get("latitude"))
        lng = safe_float(r.get("longitude"))
        city = clean(r.get("city", ""))
        state = clean(r.get("state", ""))
        zipcode = clean(r.get("zip", ""))

        season = clean(r.get("season_1_dates", ""))
        hours = clean(r.get("season_1_hours", ""))
        hours_str = f"{hours} ({season})" if season and hours else hours or season or ""

        snap = clean(r.get("accepts_snap", "")).lower() == "true"
        wic = clean(r.get("accepts_wic", "")).lower() == "true"
        products = clean(r.get("products_available", ""))
        payment = clean(r.get("payment_methods", ""))

        tags = ["farmers-market"]
        if snap:
            tags.append("SNAP")
        if wic:
            tags.append("WIC")

        places.append({
            "id": pid,
            "name": name,
            "address": clean(r.get("street", "")),
            "city": city,
            "state": state or "MD",
            "zip": zipcode,
            "county": None,
            "lat": lat,
            "lng": lng,
            "phone": "",
            "website": clean(r.get("website", "")),
            "hours": hours_str,
            "eligibility": "",
            "requirements": None,
            "tags": tags,
            "source": "farmers_markets",
            "summary": f"Farmers market. Products: {products}." if products else "Farmers market.",
            "donorType": "farmers-market",
            "products": products,
            "paymentMethods": payment,
        })
    return places


def process_market_data(rows: list[dict]) -> list[dict]:
    """Convert market_data.csv (PG County healthy food stores) to places."""
    places = []
    for r in rows:
        name = clean(r.get("name", ""))
        if not name:
            continue
        pid = stable_id("mkt", name, clean(r.get("address", "")))
        category = clean(r.get("category", ""))

        places.append({
            "id": pid,
            "name": name,
            "address": clean(r.get("address", "")),
            "city": clean(r.get("city", "")),
            "state": clean(r.get("state", "")) or "MD",
            "zip": clean(r.get("zip", "")),
            "county": "Prince George's",
            "lat": None,
            "lng": None,
            "phone": "",
            "website": "",
            "hours": "",
            "eligibility": "",
            "requirements": None,
            "tags": [category.lower().replace(" ", "-")] if category else ["store"],
            "source": "market_data",
            "summary": f"{category} in PG County." if category else "Food store in PG County.",
            "donorType": "store",
        })
    return places


def process_feeding_america(rows: list[dict]) -> list[dict]:
    """Convert feeding_america_maryland.csv to county-level need stats."""
    stats = []
    for r in rows:
        county = clean(r.get("county", ""))
        if not county:
            continue
        stats.append({
            "county": county,
            "year": clean(r.get("year", "")),
            "foodInsecurePopulation": int(safe_float(r.get("food_insecure_population")) or 0),
            "foodInsecurityRate": safe_float(r.get("food_insecurity_rate")),
            "averageMealCost": safe_float(r.get("average_meal_cost")),
            "annualFoodBudgetShortfall": safe_float(r.get("annual_food_budget_shortfall")),
            "url": clean(r.get("url", "")),
        })
    return stats


def process_tracts(rows: list[dict]) -> list[dict]:
    """Convert tracts_with_municipality.csv to priority area data."""
    tracts = []
    for r in rows:
        tract_id = clean(r.get("tract_id", ""))
        if not tract_id:
            continue
        rfei = safe_float(r.get("rfei"))
        is_hfpa = clean(r.get("is_healthy_food_priority_area", "")).lower() in ("yes", "true", "1")
        tracts.append({
            "tractId": tract_id,
            "healthyStoreCount": int(safe_float(r.get("healthy_store_count")) or 0),
            "unhealthyStoreCount": int(safe_float(r.get("unhealthy_store_count")) or 0),
            "rfei": rfei,
            "isHealthyFoodPriorityArea": is_hfpa,
            "tier": clean(r.get("tier", "")) or None,
            "municipality": clean(r.get("municipality_name", "")) or None,
        })
    return tracts


def deduplicate_places(places: list[dict]) -> list[dict]:
    """Remove duplicates by normalized name+address."""
    seen = set()
    unique = []
    for p in places:
        key = (p["name"].lower().strip(), p["address"].lower().strip(), p["city"].lower().strip())
        if key in seen:
            continue
        seen.add(key)
        unique.append(p)
    return unique


def main():
    print("Building donor catalog from unified data...\n")

    # Read all CSVs
    pantry_rows = read_csv("food_pantries_unified.csv")
    cafb_rows = read_csv("food_banks_cafb.csv")
    fm_rows = read_csv("farmers_markets.csv")
    market_rows = read_csv("market_data.csv")
    fa_rows = read_csv("feeding_america_maryland.csv")
    tract_rows = read_csv("tracts_with_municipality.csv")

    # Load geocache (built by geocode_pantries.py)
    geocache = load_geocache()
    geocached_count = sum(1 for v in geocache.values() if v is not None and v.get("lat") is not None)
    print(f"  Geocache: {len(geocache)} entries, {geocached_count} with coordinates")

    # Donation destinations: pantries + food banks only
    donation_places = []
    donation_places.extend(process_food_pantries(pantry_rows, geocache))
    donation_places.extend(process_food_banks(cafb_rows))

    before = len(donation_places)
    donation_places = deduplicate_places(donation_places)
    print(f"\n  Donation places dedup: {before} → {len(donation_places)}")

    # Partner markets (farmers markets — partnership/context, not drop-off)
    partner_markets = process_farmers_markets(fm_rows)
    print(f"  Partner markets: {len(partner_markets)}")

    # Supply gap stores (market_data — analytical context for identifying gaps)
    supply_gap_stores = process_market_data(market_rows)
    print(f"  Supply gap stores: {len(supply_gap_stores)}")

    # County stats
    county_stats = process_feeding_america(fa_rows)
    print(f"  County stats: {len(county_stats)} entries")

    # Tracts
    tracts = process_tracts(tract_rows)
    print(f"  Tracts: {len(tracts)} entries")

    with_coords = sum(1 for p in donation_places if p["lat"] is not None and p["lng"] is not None)
    print(f"  Donation places with coordinates: {with_coords}/{len(donation_places)}")

    catalog = {
        "schemaVersion": "2.1.0",
        "generatedAt": "2026-04-13T00:00:00Z",
        "donorPlaces": donation_places,       # pantries + food banks — where to donate
        "partnerMarkets": partner_markets,    # farmers markets — partnership context
        "supplyGapStores": supply_gap_stores, # PG County stores — supply gap analysis
        "countyStats": county_stats,
        "priorityTracts": tracts,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    size_mb = os.path.getsize(OUT_PATH) / (1024 * 1024)
    print(f"\n✓ Wrote {OUT_PATH} ({size_mb:.2f} MB)")
    print(f"  {len(donation_places)} donation places (pantries + food banks)")
    print(f"  {len(partner_markets)} partner markets")
    print(f"  {len(supply_gap_stores)} supply gap stores")
    print(f"  {len(county_stats)} county stats")
    print(f"  {len(tracts)} priority tracts")


if __name__ == "__main__":
    main()
