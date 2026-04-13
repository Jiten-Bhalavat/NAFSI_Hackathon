"""
unify_farmers_markets.py
------------------------
Cleans and standardises the farmers market dataset into:
    data/unified/resources/farmers_markets.csv

Source (both files are identical — only one is used):
    data/donor/Farmers_Market/Farmers_Market_20260412.csv

What this script does:
    1. Parses Location field → street, city, state, zip, latitude, longitude
    2. Reshapes up to 4 seasons into structured season_N_dates / season_N_hours columns
    3. Creates a payment_methods summary list (SNAP, WIC, WICCASH, SFMNP, CREDIT)
    4. Creates a products_available summary list from all product flags
    5. Normalises column names to snake_case
    6. Outputs a clean, flat CSV ready for the React app
"""

import re
import pandas as pd
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
SRC      = r"C:\Users\proto\NAFSI_Track2\data\raw_data\donor\Farmers_Market\Farmers_Market_20260412.csv"
OUT_DIR  = Path(r"C:\Users\proto\NAFSI_Track2\data\unified\resources")
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = OUT_DIR / "farmers_markets.csv"

# ── Payment & product flag columns ───────────────────────────────────────────
PAYMENT_COLS = ["CREDIT", "WIC", "WICCASH", "SFMNP", "SNAP"]
PRODUCT_COLS = [
    "BAKEDGOODS", "CHEESE", "CRAFTS", "FLOWERS", "EGGS", "SEAFOOD",
    "HERBS", "VEGETABLES", "HONEY", "JAMS", "MAPLE", "MEAT", "NURSERY",
    "NUTS", "PLANTS", "POULTRY", "PREPARED", "SOAP", "TREES", "WINE",
]
PRODUCT_LABELS = {
    "BAKEDGOODS": "Baked Goods", "CHEESE": "Cheese", "CRAFTS": "Crafts",
    "FLOWERS": "Flowers", "EGGS": "Eggs", "SEAFOOD": "Seafood",
    "HERBS": "Herbs", "VEGETABLES": "Vegetables", "HONEY": "Honey",
    "JAMS": "Jams", "MAPLE": "Maple", "MEAT": "Meat", "NURSERY": "Nursery",
    "NUTS": "Nuts", "PLANTS": "Plants", "POULTRY": "Poultry",
    "PREPARED": "Prepared Food", "SOAP": "Soap", "TREES": "Trees",
    "WINE": "Wine",
}

# ── Helpers ──────────────────────────────────────────────────────────────────

# Known cities in the MD/DC/VA metro area — used to correctly split street vs city
_KNOWN_CITIES = sorted([
    "National Harbor", "College Park", "Upper Marlboro", "Fort Washington",
    "Mount Rainier", "Glenn Dale", "Temple Hills", "Riverdale Park",
    "Bowie", "Greenbelt", "Beltsville", "Hyattsville", "Laurel",
    "Suitland", "Cheverly", "Brentwood", "Landover", "Bladensburg",
    "Capitol Heights", "Seat Pleasant", "District Heights", "Oxon Hill",
    "Clinton", "Accokeek", "Brandywine", "Waldorf", "La Plata",
    "Silver Spring", "Takoma Park", "Rockville", "Gaithersburg",
    "Bethesda", "Chevy Chase", "Potomac", "Germantown",
    "Washington", "Alexandria", "Arlington", "Fairfax", "Reston",
    "Herndon", "Woodbridge", "Manassas", "Stafford",
], key=len, reverse=True)  # longest first so multi-word cities match before substrings

_STATE_NAMES = {
    "Maryland": "MD", "Virginia": "VA", "District of Columbia": "DC",
    "West Virginia": "WV", "Pennsylvania": "PA", "Delaware": "DE",
}

def parse_location(loc: str):
    """
    Parse Location strings like:
      'American Way National Harbor Maryland 20745.00000000    (38.783762, -77.01422)'
      'on Union Street ... College Park Maryland 20742.00000000    (38.98732, -76.946601)'
      '10905 Livingston Road Fort Washington    (38.742988, -76.999859)'
    Returns (street, city, state, zip, latitude, longitude)
    """
    if not isinstance(loc, str) or not loc.strip():
        return "", "", "MD", "", "", ""

    raw = loc.strip()

    # 1. Extract lat/lon
    lat, lon = "", ""
    coord_match = re.search(r"\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)", raw)
    if coord_match:
        lat = coord_match.group(1)
        lon = coord_match.group(2)
        raw = raw[:coord_match.start()].strip()

    # 2. Remove trailing zip+decimal noise like "20745.00000000"
    raw = re.sub(r"(\d{5})\.0+", r"\1", raw).strip()

    # 3. Extract zip (5 digits at end)
    zipcode = ""
    zip_match = re.search(r"\b(\d{5})\s*$", raw)
    if zip_match:
        zipcode = zip_match.group(1)
        raw = raw[:zip_match.start()].strip()

    # 4. Extract state — try full name first (more specific), then abbreviation
    state = ""
    for name, abbr in _STATE_NAMES.items():
        if raw.endswith(name):
            state = abbr
            raw = raw[:-len(name)].strip()
            break
    if not state:
        m = re.search(
            r"\b(MD|DC|VA|WV|PA|DE)\s*$", raw
        )
        if m:
            state = m.group(1)
            raw = raw[:m.start()].strip()

    # 5. Extract city using known-city lookup (longest match first)
    city = ""
    for known_city in _KNOWN_CITIES:
        if raw.endswith(known_city):
            city = known_city
            raw = raw[:-len(known_city)].strip()
            break

    # Fallback: if no known city matched and state was found, the last
    # word group before state is probably the city
    if not city and raw:
        parts = raw.rsplit(" ", 1)
        if len(parts) == 2 and not re.search(r"\d", parts[1]):
            raw  = parts[0].strip()
            city = parts[1].strip()

    street = raw.strip()
    if not state:
        state = "MD"  # default for this dataset (all PG County / DC metro)

    return street, city, state, zipcode, lat, lon


