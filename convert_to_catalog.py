#!/usr/bin/env python3
"""
convert_to_catalog.py
---------------------
Reads the unified CSV (data/unified/consumer/food_pantries_unified.csv),
enriches fields, deduplicates, optionally geocodes, and writes catalog.json
to data/unified/consumer/catalog.json (source of truth), then copies it to
nourishnet/public/data/catalog.json for Vite serving.

Usage:
    python convert_to_catalog.py                   # full run with geocoding
    python convert_to_catalog.py --no-geocode      # skip geocoding (fast)
    python convert_to_catalog.py --output out.json  # custom output path
"""

import argparse
import csv
import json
import logging
import os
import re
import shutil
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from difflib import SequenceMatcher
from typing import Optional

try:
    import requests
except ImportError:
    requests = None  # geocoding will be unavailable

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

DEFAULT_CSV = "data/unified/consumer/food_pantries_unified.csv"
DEFAULT_OUTPUT = "data/unified/consumer/catalog.json"
DEFAULT_FRONTEND_COPY = "nourishnet/public/data/catalog.json"
GEOCODE_CACHE_FILE = "geocode_cache.json"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "NourishNet-ClassProject/1.0"

# Maryland / DC coordinate bounds
LAT_MIN, LAT_MAX = 37.0, 40.0
LNG_MIN, LNG_MAX = -80.0, -75.0

ZIP_PATTERN = re.compile(r"^\d{5}$")


# ── Place Dataclass ──────────────────────────────────────────────────────────


@dataclass
class Place:
    id: str
    name: str
    address: str
    city: str
    state: str
    zip: str
    county: Optional[str]
    lat: Optional[float]
    lng: Optional[float]
    phone: str
    email: Optional[str]
    hours: str
    eligibility: str
    requirements: Optional[str]
    tags: list = field(default_factory=list)
    source: str = ""
    distribution_model: list = field(default_factory=lambda: ["walk-in"])
    food_formats: list = field(default_factory=lambda: ["groceries"])
    dietary_info: list = field(default_factory=list)
    website: Optional[str] = None
    hours_structured: Optional[list] = None

    def to_dict(self) -> dict:
        """Serialize to JSON-compatible dict with camelCase keys."""
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zip": self.zip,
            "county": self.county,
            "lat": self.lat,
            "lng": self.lng,
            "phone": self.phone,
            "email": self.email,
            "hours": self.hours,
            "eligibility": self.eligibility,
            "requirements": self.requirements,
            "tags": self.tags,
            "source": self.source,
            "distributionModel": self.distribution_model,
            "foodFormats": self.food_formats,
            "dietaryInfo": self.dietary_info,
            "website": self.website,
            "hoursStructured": self.hours_structured,
        }


# ── Hours Builder ────────────────────────────────────────────────────────────


def build_hours_string(hours: str, days: str) -> str:
    """Combine hours and days CSV columns into a human-readable string."""
    hours = (hours or "").strip()
    days = (days or "").strip()

    if hours and days:
        return f"{days}: {hours}"
    elif hours:
        return hours
    elif days:
        return days
    else:
        return "Hours not available"


# ── Inference Functions ──────────────────────────────────────────────────────

DISTRIBUTION_KEYWORDS = {
    "walk-in": ["walk-in", "walk in", "come to", "visit"],
    "drive-through": ["drive-through", "drive through", "drive-thru", "curbside", "drive-up"],
    "home-delivery": ["home deliver", "delivery", "delivered", "mobile pantry delivery"],
    "mobile-pantry": ["mobile pantry", "mobile food", "pop-up"],
    "by-appointment": ["by appointment", "appointment only", "call ahead"],
}


def infer_distribution_model(
    description: str, notes: str, categories: str, by_appointment: bool
) -> list:
    """Infer distribution model(s) from text fields."""
    text = f"{description} {notes} {categories}".lower()
    models = []

    for model, keywords in DISTRIBUTION_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            models.append(model)

    if by_appointment and "by-appointment" not in models:
        models.append("by-appointment")

    if not models:
        models = ["walk-in"]

    return models


