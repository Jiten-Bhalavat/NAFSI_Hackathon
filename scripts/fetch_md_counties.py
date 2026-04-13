"""
Fetch Maryland county GeoJSON from Census TIGER cartographic boundary files.
Saves to nourishnet/public/data/md_counties.geojson
"""
import urllib.request
import json
from pathlib import Path

OUT = Path("nourishnet/public/data/md_counties.geojson")

# Census TIGER 2023 cartographic boundary - counties, 1:500k resolution
# State FIPS 24 = Maryland
URL = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json"

# Better: use Census API directly for MD counties
CENSUS_URL = (
    "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/"
    "MapServer/1/query?where=STATE%3D%2724%27&outFields=NAME,STATE,COUNTY&"
    "outSR=4326&f=geojson"
)

def fetch():
    print(f"Fetching MD county boundaries from Census TIGER...")
    req = urllib.request.Request(CENSUS_URL, headers={"User-Agent": "NourishNet/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read().decode("utf-8"))

    features = data.get("features", [])
    print(f"  Got {len(features)} county features")

    # Normalize county names to match our stats data
    for f in features:
        name = f["properties"].get("NAME", "")
        # Strip " County" suffix and fix Baltimore city casing to match stats data
        if name.lower() == "baltimore city":
            normalized = "Baltimore City"
        else:
            normalized = name.replace(" County", "").strip()
        f["properties"]["county_name"] = normalized

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fp:
        json.dump(data, fp)
    print(f"  Saved to {OUT}")
    print(f"  Sample names: {[f['properties']['NAME'] for f in features[:5]]}")

if __name__ == "__main__":
    fetch()
