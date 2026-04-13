"""
Export "Healthy Foods" retail points from Prince George's Healthy Food Map.

Same data as the ArcGIS Dashboard list widget (Tabulator / feature list), but
via the public MapServer REST API — no browser scrolling.

Layer: Healthy_Food_Map / Healthy Foods (id 1)
Dashboard: https://princegeorges.maps.arcgis.com/apps/dashboards/9f9202c51cc345ab9e0e1aa21a23bb76
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Any

import requests

HEALTHY_FOODS_QUERY_URL = (
    "https://gis.princegeorgescountymd.gov/arcgis/rest/services/Health/Healthy_Food_Map/MapServer/1/query"
)
DEFAULT_USER_AGENT = "NAFSI-PGHealthyFoods/1.0 (+local research)"


def _normalize_zip(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    s = str(value).strip()
    if s.endswith(".0") and s[:-2].isdigit():
        s = s[:-2]
    return s


def fetch_page(
    *,
    where: str,
    out_fields: str,
    result_offset: int,
    result_record_count: int,
    session: requests.Session,
) -> dict[str, Any]:
    params = {
        "where": where,
        "outFields": out_fields,
        "returnGeometry": "false",
        "f": "json",
        "resultOffset": result_offset,
        "resultRecordCount": result_record_count,
        "orderByFields": "OBJECTID ASC",
    }
    r = session.get(HEALTHY_FOODS_QUERY_URL, params=params, timeout=120)
    r.raise_for_status()
    data = r.json()
    if "error" in data:
        raise RuntimeError(f"ArcGIS error: {data['error']}")
    return data


def fetch_all_attributes(
    *,
    where: str = "1=1",
    out_fields: str = "NAME,DELIVERY_ADDRESS,PLACE_NAME,STATE_NAME,ZIP_CODE,CATEGORY,OBJECTID",
    batch_size: int = 2000,
    user_agent: str = DEFAULT_USER_AGENT,
) -> list[dict[str, Any]]:
    session = requests.Session()
    session.headers["User-Agent"] = user_agent
    rows: list[dict[str, Any]] = []
    offset = 0
    while True:
        data = fetch_page(
            where=where,
            out_fields=out_fields,
            result_offset=offset,
            result_record_count=batch_size,
            session=session,
        )
        feats = data.get("features") or []
        for f in feats:
            attrs = f.get("attributes") or {}
            rows.append(attrs)
        n = len(feats)
        if n == 0:
            break
        offset += n
        if not data.get("exceededTransferLimit"):
            break
    return rows


def rows_to_market_csv(attrs_list: list[dict[str, Any]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["Name", "Address", "City", "State", "Zip", "Category"]
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for a in attrs_list:
            w.writerow(
                {
                    "Name": (a.get("NAME") or "").strip(),
                    "Address": (a.get("DELIVERY_ADDRESS") or "").strip(),
                    "City": (a.get("PLACE_NAME") or "").strip(),
                    "State": (a.get("STATE_NAME") or "").strip(),
                    "Zip": _normalize_zip(a.get("ZIP_CODE")),
                    "Category": (a.get("CATEGORY") or "").strip(),
                }
            )


def main() -> None:
    p = argparse.ArgumentParser(description="Export PG Healthy Food Map — Healthy Foods layer to CSV.")
    p.add_argument(
        "--out",
        type=Path,
        default=Path("data/planner/Farmers_Market/market_data.csv"),
        help="Output CSV path (default: data/planner/Farmers_Market/market_data.csv)",
    )
    p.add_argument(
        "--where",
        default="1=1",
        help='ArcGIS SQL where clause (default: all features), e.g. CATEGORY = \'Grocery Store\'',
    )
    args = p.parse_args()

    rows = fetch_all_attributes(where=args.where)
    rows_to_market_csv(rows, args.out)
    print(f"Wrote {len(rows)} rows to {args.out.resolve()}")


if __name__ == "__main__":
    main()
