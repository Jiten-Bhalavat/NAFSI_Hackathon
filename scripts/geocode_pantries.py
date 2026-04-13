"""
Geocode food pantries that are missing lat/lng coordinates.

Reads food_pantries_unified.csv, geocodes addresses via Nominatim (free, no key),
and writes a cache file: data/unified/donor/pantry_geocache.json

Run this ONCE (or incrementally). The build script merges the cache automatically.
Rate limit: 1 request/second per Nominatim usage policy.

Usage:
    python scripts/geocode_pantries.py [--limit N]
"""

import csv
import json
import time
import argparse
import urllib.request
import urllib.parse
from pathlib import Path

PANTRY_CSV = Path("data/unified/donor/food_pantries_unified.csv")
CACHE_FILE = Path("data/unified/donor/pantry_geocache.json")
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "NourishNet-ClassProject/1.0 (geocoding food pantries)"}
SLEEP = 1.1  # seconds between requests — Nominatim policy: max 1 req/sec


def load_cache() -> dict:
    if CACHE_FILE.exists():
        with open(CACHE_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache: dict):
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


def geocode(address: str, city: str, state: str, zipcode: str) -> tuple[float, float] | None:
    """Query Nominatim for a single address. Returns (lat, lng) or None."""
    # Try full address first, fall back to city+state+zip
    queries = []
    if address and city:
        queries.append(f"{address}, {city}, {state} {zipcode}".strip(", "))
    if city and state:
        queries.append(f"{city}, {state} {zipcode}".strip(", "))

    for q in queries:
        params = urllib.parse.urlencode({
            "q": q,
            "format": "json",
            "limit": "1",
            "countrycodes": "us",
            "viewbox": "-79.5,37.9,-75.0,39.8",
            "bounded": "0",
        })
        url = f"{NOMINATIM_URL}?{params}"
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
        except Exception as e:
            print(f"    Error geocoding '{q}': {e}")
        time.sleep(SLEEP)

    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="Max new geocodes (0 = all missing)")
    args = parser.parse_args()

    cache = load_cache()
    print(f"Cache loaded: {len(cache)} entries")

    with open(PANTRY_CSV, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    missing = [r for r in rows if not r.get("id") or r["id"] not in cache]
    print(f"Pantries missing geocode: {len(missing)}")

    if args.limit:
        missing = missing[:args.limit]
        print(f"Processing first {args.limit}")

    done = 0
    failed = 0
    for r in missing:
        pid = r.get("id", "").strip()
        if not pid:
            continue

        address = r.get("street", "").strip()
        city = r.get("city", "").strip()
        state = r.get("state", "MD").strip() or "MD"
        zipcode = r.get("zip", "").strip()

        result = geocode(address, city, state, zipcode)
        if result:
            cache[pid] = {"lat": result[0], "lng": result[1]}
            done += 1
            if done % 10 == 0:
                save_cache(cache)
                print(f"  {done} geocoded, {failed} failed so far…")
        else:
            cache[pid] = {"lat": None, "lng": None}
            failed += 1

    save_cache(cache)
    print(f"\n✓ Done. {done} geocoded, {failed} failed. Cache: {len(cache)} total entries.")
    print(f"  Cache saved to {CACHE_FILE}")
    print(f"\nNow run: python scripts/build_donor_catalog.py")


if __name__ == "__main__":
    main()
