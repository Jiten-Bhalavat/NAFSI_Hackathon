"""
unify_pantries.py
-----------------
Merges all Group 1 food-pantry sources into a single clean CSV:
    data/unified/consumer/food_pantries_unified.csv

Sources (in priority order — first wins on conflict):
    1. food_pantry3.csv          (211md.org, richest data)
    2. md_pantries_merged.csv    (MD state appendix merged)
    3. pantry2_donors.csv        (secondary aggregator)
    4. caroline_food_pantries.csv (Caroline County local list)

Deduplication strategy:
    - Normalize name + address → dedup_key
    - Exact match on dedup_key first
    - Fuzzy match (rapidfuzz token_sort_ratio >= 90) as second pass
    - Higher-priority sources are loaded first, so later sources only
      add rows that are genuinely new
"""

import re
import uuid
import pandas as pd
from rapidfuzz import fuzz

# ── Paths ────────────────────────────────────────────────────────────────────
BASE      = r"C:\Users\proto\NAFSI_Track2\data\cleaned"
OUT_DIR   = r"C:\Users\proto\NAFSI_Track2\data\unified\consumer"
OUT_FILE  = f"{OUT_DIR}\\food_pantries_unified.csv"

# ── Helpers ──────────────────────────────────────────────────────────────────
_ABBR = {
    r"\bst\b":    "street",
    r"\bave?\b":  "avenue",
    r"\bblvd\b":  "boulevard",
    r"\bdr\b":    "drive",
    r"\brd\b":    "road",
    r"\bln\b":    "lane",
    r"\bct\b":    "court",
    r"\bpl\b":    "place",
    r"\bhwy\b":   "highway",
    r"\bpkwy\b":  "parkway",
    r"\bsq\b":    "square",
    r"\bfte?\b":  "suite",
    r"\bapt\b":   "apartment",
    r"\bn\b":     "north",
    r"\bs\b":     "south",
    r"\be\b":     "east",
    r"\bw\b":     "west",
}

