"""
unify_cafb.py
-------------
Merges the two CAFB food-assistance location files into a single clean CSV:
    data/unified/consumer/food_banks_cafb.csv

Sources:
    - data/consumer/cafb_food_assistance/cafb_food_assistance_locations.csv
      → 382 rows, has Reqs_[day] columns (mostly empty), is the superset
    - data/cleaned/cafb_food_assistance_locations.csv
      → 273 rows (subset), has county_clean column worth keeping

Strategy:
    1. Use consumer file as the base (all 382 rows)
    2. Port county_clean from cleaned for the 273 overlapping ObjectIds
    3. Derive county_clean for the 109 new rows (strip "MD " prefix from county_name)
    4. Drop Reqs_[day] columns (>99% empty)
    5. Normalise column names to snake_case
    6. Output unified file
"""

import re
import pandas as pd

# ── Paths ────────────────────────────────────────────────────────────────────
CLEANED_PATH  = r"C:\Users\proto\NAFSI_Track2\data\cleaned\cafb_food_assistance_locations.csv"
CONSUMER_PATH = r"C:\Users\proto\NAFSI_Track2\data\consumer\cafb_food_assistance\cafb_food_assistance_locations.csv"
OUT_PATH      = r"C:\Users\proto\NAFSI_Track2\data\unified\consumer\food_banks_cafb.csv"

# ── Helpers ──────────────────────────────────────────────────────────────────

def derive_county_clean(county_name: str) -> str:
    """Strip leading state prefix like 'MD ' from county_name."""
    if not isinstance(county_name, str):
        return ""
    return re.sub(r"^[A-Z]{2}\s+", "", county_name.strip())

def to_snake_case(col: str) -> str:
    """Convert CamelCase / PascalCase / mixed column names to snake_case."""
    col = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", col)
    col = re.sub(r"([a-z\d])([A-Z])", r"\1_\2", col)
    col = col.replace(" ", "_").replace("-", "_")
    return col.lower()

# ── Load ─────────────────────────────────────────────────────────────────────

print("Loading files...")
consumer = pd.read_csv(CONSUMER_PATH, dtype=str).fillna("")
cleaned  = pd.read_csv(CLEANED_PATH,  dtype=str).fillna("")

print(f"  consumer: {len(consumer)} rows, {len(consumer.columns)} cols")
print(f"  cleaned : {len(cleaned)} rows,  {len(cleaned.columns)} cols")

# ── Drop Reqs_ columns (noise) ───────────────────────────────────────────────

reqs_cols = [c for c in consumer.columns if c.startswith("Reqs_")]
print(f"\nDropping {len(reqs_cols)} Reqs_ columns (mostly empty): {reqs_cols}")
consumer.drop(columns=reqs_cols, inplace=True)

# ── Port county_clean from cleaned ───────────────────────────────────────────

county_map = cleaned.set_index("ObjectId")["county_clean"].to_dict()

consumer["county_clean"] = consumer["ObjectId"].map(county_map)

# Fill gaps for the 109 rows not in cleaned — derive from county_name
mask = consumer["county_clean"].isna()
consumer.loc[mask, "county_clean"] = consumer.loc[mask, "county_name"].apply(derive_county_clean)
consumer["county_clean"] = consumer["county_clean"].fillna("")

print(f"\ncounty_clean ported from cleaned : {(~mask).sum()}")
print(f"county_clean derived from name   : {mask.sum()}")

# ── Rename columns to snake_case ─────────────────────────────────────────────

rename_map = {c: to_snake_case(c) for c in consumer.columns}
consumer.rename(columns=rename_map, inplace=True)

# Manual fixes for a few known names
consumer.rename(columns={
    "date_of_last_so":         "date_of_last_update",
    "t_e_f_a_p":               "tefap",
    "t_e_f_a_p_auto_eligible": "tefap_auto_eligible",
    "t_e_f_a_p_income_levels": "tefap_income_levels",
}, inplace=True)

# ── Final column order ────────────────────────────────────────────────────────

# Core identity + location
core = ["object_id", "agency_ref", "name", "address1", "address2",
        "city", "state", "county_name", "county_clean", "zip",
        "latitude", "longitude"]

# Contact
contact = ["phone", "email"]

# TEFAP
tefap = ["tefap", "tefap_auto_eligible", "tefap_income_levels"]

# Hours block (all remaining hours/appointment/residents/notes columns)
hours_cols = [c for c in consumer.columns
              if any(c.startswith(p) for p in
                     ("hours_", "by_appointment", "residents_only", "notes_"))]
hours_cols.sort()  # group Mon→Sun naturally

# Metadata
meta = ["date_of_last_update"]

all_cols = core + contact + tefap + hours_cols + meta

# Include any column we might have missed
remaining = [c for c in consumer.columns if c not in all_cols]
if remaining:
    print(f"\nExtra cols appended at end: {remaining}")
all_cols += remaining

consumer = consumer[all_cols]

# ── Save ─────────────────────────────────────────────────────────────────────

consumer.to_csv(OUT_PATH, index=False)

print(f"\nDone.")
print(f"  Total rows   : {len(consumer)}")
print(f"  Total columns: {len(consumer.columns)}")
print(f"  Output       : {OUT_PATH}")

print("\n=== Completeness (non-empty %) ===")
core_check = ["name", "address1", "city", "state", "zip",
              "county_clean", "phone", "email", "latitude", "longitude"]
for col in core_check:
    pct = (consumer[col] != "").mean() * 100
    print(f"  {col:15s}: {pct:.1f}%")

print("\n=== County breakdown (top 10) ===")
print(consumer["county_clean"].value_counts().head(10).to_string())
