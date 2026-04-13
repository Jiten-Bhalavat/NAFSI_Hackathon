"""
Data Cleaning Script for NourishNet Hackathon
==============================================
Cleans all data files in the data/ folder:
1. Removes exact duplicate files across consumer/donor/planner folders
2. Filters to only Maryland (MD) and Washington DC data
3. Removes redundant/overlapping records within datasets
4. Removes non-food-relevant data (school board geo-polygons)
5. Cleans up the food_pantry3 dataset (removes non-MD/DC entries)
6. Consolidates cleaned data into data/cleaned/
"""

import pandas as pd
import json
import os
import shutil

CLEANED_DIR = "data/cleaned"
os.makedirs(CLEANED_DIR, exist_ok=True)

print("=" * 60)
print("NourishNet Data Cleaning")
print("=" * 60)

# ─────────────────────────────────────────────
# 1. REMOVE DUPLICATE FILES
# ─────────────────────────────────────────────
print("\n[1] Identifying and removing duplicate files...")

# These pairs are byte-identical:
duplicates_to_remove = [
    # donor/Pantry/food_pantries_in_md_appendix_iv.csv == consumer version
    "data/donor/Pantry/food_pantries_in_md_appendix_iv.csv",
    # donor/Pantry/maryland_food_resources.csv == consumer version
    "data/donor/Pantry/maryland_food_resources.csv",
    # planner/School_PG_County/* == donor/School_PG_County/*
    "data/planner/School_PG_County/SchoolBoardDistricts_20260412.csv",
    "data/planner/School_PG_County/School_Board_Districts_20260412.csv",
]

for f in duplicates_to_remove:
    if os.path.exists(f):
        print(f"  Duplicate: {f}")

# ─────────────────────────────────────────────
# 2. CLEAN CAFB FOOD ASSISTANCE (consumer)
#    Keep only MD and DC, remove VA and "Outside CAFB Service Area"
# ─────────────────────────────────────────────
print("\n[2] Cleaning CAFB Food Assistance Locations...")
cafb = pd.read_csv("data/consumer/cafb_food_assistance/cafb_food_assistance_locations.csv")
print(f"  Original rows: {len(cafb)}")

# Filter to MD and DC only
cafb_clean = cafb[cafb["county_name"].str.startswith(("MD ", "DC "), na=False)].copy()
print(f"  After removing VA and outside-area: {len(cafb_clean)}")

# Drop fully duplicate rows
cafb_clean.drop_duplicates(inplace=True)
print(f"  After dedup: {len(cafb_clean)}")

cafb_clean.to_csv(f"{CLEANED_DIR}/cafb_food_assistance_locations.csv", index=False)

# Also clean the JSON version
with open("data/consumer/cafb_food_assistance/cafb_food_assistance_locations.json", "r", encoding="utf-8") as f:
    cafb_json = json.load(f)

cafb_json_clean = [
    r for r in cafb_json
    if isinstance(r.get("county_name"), str) and
    (r["county_name"].startswith("MD ") or r["county_name"].startswith("DC "))
]
print(f"  JSON: {len(cafb_json)} -> {len(cafb_json_clean)}")

with open(f"{CLEANED_DIR}/cafb_food_assistance_locations.json", "w", encoding="utf-8") as f:
    json.dump(cafb_json_clean, f, indent=2)

# ─────────────────────────────────────────────
# 3. CLEAN SNAP RETAILER LOCATOR (already MD+DC only)
# ─────────────────────────────────────────────
print("\n[3] Cleaning SNAP Retailer Locator...")
snap = pd.read_csv("data/consumer/snap_retailer_locator/snap_retailer_locator_2026-04-12.csv")
print(f"  Original rows: {len(snap)}")

# Already MD and DC only, just dedup
snap_clean = snap.drop_duplicates(subset=["Store_Name", "Store_Street_Address", "City", "Zip_Code"])
print(f"  After dedup: {len(snap_clean)}")

snap_clean.to_csv(f"{CLEANED_DIR}/snap_retailer_locator.csv", index=False)

# ─────────────────────────────────────────────
# 4. CLEAN FOOD PANTRY 3 (211MD data)
#    Remove non-MD/DC entries (e.g., Chicago IL)
# ─────────────────────────────────────────────
print("\n[4] Cleaning food_pantry3 (211MD)...")
fp3 = pd.read_csv("data/food_pantry3.csv")
print(f"  Original rows: {len(fp3)}")

# Keep only rows with MD or DC in address
md_dc_mask = fp3["address"].str.contains(r"\bMD\b|\bDC\b|Maryland|Washington, D\.?C", case=False, na=False)
fp3_clean = fp3[md_dc_mask].copy()
fp3_clean.drop_duplicates(subset=["name", "address"], inplace=True)
print(f"  After filtering to MD/DC and dedup: {len(fp3_clean)}")

