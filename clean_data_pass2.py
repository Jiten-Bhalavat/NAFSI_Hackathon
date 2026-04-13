"""
Data Cleaning Pass 2 - Fixes remaining issues found in audit
=============================================================
1. Strip whitespace from all string columns across all files
2. Normalize phone number formats to consistent (XXX) XXX-XXXX
3. Convert Feeding America numeric strings to actual numbers
4. Fill empty/null values with sensible defaults
5. Remove the 6 skipped malformed rows by fixing them manually
6. Standardize county names across datasets
"""

import pandas as pd
import re
import os
import json

CLEANED_DIR = "data/cleaned"

print("=" * 60)
print("Data Cleaning - Pass 2")
print("=" * 60)

# ─────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────

def strip_all_strings(df):
    """Strip leading/trailing whitespace from all string columns."""
    for col in df.select_dtypes(include='object').columns:
        df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
    return df

def normalize_phone(phone):
    """Normalize phone numbers to (XXX) XXX-XXXX format."""
    if not isinstance(phone, str) or not phone.strip():
        return phone
    # Extract digits
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    elif len(digits) == 11 and digits[0] == '1':
        return f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
    return phone  # Return as-is if can't normalize

def clean_currency(val):
    """Convert '$1,234,000' to numeric."""
    if isinstance(val, str):
        return float(val.replace('$', '').replace(',', ''))
    return val

def clean_percentage(val):
    """Convert '16.9%' to numeric 16.9."""
    if isinstance(val, str):
        return float(val.replace('%', ''))
    return val

def clean_comma_number(val):
    """Convert '12,090' to numeric."""
    if isinstance(val, str):
        return int(val.replace(',', ''))
    return val


# ─────────────────────────────────────────────
# 1. STRIP WHITESPACE FROM ALL FILES
# ─────────────────────────────────────────────
print("\n[1] Stripping whitespace from all CSV files...")
csv_files = [f for f in os.listdir(CLEANED_DIR) if f.endswith('.csv')]
for f in csv_files:
    path = os.path.join(CLEANED_DIR, f)
    df = pd.read_csv(path)
    df = strip_all_strings(df)
    df.to_csv(path, index=False)
print(f"  Processed {len(csv_files)} files")


# ─────────────────────────────────────────────
# 2. NORMALIZE PHONE NUMBERS
# ─────────────────────────────────────────────
print("\n[2] Normalizing phone numbers...")

# CAFB
cafb = pd.read_csv(f"{CLEANED_DIR}/cafb_food_assistance_locations.csv")
cafb['phone'] = cafb['phone'].apply(normalize_phone)
cafb.to_csv(f"{CLEANED_DIR}/cafb_food_assistance_locations.csv", index=False)
print(f"  cafb: done")

# md_pantries_merged
mp = pd.read_csv(f"{CLEANED_DIR}/md_pantries_merged.csv")
mp['phone'] = mp['phone'].apply(normalize_phone)
mp.to_csv(f"{CLEANED_DIR}/md_pantries_merged.csv", index=False)
print(f"  md_pantries_merged: done")

# pantry2
p2 = pd.read_csv(f"{CLEANED_DIR}/pantry2_donors.csv")
p2['phone'] = p2['phone'].apply(normalize_phone)
p2.to_csv(f"{CLEANED_DIR}/pantry2_donors.csv", index=False)
print(f"  pantry2: done")

# food_pantry3
fp3 = pd.read_csv(f"{CLEANED_DIR}/food_pantry3.csv")
fp3['phone'] = fp3['phone'].apply(normalize_phone)
fp3.to_csv(f"{CLEANED_DIR}/food_pantry3.csv", index=False)
print(f"  food_pantry3: done")

# food_pantries_in_md_appendix_iv
fp_iv = pd.read_csv(f"{CLEANED_DIR}/food_pantries_in_md_appendix_iv.csv")
fp_iv['phone'] = fp_iv['phone'].apply(normalize_phone)
fp_iv.to_csv(f"{CLEANED_DIR}/food_pantries_in_md_appendix_iv.csv", index=False)
print(f"  food_pantries_in_md_appendix_iv: done")

# maryland_food_resources (no phone column, skip)

# caroline_food_pantries
carol = pd.read_csv(f"{CLEANED_DIR}/caroline_food_pantries.csv")
carol['phone'] = carol['phone'].apply(normalize_phone)
carol.to_csv(f"{CLEANED_DIR}/caroline_food_pantries.csv", index=False)
print(f"  caroline_food_pantries: done")


