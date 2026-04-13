#!/usr/bin/env python3
"""
filter_food_only.py
===================
Reads data/211md_food_pantries.json and keeps only records where
the word "food" appears anywhere in the categories field.

Overwrites both JSON and CSV with the filtered data.
"""

import csv
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(SCRIPT_DIR, "..", "data")
JSON_PATH  = os.path.join(DATA_DIR, "211md_food_pantries.json")
CSV_PATH   = os.path.join(DATA_DIR, "211md_food_pantries.csv")

CSV_FIELDS = [
    "id", "name", "address", "phone", "email", "website",
    "description", "categories", "hours",
    "eligibility", "service_area", "providing_org", "url",
]


def has_food_in_categories(record: dict) -> bool:
    cats = record.get("categories", [])
    if isinstance(cats, list):
        return any("food" in c.lower() for c in cats)
    elif isinstance(cats, str):
        return "food" in cats.lower()
    return False


def main():
    with open(JSON_PATH, encoding="utf-8") as f:
        records = json.load(f)

    total_before = len(records)
    filtered = [r for r in records if has_food_in_categories(r)]
    removed  = [r for r in records if not has_food_in_categories(r)]

    print(f"Total before filter : {total_before}")
    print(f"Total after filter  : {len(filtered)}")
    print(f"Removed             : {len(removed)}")

    if removed:
        print("\nRemoved records (no 'food' in categories):")
        for r in removed:
            cats = r.get("categories", [])
            print(f"  - {r['name'][:60]}  |  categories: {cats}")

    # Overwrite JSON
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(filtered, f, indent=2, ensure_ascii=False)
    print(f"\n[Saved] JSON -> {os.path.abspath(JSON_PATH)}  ({len(filtered)} records)")

    # Overwrite CSV
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        for r in filtered:
            row = dict(r)
            if isinstance(row.get("categories"), list):
                row["categories"] = "; ".join(row["categories"])
            writer.writerow(row)
    print(f"[Saved] CSV  -> {os.path.abspath(CSV_PATH)}  ({len(filtered)} records)")


if __name__ == "__main__":
    main()
