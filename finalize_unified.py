"""
finalize_unified.py
-------------------
Fixes the 2 dirty files and adds the 4 missing files in data/unified/.

Actions:
  CLEAN  consumer/market_data.csv           — snake_case cols, title-case values
  CLEAN  consumer/snap_retailer_locator.csv — fix typo, snake_case, drop Zip4
  ADD    donor/market_data.csv              — copy of cleaned market_data
  ADD    donor/tracts_with_municipality.csv — cleaned tracts (from data/cleaned/)
  ADD    consumer/tracts_with_municipality.csv
  ADD    volunteer/farmers_markets.csv      — copy of consumer/farmers_markets.csv
"""

import shutil
import pandas as pd
from pathlib import Path

UNIFIED = Path(r"C:\Users\proto\NAFSI_Track2\data\unified")
CLEANED = Path(r"C:\Users\proto\NAFSI_Track2\data\cleaned")

# ── Helper ────────────────────────────────────────────────────────────────────

def save(df: pd.DataFrame, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
    print(f"  saved  {path.relative_to(UNIFIED.parent.parent)}  ({len(df)} rows, {len(df.columns)} cols)")

# ─────────────────────────────────────────────────────────────────────────────
# 1. CLEAN  consumer/market_data.csv
# ─────────────────────────────────────────────────────────────────────────────
print("\n[1] Cleaning consumer/market_data.csv")
mk = pd.read_csv(UNIFIED / "consumer" / "market_data.csv", dtype=str).fillna("")

mk.rename(columns={
    "Name":     "name",
    "Address":  "address",
    "City":     "city",
    "State":    "state",
    "Zip":      "zip",
    "Category": "category",
}, inplace=True)

# Normalise all-caps name/address/city → Title Case
for col in ["name", "address", "city"]:
    mk[col] = mk[col].str.title()

# Standardise category labels
mk["category"] = mk["category"].str.strip().replace({
    "Grocery Store- Medium": "Grocery Store (Medium)",
    "Grocery Store - Large": "Grocery Store (Large)",
})

save(mk, UNIFIED / "consumer" / "market_data.csv")

# ─────────────────────────────────────────────────────────────────────────────
# 2. CLEAN  consumer/snap_retailer_locator.csv
# ─────────────────────────────────────────────────────────────────────────────
print("\n[2] Cleaning consumer/snap_retailer_locator.csv")
snap = pd.read_csv(UNIFIED / "consumer" / "snap_retailer_locator.csv", dtype=str).fillna("")

snap.rename(columns={
    "Record_ID":           "record_id",
    "ObjectId":            "object_id",
    "Store_Name":          "name",
    "State":               "state",
    "City":                "city",
    "Additonal_Address":   "additional_address",   # fix typo
    "County":              "county",
    "Latitude":            "latitude",
    "Longitude":           "longitude",
    "Store_Street_Address":"address",
    "Store_Type":          "store_type",
    "Zip_Code":            "zip",
}, inplace=True)

# Drop redundant Zip4 (already have zip)
snap.drop(columns=["Zip4"], errors="ignore", inplace=True)

# Consistent column order
snap = snap[["record_id", "object_id", "name", "address", "additional_address",
             "city", "county", "state", "zip", "latitude", "longitude", "store_type"]]

save(snap, UNIFIED / "consumer" / "snap_retailer_locator.csv")

# ─────────────────────────────────────────────────────────────────────────────
# 3. CLEAN tracts source → build reusable cleaned version
# ─────────────────────────────────────────────────────────────────────────────
print("\n[3/4] Building tracts_with_municipality.csv (consumer + donor)")
tr = pd.read_csv(CLEANED / "tracts_with_municipality.csv", dtype=str).fillna("")

tr.rename(columns={
    "TRACT_ID":          "tract_id",
    "TRACT_ID2":         "tract_id2",
    "Healthy":           "healthy_store_count",
    "Unhealthy":         "unhealthy_store_count",
    "RFEI":              "rfei",
    "HFPA":              "is_healthy_food_priority_area",
    "Tier":              "tier",
    "MUNICIPALITY_NAME": "municipality_name",
    "MUNICIPALITY_CITY": "municipality_city",
    "MUNICIPALITY_ZIP":  "municipality_zip",
}, inplace=True)

# Normalise HFPA to boolean-like
tr["is_healthy_food_priority_area"] = tr["is_healthy_food_priority_area"].str.strip().str.title()

save(tr, UNIFIED / "consumer" / "tracts_with_municipality.csv")
save(tr, UNIFIED / "donor"    / "tracts_with_municipality.csv")

# ─────────────────────────────────────────────────────────────────────────────
# 4. ADD donor/market_data.csv  (copy of cleaned consumer version)
# ─────────────────────────────────────────────────────────────────────────────
print("\n[5] Adding donor/market_data.csv")
save(mk, UNIFIED / "donor" / "market_data.csv")

# ─────────────────────────────────────────────────────────────────────────────
# 5. ADD volunteer/farmers_markets.csv  (copy of consumer version)
# ─────────────────────────────────────────────────────────────────────────────
print("\n[6] Adding volunteer/farmers_markets.csv")
fm = pd.read_csv(UNIFIED / "consumer" / "farmers_markets.csv", dtype=str).fillna("")
save(fm, UNIFIED / "volunteer" / "farmers_markets.csv")

# ─────────────────────────────────────────────────────────────────────────────
# Final inventory
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== Final unified/ inventory ===")
for f in sorted(UNIFIED.rglob("*.csv")):
    rel = f.relative_to(UNIFIED)
    rows = sum(1 for _ in open(f, encoding="utf-8")) - 1
    print(f"  {str(rel):<52} {rows:>5} rows")