fp3_clean.to_csv(f"{CLEANED_DIR}/food_pantry3.csv", index=False)

# Also clean the JSON version
with open("data/food_pantry3.json", "r", encoding="utf-8") as f:
    fp3_json = json.load(f)

import re
md_dc_pattern = re.compile(r"\bMD\b|\bDC\b|Maryland|Washington,?\s*D\.?C", re.IGNORECASE)
fp3_json_clean = [r for r in fp3_json if md_dc_pattern.search(r.get("address", ""))]

# Deduplicate by name+address
seen = set()
fp3_json_dedup = []
for r in fp3_json_clean:
    key = (r.get("name", ""), r.get("address", ""))
    if key not in seen:
        seen.add(key)
        fp3_json_dedup.append(r)

print(f"  JSON: {len(fp3_json)} -> {len(fp3_json_dedup)}")

with open(f"{CLEANED_DIR}/food_pantry3.json", "w", encoding="utf-8") as f:
    json.dump(fp3_json_dedup, f, indent=2)

# ─────────────────────────────────────────────
# 5. CLEAN MARYLAND FOOD RESOURCES (consumer version is canonical)
# ─────────────────────────────────────────────
print("\n[5] Cleaning Maryland Food Resources...")
mfr = pd.read_csv("data/consumer/Pantry/maryland_food_resources.csv", engine="python", on_bad_lines="warn")
print(f"  Original rows: {len(mfr)}")

mfr_clean = mfr.drop_duplicates(subset=["name", "address"])
print(f"  After dedup: {len(mfr_clean)}")

mfr_clean.to_csv(f"{CLEANED_DIR}/maryland_food_resources.csv", index=False)

# ─────────────────────────────────────────────
# 6. CLEAN FOOD PANTRIES IN MD APPENDIX IV (consumer version is canonical)
# ─────────────────────────────────────────────
print("\n[6] Cleaning Food Pantries in MD (Appendix IV)...")
fp_iv = pd.read_csv("data/consumer/Pantry/food_pantries_in_md_appendix_iv.csv", engine="python", on_bad_lines="warn")
print(f"  Original rows: {len(fp_iv)}")

fp_iv_clean = fp_iv.drop_duplicates(subset=["name", "address"])
print(f"  After dedup: {len(fp_iv_clean)}")

fp_iv_clean.to_csv(f"{CLEANED_DIR}/food_pantries_in_md_appendix_iv.csv", index=False)

# ─────────────────────────────────────────────
# 7. CLEAN CAROLINE FOOD PANTRIES FLYER
# ─────────────────────────────────────────────
print("\n[7] Cleaning Caroline Food Pantries Flyer...")
caroline = pd.read_csv("data/consumer/Pantry/caroline_food_pantries_flyer_2026-02-10_locations.csv")
print(f"  Rows: {len(caroline)} (all Caroline County, MD - keeping as-is)")

caroline.to_csv(f"{CLEANED_DIR}/caroline_food_pantries.csv", index=False)

# ─────────────────────────────────────────────
# 8. CLEAN PANTRY2 (donor)
# ─────────────────────────────────────────────
print("\n[8] Cleaning Pantry2 (donor)...")
p2 = pd.read_csv("data/donor/Pantry/Pantry2.csv")
print(f"  Original rows: {len(p2)}")

# Filter to MD/DC addresses
p2_md_dc = p2[p2["address"].str.contains(r"\bMD\b|\bDC\b", case=False, na=False)].copy()
p2_md_dc.drop_duplicates(subset=["name", "address"], inplace=True)
print(f"  After filtering to MD/DC and dedup: {len(p2_md_dc)}")

p2_md_dc.to_csv(f"{CLEANED_DIR}/pantry2_donors.csv", index=False)

# ─────────────────────────────────────────────
# 9. CLEAN FEEDING AMERICA MARYLAND (planner)
# ─────────────────────────────────────────────
print("\n[9] Cleaning Feeding America Maryland...")
fa = pd.read_csv("data/planner/feeding_america_maryland/feeding_america_maryland.csv")
print(f"  Original rows: {len(fa)}")

# Remove rows with scrape errors
fa_clean = fa[fa["scrape_error"].isna() | (fa["scrape_error"] == "")].copy()
fa_clean.drop_duplicates(inplace=True)
print(f"  After removing scrape errors and dedup: {len(fa_clean)}")

fa_clean.to_csv(f"{CLEANED_DIR}/feeding_america_maryland.csv", index=False)

# ─────────────────────────────────────────────
# 10. CLEAN FARMERS MARKET DATA (planner)
# ─────────────────────────────────────────────
print("\n[10] Cleaning Farmers Market data...")
fm = pd.read_csv("data/planner/Farmers_Market/Farmers_Market_20260412.csv")
print(f"  Farmers Market rows: {len(fm)} (all PG County/MD area - keeping as-is)")
fm.to_csv(f"{CLEANED_DIR}/farmers_market.csv", index=False)