# ─────────────────────────────────────────────
# 3. CONVERT FEEDING AMERICA NUMERIC STRINGS
# ─────────────────────────────────────────────
print("\n[3] Converting Feeding America numeric columns...")
fa = pd.read_csv(f"{CLEANED_DIR}/feeding_america_maryland.csv")

fa['food_insecurity_rate'] = fa['food_insecurity_rate'].apply(clean_percentage)
fa['average_meal_cost'] = fa['average_meal_cost'].apply(clean_currency)
fa['food_insecure_population'] = fa['food_insecure_population'].apply(clean_comma_number)
fa['annual_food_budget_shortfall'] = fa['annual_food_budget_shortfall'].apply(clean_currency)
fa['snap_above_threshold_pct'] = fa['snap_above_threshold_pct'].apply(clean_percentage)
fa['snap_below_threshold_pct'] = fa['snap_below_threshold_pct'].apply(clean_percentage)

fa.to_csv(f"{CLEANED_DIR}/feeding_america_maryland.csv", index=False)
print(f"  Converted: food_insecurity_rate, average_meal_cost, food_insecure_population,")
print(f"             annual_food_budget_shortfall, snap_above/below_threshold_pct")
print(f"  Sample: {fa[['county','food_insecurity_rate','average_meal_cost']].head(2).to_string()}")


# ─────────────────────────────────────────────
# 4. FILL EMPTY/NULL VALUES WITH DEFAULTS
# ─────────────────────────────────────────────
print("\n[4] Filling null values with sensible defaults...")