FOOD_FORMAT_KEYWORDS = {
    "pre-bagged": ["pre-bagged", "prebagged", "pre-packed", "food box", "food bag"],
    "groceries": ["groceries", "grocery", "choice pantry", "client choice"],
    "hot-meals": ["hot meal", "hot food", "soup kitchen", "cooked meal", "prepared meal"],
    "produce": ["produce", "fresh fruit", "fresh vegetable", "farm"],
    "prepared-meals": ["prepared meal", "ready to eat", "frozen meal"],
    "shelf-stable": [
        "canned", "non-perishable", "nonperishable", "shelf stable",
        "dry goods", "perishable and nonperishable",
    ],
}


def infer_food_formats(description: str, categories: str, tags: list) -> list:
    """Infer food format(s) from text fields and tags."""
    text = f"{description} {categories} {' '.join(tags)}".lower()
    formats = []

    for fmt, keywords in FOOD_FORMAT_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            formats.append(fmt)

    if not formats:
        formats = ["groceries"]

    return formats


DIETARY_KEYWORDS = {
    "halal": ["halal"],
    "kosher": ["kosher"],
    "vegetarian": ["vegetarian", "vegan"],
    "gluten-free": ["gluten-free", "gluten free"],
    "diabetic-friendly": ["diabetic", "diabetes"],
    "low-sodium": ["low sodium", "low-sodium"],
}


def infer_dietary_info(description: str, categories: str) -> list:
    """Infer dietary accommodations from text fields."""
    text = f"{description} {categories}".lower()
    info = []

    for diet, keywords in DIETARY_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            info.append(diet)

    return info


# ── CSV Reader ───────────────────────────────────────────────────────────────


def read_unified_csv(csv_path: str = DEFAULT_CSV) -> list:
    """
    Read the unified CSV and map each row to a Place object.
    Skips rows with empty name or id.
    """
    places = []
    skipped = 0

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_id = (row.get("id") or "").strip()
            row_name = (row.get("name") or "").strip()

            if not row_id or not row_name:
                skipped += 1
                log.warning("Skipping row with empty id or name: %s", row)
                continue

            hours_str = build_hours_string(
                row.get("hours", ""), row.get("days", "")
            )

            categories_raw = row.get("categories", "")
            tags = [c.strip() for c in categories_raw.split(";") if c.strip()]

            description = row.get("description", "")

            # Validate ZIP
            raw_zip = (row.get("zip") or "").strip()
            if raw_zip and not ZIP_PATTERN.match(raw_zip):
                log.warning("Invalid ZIP format '%s' for %s — clearing", raw_zip, row_name)
                raw_zip = ""

            place = Place(
                id=row_id,
                name=row_name,
                address=row.get("street", "").strip(),
                city=row.get("city", "").strip(),
                state=row.get("state", "MD").strip(),
                zip=raw_zip,
                county=row.get("county", "").strip() or None,
                lat=None,
                lng=None,
                phone=row.get("phone", "").strip(),
                email=None,
                hours=hours_str,
                eligibility="",
                requirements=None,
                tags=tags,
                source=row.get("source", "").strip(),
                distribution_model=infer_distribution_model(
                    description, "", categories_raw, False
                ),
                food_formats=infer_food_formats(description, categories_raw, tags),
                dietary_info=infer_dietary_info(description, categories_raw),
                website=row.get("website", "").strip() or None,
                hours_structured=None,
            )
            places.append(place)

    if skipped:
        log.info("Skipped %d rows with empty id or name", skipped)
    log.info("Read %d places from %s", len(places), csv_path)
    return places


# ── Deduplication ────────────────────────────────────────────────────────────


