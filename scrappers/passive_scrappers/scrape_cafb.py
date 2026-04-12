#!/usr/bin/env python3
"""
Scrape all food assistance location data from Capital Area Food Bank's
ArcGIS Feature Service and save to CSV.

Source: https://www.capitalareafoodbank.org/find-food-assistance/
Data API: ArcGIS FeatureServer - Active_Agencies_Last_45_Days
"""

import json
import csv
import urllib.request
import urllib.parse
import sys
from datetime import datetime, timezone

BASE_URL = (
    "https://services.arcgis.com/oCjyzxNy34f0pJCV/arcgis/rest/services/"
    "Active_Agencies_Last_45_Days/FeatureServer/0/query"
)

# All attribute fields we want to extract
FIELDS = [
    "ObjectId", "agency_ref", "name", "address1", "address2", "city", "state",
    "county_name", "zip", "phone", "email", "tefap", "latitude", "longitude",
    "Date_of_Last_SO",
    "Hours_Monday", "ByAppointmentOnly_Monday", "ResidentsOnly_Monday",
    "Notes_Monday", "Reqs_Monday",
    "Hours_Tuesday", "ByAppointmentOnly_Tuesday", "ResidentsOnly_Tuesday",
    "Notes_Tuesday", "Reqs_Tuesday",
    "Hours_Wednesday", "ByAppointmentOnly_Wednesday", "ResidentsOnly_Wednesday",
    "Notes_Wednesday", "Reqs_Wednesday",
    "Hours_Thursday", "ByAppointmentOnly_Thursday", "ResidentsOnly_Thursday",
    "Notes_Thursday", "Reqs_Thursday",
    "Hours_Friday", "ByAppointmentOnly_Friday", "ResidentsOnly_Friday",
    "Notes_Friday", "Reqs_Friday",
    "Hours_Saturday", "ByAppointmentOnly_Saturday", "ResidentsOnly_Saturday",
    "Notes_Saturday", "Reqs_Saturday",
    "Hours_Sunday", "ByAppointmentOnly_Sunday", "ResidentsOnly_Sunday",
    "Notes_Sunday", "Reqs_Sunday",
    "TEFAP_Auto_Eligible", "TEFAP_Income_Levels",
]

PAGE_SIZE = 1000


def fetch_page(offset):
    """Fetch a page of results from the ArcGIS Feature Service."""
    params = urllib.parse.urlencode({
        "where": "1=1",
        "outFields": "*",
        "returnGeometry": "false",
        "resultOffset": offset,
        "resultRecordCount": PAGE_SIZE,
        "f": "json",
    })
    url = f"{BASE_URL}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def convert_epoch(val):
    """Convert epoch milliseconds to readable date string, or return as-is."""
    if val is None:
        return ""
    try:
        return datetime.fromtimestamp(val / 1000, tz=timezone.utc).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
    except (TypeError, ValueError, OSError):
        return str(val)


def main():
    all_features = []
    offset = 0

    print("Fetching data from Capital Area Food Bank ArcGIS service...")
    while True:
        print(f"  Fetching records {offset} - {offset + PAGE_SIZE - 1}...")
        data = fetch_page(offset)

        features = data.get("features", [])
        if not features:
            break

        all_features.extend(features)
        print(f"  Got {len(features)} records (total so far: {len(all_features)})")

        # Check if there are more records
        if not data.get("exceededTransferLimit", False):
            break
        offset += PAGE_SIZE

    if not all_features:
        print("No data found!")
        sys.exit(1)

    print(f"\nTotal locations fetched: {len(all_features)}")

    # Write to CSV
    output_file = "cafb_food_assistance_locations.csv"
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()

        for feature in all_features:
            attrs = feature.get("attributes", {})
            row = {}
            for field in FIELDS:
                val = attrs.get(field, "")
                if field == "Date_of_Last_SO":
                    val = convert_epoch(val)
                elif val is None:
                    val = ""
                row[field] = val
            writer.writerow(row)

    print(f"Data saved to: {output_file}")

    # Also save raw JSON for reference
    json_file = "cafb_food_assistance_locations.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(
            [feat.get("attributes", {}) for feat in all_features],
            f,
            indent=2,
            ensure_ascii=False,
        )
    print(f"Raw JSON saved to: {json_file}")


if __name__ == "__main__":
    main()
