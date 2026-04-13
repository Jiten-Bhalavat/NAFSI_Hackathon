"""One-shot script to normalize county values in donor_catalog.json."""
import json
from pathlib import Path

CANONICAL = [
    "Allegany", "Anne Arundel", "Baltimore", "Baltimore City",
    "Calvert", "Caroline", "Carroll", "Cecil", "Charles",
    "Dorchester", "Frederick", "Garrett", "Harford", "Howard",
    "Kent", "Montgomery", "Prince George's", "Queen Anne's",
    "Somerset", "St. Mary's", "Talbot", "Washington",
    "Wicomico", "Worcester", "District of Columbia",
]

ALIAS: dict[str, str | None] = {}
for c in CANONICAL:
    ALIAS[c.lower()] = c
    ALIAS[c.lower().replace("'", "")] = c
    ALIAS[c.lower().replace(".", "")] = c
    ALIAS[c.lower().replace("'", "").replace(".", "")] = c
    ALIAS[c.lower() + " county"] = c

ALIAS.update({
    "prince georges":           "Prince George's",
    "prince george's county":   "Prince George's",
    "prince georges county":    "Prince George's",
    "queen annes":              "Queen Anne's",
    "queen anne's county":      "Queen Anne's",
    "st marys":                 "St. Mary's",
    "st. marys":                "St. Mary's",
    "montgomery county":        "Montgomery",
    "baltimore county":         "Baltimore",
    "dist of columbia":         "District of Columbia",
    "washington dc":            "District of Columbia",
    "dc":                       "District of Columbia",
    # Non-MD → drop
    "**outside cafb service area**": None,
    "fairfax county":           None,
    "arlington county":         None,
    "city of alexandria":       None,
    "city of manassas":         None,
    "manassas city":            None,
    "prince william county":    None,
})
for w in range(1, 9):
    ALIAS[f"ward {w}"] = "District of Columbia"


def normalize(raw: str | None) -> str | None:
    if not raw:
        return None
    k = raw.strip().lower()
    if k in ALIAS:
        return ALIAS[k]
    if k.endswith(" county"):
        k2 = k[:-7].strip()
        if k2 in ALIAS:
            return ALIAS[k2]
    return None  # drop unrecognized non-MD counties


PATH = Path("nourishnet/public/data/donor_catalog.json")
with open(PATH, encoding="utf-8") as f:
    cat = json.load(f)

fixed = 0
for p in cat["donorPlaces"]:
    raw = p.get("county")
    n = normalize(raw)
    if n != raw:
        p["county"] = n
        fixed += 1

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(cat, f, ensure_ascii=False, indent=2)

from collections import Counter
counts = Counter(p.get("county") for p in cat["donorPlaces"])
print(f"Fixed {fixed} county values. Unique counties now:")
for k, v in sorted(counts.items(), key=lambda x: x[0] or ""):
    print(f"  {repr(k)}: {v}")