def _count_populated(place: Place) -> int:
    """Count non-empty / non-None fields for merge preference."""
    count = 0
    for val in [
        place.name, place.address, place.city, place.state, place.zip,
        place.county, place.phone, place.email, place.hours, place.website,
        place.source, place.eligibility, place.requirements,
    ]:
        if val:
            count += 1
    count += len(place.tags)
    count += len(place.distribution_model)
    count += len(place.food_formats)
    count += len(place.dietary_info)
    return count


def deduplicate(places: list, threshold: float = 0.85) -> list:
    """
    Remove near-duplicate places using fuzzy matching on name + address.
    Keeps the record with more populated fields.
    """
    unique: list = []
    seen_keys: list = []

    for place in places:
        key = f"{place.name.lower().strip()} | {place.address.lower().strip()}"
        is_dup = False
        dup_index = -1

        for i, existing_key in enumerate(seen_keys):
            similarity = SequenceMatcher(None, key, existing_key).ratio()
            if similarity >= threshold:
                is_dup = True
                dup_index = i
                break

        if is_dup:
            # Keep the record with more populated fields
            if _count_populated(place) > _count_populated(unique[dup_index]):
                unique[dup_index] = place
                seen_keys[dup_index] = key
        else:
            unique.append(place)
            seen_keys.append(key)

    removed = len(places) - len(unique)
    if removed:
        log.info("Deduplication removed %d records (%d → %d)", removed, len(places), len(unique))
    return unique


# ── Geocoding ────────────────────────────────────────────────────────────────