# Market data (grocery stores)
md_market = pd.read_csv("data/planner/Farmers_Market/market_data.csv")
print(f"  Market data rows: {len(md_market)} (all MD - keeping as-is)")
md_market.to_csv(f"{CLEANED_DIR}/market_data.csv", index=False)

# Tracts with municipality
tracts = pd.read_csv("data/planner/Farmers_Market/tracts_with_municipality.csv")
print(f"  Tracts data rows: {len(tracts)} (census tract data - keeping as-is)")
tracts.to_csv(f"{CLEANED_DIR}/tracts_with_municipality.csv", index=False)

# ─────────────────────────────────────────────
# 11. SCHOOL BOARD DISTRICTS - Keep only the non-geo version
#     The geo version (SchoolBoardDistricts) has massive polygon data
# ─────────────────────────────────────────────
print("\n[11] Handling School Board Districts...")

# Both School Board files have the_geom column with massive polygon data
# Read and drop the geo column to keep only useful tabular data
sbd = pd.read_csv("data/donor/School_PG_County/School_Board_Districts_20260412.csv")
print(f"  School Board Districts rows: {len(sbd)}")
# Drop the massive geometry column
if "the_geom" in sbd.columns:
    sbd = sbd.drop(columns=["the_geom"])
    print("  Dropped the_geom column (massive polygon data)")
sbd.to_csv(f"{CLEANED_DIR}/school_board_districts_pg_county.csv", index=False)
print("  Skipping SchoolBoardDistricts (geo-polygon file) - redundant")

# ─────────────────────────────────────────────
# 12. CROSS-DATASET OVERLAP ANALYSIS
# ─────────────────────────────────────────────
print("\n[12] Cross-dataset overlap analysis...")

# Check overlap between maryland_food_resources and food_pantries_in_md_appendix_iv
# They share similar structure but appendix_iv has contact info
mfr_names = set(mfr_clean["name"].str.lower().str.strip())
fp_iv_names = set(fp_iv_clean["name"].str.lower().str.strip())
overlap = mfr_names & fp_iv_names
print(f"  maryland_food_resources vs appendix_iv name overlap: {len(overlap)} names")
print(f"  maryland_food_resources unique: {len(mfr_names - fp_iv_names)}")
print(f"  appendix_iv unique: {len(fp_iv_names - mfr_names)}")

# Since appendix_iv has more columns (contact, phone), merge them
# maryland_food_resources has: type, county, name, address, hours, days
# appendix_iv has: type, county, name, address, contact, phone, hours, days
# Merge: keep appendix_iv as base, add any unique entries from maryland_food_resources
merged_pantries = fp_iv_clean.copy()
mfr_unique = mfr_clean[~mfr_clean["name"].str.lower().str.strip().isin(fp_iv_names)]
if len(mfr_unique) > 0:
    # Add missing columns
    for col in ["contact", "phone"]:
        if col not in mfr_unique.columns:
            mfr_unique[col] = ""
    # Reorder columns to match
    mfr_unique = mfr_unique.reindex(columns=merged_pantries.columns, fill_value="")
    merged_pantries = pd.concat([merged_pantries, mfr_unique], ignore_index=True)

merged_pantries.drop_duplicates(subset=["name", "address"], inplace=True)
print(f"  Merged MD pantries (appendix_iv + unique from food_resources): {len(merged_pantries)}")
merged_pantries.to_csv(f"{CLEANED_DIR}/md_pantries_merged.csv", index=False)

# ─────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────
print("\n" + "=" * 60)
print("CLEANING SUMMARY")
print("=" * 60)

cleaned_files = [f for f in os.listdir(CLEANED_DIR) if f.endswith(('.csv', '.json'))]
print(f"\nCleaned files written to {CLEANED_DIR}/:")
for f in sorted(cleaned_files):
    size = os.path.getsize(os.path.join(CLEANED_DIR, f))
    print(f"  {f} ({size:,} bytes)")

print(f"\nDuplicate files identified (kept canonical versions):")
for f in duplicates_to_remove:
    print(f"  {f}")

print(f"\nData removed:")
print(f"  - VA records from CAFB ({len(cafb) - len(cafb_clean)} rows)")
print(f"  - Non-MD/DC from food_pantry3 ({len(fp3) - len(fp3_clean)} rows)")
print(f"  - Non-MD/DC from Pantry2 ({len(p2) - len(p2_md_dc)} rows)")
print(f"  - SchoolBoardDistricts geo-polygon file (massive, not useful for app)")
print(f"  - Duplicate files across consumer/donor/planner folders")

print("\nDone!")