def parse_hours_string(hours_str: str) -> dict:
    """
    Parse hours like 'Sat: 10:00 AM-4:00 PM;Wed: 11:00 AM-3:00 PM;'
    into {'Saturday': '10:00 AM-4:00 PM', 'Wednesday': '11:00 AM-3:00 PM'}
    """
    day_map = {
        "mon": "Monday", "tue": "Tuesday", "wed": "Wednesday",
        "thu": "Thursday", "fri": "Friday", "sat": "Saturday", "sun": "Sunday",
    }
    result = {}
    if not isinstance(hours_str, str):
        return result
    segments = [s.strip() for s in hours_str.split(";") if s.strip()]
    for seg in segments:
        m = re.match(r"([A-Za-z]+)\s*:\s*(.+)", seg)
        if m:
            day_key = m.group(1).lower()[:3]
            day_full = day_map.get(day_key, m.group(1))
            result[day_full] = m.group(2).strip()
    return result


def summarise_hours(hours_str: str) -> str:
    """Return a compact human-readable hours string."""
    parsed = parse_hours_string(hours_str)
    if not parsed:
        return ""
    return "; ".join(f"{d}: {h}" for d, h in parsed.items())


def flag_list(row: pd.Series, cols: list, labels: dict = None) -> str:
    """Return semicolon-joined list of columns where value is 'Yes'."""
    active = []
    for col in cols:
        if str(row.get(col, "")).strip().lower() == "yes":
            label = labels.get(col, col) if labels else col
            active.append(label)
    return "; ".join(active)


# ── Load ─────────────────────────────────────────────────────────────────────

print("Loading farmers market data...")
df = pd.read_csv(SRC, dtype=str).fillna("")
# Strip trailing space from 'Location ' column name
df.columns = [c.strip() for c in df.columns]
print(f"  {len(df)} records loaded")

# ── Parse Location ────────────────────────────────────────────────────────────

print("Parsing Location field...")
parsed = df["Location"].apply(parse_location)
df["street"]    = parsed.apply(lambda x: x[0])
df["city"]      = parsed.apply(lambda x: x[1])
df["state"]     = parsed.apply(lambda x: x[2])
df["zip"]       = parsed.apply(lambda x: x[3])
df["latitude"]  = parsed.apply(lambda x: x[4])
df["longitude"] = parsed.apply(lambda x: x[5])

# ── Payment methods & products ────────────────────────────────────────────────

df["payment_methods"]   = df.apply(lambda r: flag_list(r, PAYMENT_COLS), axis=1)
df["products_available"] = df.apply(lambda r: flag_list(r, PRODUCT_COLS, PRODUCT_LABELS), axis=1)
df["accepts_snap"] = df["SNAP"].str.strip().str.lower().map({"yes": True, "no": False})
df["accepts_wic"]  = df["WIC"].str.strip().str.lower().map({"yes": True, "no": False})

# ── Seasons → structured columns ──────────────────────────────────────────────

for i in range(1, 5):
    date_col = f"SEASON{i} DATE" if i == 1 else f"SEASON{i} DATE"
    time_col = f"SEASON{i}TIME"  if i == 1 else f"SEASON{i} TIME"
    df[f"season_{i}_dates"] = df[date_col].str.strip()
    df[f"season_{i}_hours"] = df[time_col].apply(summarise_hours)

# ── Build final dataframe ─────────────────────────────────────────────────────

out = pd.DataFrame({
    "market_id":          df["FARMERS MARKET ID"],
    "name":               df["MARKET NAME"],
    "street":             df["street"],
    "city":               df["city"],
    "state":              df["state"],
    "zip":                df["zip"],
    "latitude":           df["latitude"],
    "longitude":          df["longitude"],
    "website":            df["WEBSITE"],
    "season_1_dates":     df["season_1_dates"],
    "season_1_hours":     df["season_1_hours"],
    "season_2_dates":     df["season_2_dates"],
    "season_2_hours":     df["season_2_hours"],
    "season_3_dates":     df["season_3_dates"],
    "season_3_hours":     df["season_3_hours"],
    "season_4_dates":     df["season_4_dates"],
    "season_4_hours":     df["season_4_hours"],
    "accepts_snap":       df["accepts_snap"],
    "accepts_wic":        df["accepts_wic"],
    "payment_methods":    df["payment_methods"],
    "products_available": df["products_available"],
})

# ── Save ─────────────────────────────────────────────────────────────────────

out.to_csv(OUT_FILE, index=False)

print(f"\nDone.")
print(f"  Total records  : {len(out)}")
print(f"  Output         : {OUT_FILE}")

print("\n=== Location parsing completeness ===")
for col in ["street", "city", "state", "zip", "latitude", "longitude"]:
    pct = (out[col].astype(str).str.strip() != "").mean() * 100
    print(f"  {col:12s}: {pct:.0f}%")

print("\n=== Payment method breakdown ===")
for col in ["accepts_snap", "accepts_wic"]:
    yes = out[col].sum()
    print(f"  {col}: {yes}/{len(out)}")

print("\n=== Sample output ===")
print(out[["name","city","state","season_1_dates","season_1_hours","accepts_snap","accepts_wic"]].to_string())