def _load_geocode_cache() -> dict:
    """Load geocode cache from disk."""
    if os.path.exists(GEOCODE_CACHE_FILE):
        try:
            with open(GEOCODE_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            log.warning("Could not read geocode cache — starting fresh")
    return {}


def _save_geocode_cache(cache: dict) -> None:
    """Persist geocode cache to disk."""
    with open(GEOCODE_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


def _geocode_address(address_query: str, session) -> Optional[tuple]:
    """
    Query Nominatim for a single address.
    Returns (lat, lng) or None on failure.
    Applies exponential backoff on HTTP 429.
    """
    params = {
        "q": address_query,
        "format": "json",
        "limit": 1,
        "countrycodes": "us",
    }
    backoff = 2.0
    max_retries = 3

    for attempt in range(max_retries + 1):
        try:
            resp = session.get(NOMINATIM_URL, params=params, timeout=10)
            if resp.status_code == 429:
                if attempt < max_retries:
                    log.warning("Rate limited (429) — backing off %.1fs", backoff)
                    time.sleep(backoff)
                    backoff *= 2
                    continue
                else:
                    log.warning("Rate limited after %d retries — skipping", max_retries)
                    return None
            resp.raise_for_status()
            results = resp.json()
            if results:
                lat = float(results[0]["lat"])
                lng = float(results[0]["lon"])
                return (lat, lng)
            return None
        except Exception as e:
            log.warning("Geocoding error for '%s': %s", address_query, e)
            return None

    return None


def geocode_missing(places: list, delay_sec: float = 1.1) -> list:
    """
    For each place with lat=None or lng=None, query Nominatim.
    Uses geocode_cache.json for caching. Respects rate limit.
    """
    if requests is None:
        log.warning("requests library not available — skipping geocoding")
        return places

    cache = _load_geocode_cache()
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    geocoded = 0
    cache_hits = 0
    failures = 0

    for place in places:
        if place.lat is not None and place.lng is not None:
            continue

        # Build query string
        parts = [p for p in [place.address, place.city, place.state, place.zip] if p]
        query = ", ".join(parts)
        if not query:
            failures += 1
            continue

        # Check cache
        if query in cache:
            coords = cache[query]
            if coords:
                place.lat, place.lng = coords
            cache_hits += 1
            continue

        # Query Nominatim
        time.sleep(delay_sec)
        result = _geocode_address(query, session)

        if result:
            cache[query] = list(result)
            place.lat, place.lng = result
            geocoded += 1
        else:
            cache[query] = None
            failures += 1
            log.warning("Failed to geocode: %s", query)

    _save_geocode_cache(cache)
    log.info(
        "Geocoding: %d new, %d cached, %d failed",
        geocoded, cache_hits, failures,
    )
    return places


# ── Coordinate Bounds Validation ─────────────────────────────────────────────


def validate_coordinates(places: list) -> list:
    """
    Set lat/lng to None for values outside Maryland/DC range.
    lat: 37.0–40.0, lng: -80.0 to -75.0
    """
    invalidated = 0
    for place in places:
        if place.lat is not None and place.lng is not None:
            if not (LAT_MIN <= place.lat <= LAT_MAX and LNG_MIN <= place.lng <= LNG_MAX):
                log.warning(
                    "Coordinates out of bounds for '%s': (%.4f, %.4f) — setting to null",
                    place.name, place.lat, place.lng,
                )
                place.lat = None
                place.lng = None
                invalidated += 1
    if invalidated:
        log.info("Invalidated %d out-of-bounds coordinates", invalidated)
    return places


# ── Main Pipeline ────────────────────────────────────────────────────────────


def convert_to_catalog(
    csv_path: str = DEFAULT_CSV,
    output_path: str = DEFAULT_OUTPUT,
    frontend_copy_path: str = DEFAULT_FRONTEND_COPY,
    geocode: bool = True,
) -> dict:
    """
    Main entry point. Reads the unified CSV, enriches fields,
    deduplicates, geocodes, validates, and writes catalog.json.
    """
    # 1. Check CSV exists
    if not os.path.exists(csv_path):
        log.error("Unified CSV not found: %s", csv_path)
        sys.exit(1)

    # 2. Read unified CSV
    places = read_unified_csv(csv_path)
    if not places:
        log.error("No valid places read from CSV")
        sys.exit(1)

    # 3. Deduplicate
    places = deduplicate(places)

    # 4. Geocode (optional)
    if geocode:
        places = geocode_missing(places)

    # 5. Validate coordinates
    places = validate_coordinates(places)

    # 6. Build source metadata
    source_counts: dict = {}
    for p in places:
        src = p.source or "unknown"
        source_counts[src] = source_counts.get(src, 0) + 1

    now = datetime.now(timezone.utc).isoformat()
    sources = [
        {
            "id": src,
            "name": src,
            "recordCount": count,
            "lastUpdated": now,
        }
        for src, count in sorted(source_counts.items())
    ]

    # 7. Build catalog
    catalog = {
        "schemaVersion": "2.0.0",
        "generatedAt": now,
        "sources": sources,
        "places": [p.to_dict() for p in places],
        "opportunities": [],
    }

    # 8. Write primary output (source of truth)
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)
    log.info("Wrote %d places to %s", len(places), output_path)

    # 9. Copy to frontend
    os.makedirs(os.path.dirname(frontend_copy_path) or ".", exist_ok=True)
    shutil.copy2(output_path, frontend_copy_path)
    log.info("Copied to %s", frontend_copy_path)

    return catalog


# ── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert unified CSV to catalog.json"
    )
    parser.add_argument(
        "--no-geocode",
        action="store_true",
        help="Skip geocoding step",
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT,
        help=f"Primary output path (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--frontend-copy",
        default=DEFAULT_FRONTEND_COPY,
        help=f"Frontend copy path (default: {DEFAULT_FRONTEND_COPY})",
    )
    args = parser.parse_args()

    catalog = convert_to_catalog(
        geocode=not args.no_geocode,
        output_path=args.output,
        frontend_copy_path=args.frontend_copy,
    )
    print(f"\nDone. Wrote {len(catalog['places'])} places to {args.output}")
    print(f"Copied to {args.frontend_copy}")
