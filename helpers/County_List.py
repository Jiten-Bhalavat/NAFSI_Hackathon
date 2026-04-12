"""State-to-county mappings for geographic helpers."""

from __future__ import annotations

# Keys are lowercase state names. Values are display names as commonly used in MD records.
STATE_COUNTIES: dict[str, list[str]] = {
    "maryland": [
        "Allegany",
        "Anne Arundel",
        "Baltimore County",
        "Baltimore City",
        "Calvert",
        "Caroline",
        "Carroll",
        "Cecil",
        "Charles",
        "Dorchester",
        "Frederick",
        "Garrett",
        "Harford",
        "Howard",
        "Kent",
        "Montgomery",
        "Prince George's",
        "Queen Anne's",
        "Somerset",
        "St. Mary's",
        "Talbot",
        "Washington",
        "Wicomico",
        "Worcester",
    ],

    "district of columbia": [
        "District of Columbia",
    ],
}

# Optional short codes -> canonical lowercase state key
_STATE_ALIASES: dict[str, str] = {
    "md": "maryland",
}


def get_counties(state: str) -> list[str]:
    """
    Return the list of counties (and county-equivalents) for a state.

    Matching is case-insensitive. U.S. postal abbreviations are supported where defined.
    """
    key = state.strip().lower()
    key = _STATE_ALIASES.get(key, key)
    counties = STATE_COUNTIES.get(key)
    if counties is None:
        return []
    return list(counties)