def normalize(text: str) -> str:
    """Lowercase, expand abbreviations, strip punctuation & extra spaces."""
    if not isinstance(text, str):
        return ""
    t = text.lower().strip()
    # remove USA suffix
    t = re.sub(r"\busa\b", "", t)
    # remove zip+4 extensions like 21229-2404
    t = re.sub(r"\b\d{5}-\d{4}\b", lambda m: m.group()[:5], t)
    for pattern, replacement in _ABBR.items():
        t = re.sub(pattern, replacement, t)
    # strip all punctuation except digits
    t = re.sub(r"[^\w\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def make_dedup_key(name: str, address: str) -> str:
    return normalize(name) + "||" + normalize(address)

def parse_address_parts(full_address: str, default_state: str = ""):
    """
    Try to extract city, state, zip from a combined address string.
    Handles:
      "126 Port Street, Easton, MD 21601"
      "4711 Edmondson Ave  Baltimore MD 21229-2404 USA"
      "8680 Fort Smallwood Rd, Pasadenia 21122"   (zip, no state)
      "7566 E. Howard Rd., Glen Burnie, MD21061"  (no space before zip)
    Returns (street, city, state, zip) — any may be empty.
    """
    if not isinstance(full_address, str):
        return full_address, "", default_state, ""

    addr = full_address.strip()
    addr = re.sub(r"\bUSA\b", "", addr).strip().rstrip(",").strip()

    # Normalise "MD21061" → "MD 21061" (state glued to zip)
    addr = re.sub(r"\b([A-Za-z]{2})(\d{5}(?:-\d{4})?)\b", r"\1 \2", addr)

    # Match trailing "ST 00000" or "ST 00000-0000"
    m = re.search(
        r"^(.*?)[,\s]+([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$", addr
    )
    if m:
        before_state = m.group(1).strip().rstrip(",").strip()
        state        = m.group(2).upper()
        zipcode      = m.group(3)[:5]
        parts = [p.strip() for p in before_state.split(",")]
        if len(parts) >= 2:
            street = ", ".join(parts[:-1])
            city   = parts[-1]
        else:
            street_city = parts[0]
            sc = re.split(r"\s{2,}", street_city)
            if len(sc) >= 2:
                street = sc[0]
                city   = sc[-1]
            else:
                street = street_city
                city   = ""
        return street, city, state, zipcode

    # Match trailing zip only (no state) e.g. "..., Pasadenia 21122"
    m2 = re.search(r"^(.*?)[,\s]+(\d{5}(?:-\d{4})?)$", addr)
    if m2:
        before_zip = m2.group(1).strip().rstrip(",").strip()
        zipcode    = m2.group(2)[:5]
        parts = [p.strip() for p in before_zip.split(",")]
        if len(parts) >= 2:
            street = ", ".join(parts[:-1])
            city   = parts[-1]
        else:
            street = parts[0]
            city   = ""
        return street, city, default_state, zipcode

    # Fallback: return full address as street, apply default state
    return addr, "", default_state, ""


# ── Loaders ──────────────────────────────────────────────────────────────────

def load_food_pantry3() -> pd.DataFrame:
    df = pd.read_csv(f"{BASE}\\food_pantry3.csv", dtype=str).fillna("")
    parsed = df["address"].apply(lambda a: parse_address_parts(a, default_state="MD"))
    df["street"]  = parsed.apply(lambda x: x[0])
    df["city"]    = parsed.apply(lambda x: x[1])
    df["state"]   = parsed.apply(lambda x: x[2])
    df["zip"]     = parsed.apply(lambda x: x[3])
    return pd.DataFrame({
        "name":        df["name"],
        "street":      df["street"],
        "city":        df["city"],
        "state":       df["state"],
        "zip":         df["zip"],
        "county":      "",
        "phone":       df["phone"],
        "website":     df["website"],
        "hours":       "",
        "days":        "",
        "contact":     "",
        "categories":  df["categories"],
        "description": df["description"],
        "source_url":  df["url"],
        "source":      "food_pantry3_211md",
        "raw_address": df["address"],
    })


def load_md_pantries_merged() -> pd.DataFrame:
    df = pd.read_csv(f"{BASE}\\md_pantries_merged.csv", dtype=str).fillna("")
    parsed = df["address"].apply(lambda a: parse_address_parts(a, default_state="MD"))
    df["street"] = parsed.apply(lambda x: x[0])
    df["city"]   = parsed.apply(lambda x: x[1])
    df["state"]  = parsed.apply(lambda x: x[2])
    df["zip"]    = parsed.apply(lambda x: x[3])
    return pd.DataFrame({
        "name":        df["name"],
        "street":      df["street"],
        "city":        df["city"],
        "state":       df["state"],
        "zip":         df["zip"],
        "county":      df["county"],
        "phone":       df["phone"],
        "website":     "",
        "hours":       df["hours"],
        "days":        df["days"],
        "contact":     df["contact"],
        "categories":  df["type"],
        "description": "",
        "source_url":  "",
        "source":      "md_pantries_merged",
        "raw_address": df["address"],
    })


def load_pantry2() -> pd.DataFrame:
    df = pd.read_csv(f"{BASE}\\pantry2_donors.csv", dtype=str).fillna("")
    parsed = df["address"].apply(lambda a: parse_address_parts(a, default_state="MD"))
    df["street"] = parsed.apply(lambda x: x[0])
    df["city"]   = parsed.apply(lambda x: x[1])
    df["state"]  = parsed.apply(lambda x: x[2])
    df["zip"]    = parsed.apply(lambda x: x[3])
    return pd.DataFrame({
        "name":        df["name"],
        "street":      df["street"],
        "city":        df["city"],
        "state":       df["state"],
        "zip":         df["zip"],
        "county":      "",
        "phone":       df["phone"],
        "website":     df["website"],
        "hours":       df["hours"],
        "days":        "",
        "contact":     "",
        "categories":  "Food Pantry",
        "description": "",
        "source_url":  "",
        "source":      "pantry2",
        "raw_address": df["address"],
    })


def load_caroline() -> pd.DataFrame:
    df = pd.read_csv(f"{BASE}\\caroline_food_pantries.csv", dtype=str).fillna("")
    return pd.DataFrame({
        "name":        df["place_name"],
        "street":      df["address"],
        "city":        "",
        "state":       "MD",
        "zip":         "",
        "county":      "Caroline",
        "phone":       df["phone"],
        "website":     "",
        "hours":       df["hours"],
        "days":        "",
        "contact":     "",
        "categories":  "Food Pantry",
        "description": df["notes"],
        "source_url":  "",
        "source":      "caroline_county",
        "raw_address": df["address"],
    })


# ── Deduplication ─────────────────────────────────────────────────────────────

FUZZY_THRESHOLD = 90   # token_sort_ratio score out of 100

def deduplicate(frames: list[pd.DataFrame]) -> pd.DataFrame:
    """
    Load sources in priority order.
    For each new row check:
      1. Exact dedup_key match → skip
      2. Fuzzy match on name+street against all kept rows → skip if score >= threshold
      3. Otherwise → keep
    """
    kept_rows    = []
    exact_keys   = set()          # dedup_key strings already kept
    fuzzy_names  = []             # (normalized_name, normalized_street) for fuzzy check

    for df in frames:
        source_name = df["source"].iloc[0] if len(df) > 0 else "unknown"
        added = skipped_exact = skipped_fuzzy = 0

        for _, row in df.iterrows():
            key    = make_dedup_key(row["name"], row["street"])
            n_name = normalize(row["name"])
            n_addr = normalize(row["street"])

            # 1. Exact match
            if key in exact_keys:
                skipped_exact += 1
                continue

            # 2. Fuzzy match — only run if name is non-empty
            is_fuzzy_dup = False
            if n_name:
                for kept_name, kept_addr in fuzzy_names:
                    name_score = fuzz.token_sort_ratio(n_name, kept_name)
                    if name_score >= FUZZY_THRESHOLD:
                        # also check address similarity (avoids same-chain different locations)
                        addr_score = fuzz.token_sort_ratio(n_addr, kept_addr)
                        if addr_score >= FUZZY_THRESHOLD or not n_addr or not kept_addr:
                            is_fuzzy_dup = True
                            break

            if is_fuzzy_dup:
                skipped_fuzzy += 1
                continue

            # 3. Keep this row
            kept_rows.append(row)
            exact_keys.add(key)
            fuzzy_names.append((n_name, n_addr))
            added += 1

        print(
            f"  [{source_name}] added={added}  "
            f"skipped_exact={skipped_exact}  skipped_fuzzy={skipped_fuzzy}"
        )

    return pd.DataFrame(kept_rows)


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("Loading sources...")
    sources = [
        load_food_pantry3(),
        load_md_pantries_merged(),
        load_pantry2(),
        load_caroline(),
    ]

    print("\nTotal rows per source (before dedup):")
    for df in sources:
        src = df["source"].iloc[0] if len(df) > 0 else "empty"
        print(f"  {src}: {len(df)}")

    print("\nDeduplicating...")
    unified = deduplicate(sources)

    # Assign stable IDs
    unified.insert(0, "id", [str(uuid.uuid4()) for _ in range(len(unified))])

    # Fix known state typos from source data
    unified["state"] = unified["state"].replace({"MC": "MD"})

    # Final column order
    cols = [
        "id", "name", "street", "city", "state", "zip", "county",
        "phone", "website", "hours", "days", "contact",
        "categories", "description", "source_url", "source", "raw_address",
    ]
    unified = unified[cols]

    unified.to_csv(OUT_FILE, index=False)

    print(f"\nDone.")
    print(f"  Total unique pantries: {len(unified)}")
    print(f"  Output: {OUT_FILE}")

    # Quick summary by source
    print("\nRows kept per source:")
    print(unified["source"].value_counts().to_string())

    # State breakdown
    print("\nRows by state (top 10):")
    print(unified["state"].value_counts().head(10).to_string())


if __name__ == "__main__":
    main()
