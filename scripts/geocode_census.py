"""
Batch geocode food pantries using the US Census Bureau Geocoder.
- Free, no API key, no rate limits
- Accepts up to 1,000 addresses per request
- Saves results to data/unified/donor/pantry_geocache.json
- Run once; subsequent runs only geocode new/failed entries

Usage:
    python scripts/geocode_census.py
"""

import csv
import json
import time
import urllib.request
import urllib.parse
import io
from pathlib import Path

PANTRY_CSV   = Path("data/unified/donor/food_pantries_unified.csv")
CACHE_FILE   = Path("data/unified/donor/pantry_geocache.json")
CENSUS_URL   = "https://geocoding.geo.census.gov/geocoder/locations/addressbatch"
BATCH_SIZE   = 999   # Census limit is 1000 rows including header
SLEEP_BATCH  = 1.0   # seconds between batches (be polite)


def load_cache() -> dict:
    if CACHE_FILE.exists():
        with open(CACHE_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache: dict):
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)
    print(f"  Cache saved: {len(cache)} entries")


def census_batch(rows: list[tuple[str, str, str, str, str]]) -> dict[str, tuple[float, float] | None]:
    """
    Send a batch to Census Geocoder.
    rows: list of (unique_id, street, city, state, zip)
    Returns: {unique_id: (lat, lng) or None}
    """
    # Build CSV payload — Census wants: ID, Street, City, State, ZIP (5 columns)
    lines = []
    for uid, street, city, state, zipcode in rows:
        def esc(s: str) -> str:
            s = s.replace('"', '""')
            return f'"{s}"' if ("," in s or '"' in s) else s
        lines.append(f"{esc(uid)},{esc(street)},{esc(city)},{esc(state)},{esc(zipcode)}")

    payload_str = "\n".join(lines)
    payload_bytes = payload_str.encode("utf-8")

    boundary = "CensusBatch9x7z"
    body = (
        f"--{boundary}\r\n"
        "Content-Disposition: form-data; name=\"addressFile\"; filename=\"addresses.csv\"\r\n"
        "Content-Type: text/plain\r\n\r\n"
    ).encode("utf-8") + payload_bytes + (
        f"\r\n--{boundary}\r\n"
        "Content-Disposition: form-data; name=\"benchmark\"\r\n\r\n"
        "Public_AR_Current"
        f"\r\n--{boundary}--\r\n"
    ).encode("utf-8")

    req = urllib.request.Request(
        CENSUS_URL,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )

    results: dict[str, tuple[float, float] | None] = {}
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8", errors="replace")

        reader = csv.reader(io.StringIO(raw))
        for row in reader:
            if len(row) < 3:
                continue
            uid = row[0].strip().strip('"')
            match_status = row[2].strip().strip('"') if len(row) > 2 else ""
            coords_str = row[5].strip().strip('"') if len(row) > 5 else ""

            if match_status == "Match" and coords_str:
                try:
                    # Census returns "lng,lat"
                    lng_str, lat_str = coords_str.split(",")
                    results[uid] = (float(lat_str.strip()), float(lng_str.strip()))
                except ValueError:
                    results[uid] = None
            else:
                results[uid] = None
    except Exception as e:
        print(f"    Batch error: {e}")
        for uid, *_ in rows:
            results[uid] = None

    return results


def main():
    print("Census Geocoder — batch geocoding food pantries\n")

    cache = load_cache()
    print(f"Cache: {len(cache)} entries, {sum(1 for v in cache.values() if v)} with coords")

    # Read pantries
    with open(PANTRY_CSV, encoding="utf-8-sig", newline="") as f:
        pantries = list(csv.DictReader(f))
    print(f"Pantries total: {len(pantries)}")

    # Filter to those not yet in cache
    def needs_geocode(r: dict) -> bool:
        pid = r.get("id", "").strip()
        if not pid:
            return False
        if pid in cache:
            return False  # already attempted
        street = r.get("street", "").strip()
        city   = r.get("city", "").strip()
        # Skip entries with no physical address
        if not street or street.lower() in ("no physical location", "n/a", ""):
            cache[pid] = None  # mark as non-geocodable
            return False
        if not city:
            return False
        return True

    todo = [r for r in pantries if needs_geocode(r)]
    print(f"To geocode: {len(todo)}")

    if not todo:
        print("Nothing to do — all pantries already in cache.")
        save_cache(cache)
        return

    # Process in batches
    total_ok = 0
    total_fail = 0
    batch_num = 0

    for i in range(0, len(todo), BATCH_SIZE):
        batch = todo[i : i + BATCH_SIZE]
        batch_num += 1
        print(f"  Batch {batch_num}: {len(batch)} addresses...", end=" ", flush=True)

        rows = []
        for r in batch:
            pid     = r["id"].strip()
            street  = r.get("street", "").strip()
            city    = r.get("city", "").strip()
            state   = r.get("state", "MD").strip() or "MD"
            zipcode = r.get("zip", "").strip()
            rows.append((pid, street, city, state, zipcode))

        results = census_batch(rows)

        ok = sum(1 for v in results.values() if v is not None)
        fail = len(results) - ok
        total_ok += ok
        total_fail += fail
        print(f"{ok} matched, {fail} failed")

        for uid, coords in results.items():
            if coords:
                cache[uid] = {"lat": coords[0], "lng": coords[1]}
            else:
                cache[uid] = None

        save_cache(cache)

        if i + BATCH_SIZE < len(todo):
            time.sleep(SLEEP_BATCH)

    print(f"\n✓ Done. {total_ok} geocoded, {total_fail} failed.")
    print(f"  Cache now has {len(cache)} entries.")
    print(f"\nNow run: python scripts/build_donor_catalog.py")


if __name__ == "__main__":
    main()