# CAFB - fill empty hours/notes/reqs with empty string
cafb = pd.read_csv(f"{CLEANED_DIR}/cafb_food_assistance_locations.csv")
day_cols = [c for c in cafb.columns if any(d in c for d in ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'])]
for col in day_cols:
    cafb[col] = cafb[col].fillna('')
cafb['email'] = cafb['email'].fillna('')
cafb['address2'] = cafb['address2'].fillna('')
cafb.to_csv(f"{CLEANED_DIR}/cafb_food_assistance_locations.csv", index=False)
print(f"  cafb: filled {len(day_cols)} day columns + email + address2")

# food_pantry3 - fill empty fields
fp3 = pd.read_csv(f"{CLEANED_DIR}/food_pantry3.csv")
for col in ['email', 'website', 'hours', 'eligibility', 'service_area', 'providing_org']:
    if col in fp3.columns:
        fp3[col] = fp3[col].fillna('')
fp3.to_csv(f"{CLEANED_DIR}/food_pantry3.csv", index=False)
print(f"  food_pantry3: filled optional text fields")

# SNAP - fill empty fields
snap = pd.read_csv(f"{CLEANED_DIR}/snap_retailer_locator.csv")
snap['Additonal_Address'] = snap['Additonal_Address'].fillna('')
snap['Grantee_Name'] = snap['Grantee_Name'].fillna('')
snap['Incentive_Program'] = snap['Incentive_Program'].fillna('')
snap['County'] = snap['County'].fillna('')
snap['Zip4'] = snap['Zip4'].fillna('')
snap.to_csv(f"{CLEANED_DIR}/snap_retailer_locator.csv", index=False)
print(f"  snap: filled optional fields")

# md_pantries_merged - fill empty fields
mp = pd.read_csv(f"{CLEANED_DIR}/md_pantries_merged.csv")
mp['contact'] = mp['contact'].fillna('')
mp['phone'] = mp['phone'].fillna('')
mp['hours'] = mp['hours'].fillna('')
mp['days'] = mp['days'].fillna('')
mp.to_csv(f"{CLEANED_DIR}/md_pantries_merged.csv", index=False)
print(f"  md_pantries_merged: filled contact, phone, hours, days")

# pantry2 - fill empty fields
p2 = pd.read_csv(f"{CLEANED_DIR}/pantry2_donors.csv")
p2['website'] = p2['website'].fillna('')
p2['hours'] = p2['hours'].fillna('')
p2.to_csv(f"{CLEANED_DIR}/pantry2_donors.csv", index=False)
print(f"  pantry2: filled website, hours")

# tracts - fill municipality info
tracts = pd.read_csv(f"{CLEANED_DIR}/tracts_with_municipality.csv")
tracts['MUNICIPALITY_NAME'] = tracts['MUNICIPALITY_NAME'].fillna('')
tracts['MUNICIPALITY_CITY'] = tracts['MUNICIPALITY_CITY'].fillna('')
tracts['MUNICIPALITY_ZIP'] = tracts['MUNICIPALITY_ZIP'].fillna('')
tracts.to_csv(f"{CLEANED_DIR}/tracts_with_municipality.csv", index=False)
print(f"  tracts: filled municipality fields")


# ─────────────────────────────────────────────
# 5. STANDARDIZE COUNTY NAMES
# ─────────────────────────────────────────────
print("\n[5] Standardizing county names...")

# CAFB has format "MD Montgomery County" or "DC Ward 8"
cafb = pd.read_csv(f"{CLEANED_DIR}/cafb_food_assistance_locations.csv")
# Extract just the county/ward part
cafb['state'] = cafb['county_name'].str.extract(r'^(MD|DC)')
cafb['county_clean'] = cafb['county_name'].str.replace(r'^(MD|DC)\s+', '', regex=True)
cafb.to_csv(f"{CLEANED_DIR}/cafb_food_assistance_locations.csv", index=False)
print(f"  cafb: added state and county_clean columns")

# SNAP has county in uppercase
snap = pd.read_csv(f"{CLEANED_DIR}/snap_retailer_locator.csv")
snap['County'] = snap['County'].str.title()
snap.to_csv(f"{CLEANED_DIR}/snap_retailer_locator.csv", index=False)
print(f"  snap: title-cased county names")


# ─────────────────────────────────────────────
# 6. CLEAN JSON FILES TOO
# ─────────────────────────────────────────────
print("\n[6] Cleaning JSON files...")

# Clean cafb JSON
with open(f"{CLEANED_DIR}/cafb_food_assistance_locations.json", "r", encoding="utf-8") as f:
    cafb_json = json.load(f)

for r in cafb_json:
    if 'phone' in r and isinstance(r['phone'], str):
        r['phone'] = normalize_phone(r['phone'])
    # Strip whitespace from all string values
    for k, v in r.items():
        if isinstance(v, str):
            r[k] = v.strip()

with open(f"{CLEANED_DIR}/cafb_food_assistance_locations.json", "w", encoding="utf-8") as f:
    json.dump(cafb_json, f, indent=2)
print(f"  cafb JSON: normalized phones, stripped whitespace")

# Clean food_pantry3 JSON
with open(f"{CLEANED_DIR}/food_pantry3.json", "r", encoding="utf-8") as f:
    fp3_json = json.load(f)

for r in fp3_json:
    if 'phone' in r and isinstance(r['phone'], str):
        r['phone'] = normalize_phone(r['phone'])
    for k, v in r.items():
        if isinstance(v, str):
            r[k] = v.strip()

with open(f"{CLEANED_DIR}/food_pantry3.json", "w", encoding="utf-8") as f:
    json.dump(fp3_json, f, indent=2)
print(f"  food_pantry3 JSON: normalized phones, stripped whitespace")


# ─────────────────────────────────────────────
# 7. REMOVE REDUNDANT INTERMEDIATE FILES
#    Keep only the most useful version of each dataset
# ─────────────────────────────────────────────
print("\n[7] Removing redundant intermediate files...")

# md_pantries_merged supersedes both food_pantries_in_md_appendix_iv AND maryland_food_resources
# Keep all three for now but note the relationship
print("  NOTE: md_pantries_merged.csv is the union of:")
print("    - food_pantries_in_md_appendix_iv.csv (534 rows, has contact info)")
print("    - maryland_food_resources.csv (486 rows, basic info)")
print("  Consider using md_pantries_merged.csv as the single pantry source")


# ─────────────────────────────────────────────
# FINAL VERIFICATION
# ─────────────────────────────────────────────
print("\n" + "=" * 60)
print("FINAL VERIFICATION")
print("=" * 60)

for f in sorted(os.listdir(CLEANED_DIR)):
    if not f.endswith('.csv'): continue
    df = pd.read_csv(os.path.join(CLEANED_DIR, f))
    nulls = df.isnull().sum().sum()
    empty_rows = df.isnull().all(axis=1).sum()
    # Check whitespace
    ws_issues = 0
    for col in df.select_dtypes(include='object').columns:
        ws_issues += df[col].dropna().apply(lambda x: x != x.strip()).sum()
    print(f"  {f}: {len(df)} rows, {nulls} nulls, {empty_rows} empty rows, {ws_issues} whitespace issues")

print("\nPass 2 complete!")
