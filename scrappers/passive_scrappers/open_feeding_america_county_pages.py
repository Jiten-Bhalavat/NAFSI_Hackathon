"""
Open Feeding America Map the Meal Gap county pages for Maryland.

URL pattern:
  https://map.feedingamerica.org/county/{year}/overall/maryland/county/{county_slug}

Years: 2019–2023. Counties from helpers.County_List.get_counties("maryland").
Slug: lowercase, punctuation removed, whitespace -> hyphen.

Scrapes metrics from each page and writes CSV (see --out).
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
from dataclasses import asdict, dataclass, fields
from pathlib import Path
from typing import Any

def _project_root() -> Path:
    here = Path(__file__).resolve().parent
    for p in [here, *here.parents]:
        if (p / "helpers" / "County_List.py").is_file():
            return p
    raise RuntimeError(
        "Could not find project root (helpers/County_List.py). "
        "Keep helpers/ next to scrappers/ or run from the repo root."
    )


_ROOT = _project_root()
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from helpers.County_List import get_counties  # noqa: E402

YEARS: tuple[int, ...] = (2019, 2020, 2021, 2022, 2023)
BASE = "https://map.feedingamerica.org/county"


def county_name_to_url_slug(name: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace to single hyphens."""
    s = name.lower()
    s = re.sub(r"[^a-z0-9\s]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def iter_maryland_county_urls() -> list[tuple[int, str, str]]:
    """(year, county_display_name, full_url) for each combination."""
    out: list[tuple[int, str, str]] = []
    for year in YEARS:
        for county in get_counties("maryland"):
            slug = county_name_to_url_slug(county)
            url = f"{BASE}/{year}/overall/maryland/county/{slug}"
            out.append((year, county, url))
    return out


@dataclass
class CountyScrapeRow:
    year: int
    county: str
    url: str
    food_insecure_population: str | None
    food_insecurity_rate: str | None
    snap_above_threshold_pct: str | None
    snap_below_threshold_pct: str | None
    average_meal_cost: str | None
    annual_food_budget_shortfall: str | None
    scrape_error: str | None = None


def _first_text(locator: Any) -> str | None:
    try:
        if locator.count() == 0:
            return None
        t = locator.first.inner_text(timeout=8_000)
        return t.strip() if t else None
    except Exception:
        return None


def extract_county_page(page: Any) -> dict[str, str | None]:
    """
    Pull headline metrics from a loaded Map the Meal Gap county page.
    Selectors follow Feeding America's Vue layout (headings + sibling values).
    """
    out: dict[str, str | None] = {
        "food_insecure_population": None,
        "food_insecurity_rate": None,
        "snap_above_threshold_pct": None,
        "snap_below_threshold_pct": None,
        "average_meal_cost": None,
        "annual_food_budget_shortfall": None,
    }

    # 1) Food Insecure Population — h2 is inside .bg-gray-200; <p class="text-3xl ..."> is next sibling of that block
    h2_pop = page.locator("h2", has_text=re.compile(r"Food Insecure Population", re.I))
    if h2_pop.count() > 0:
        pop = _first_text(
            h2_pop.first.locator(
                "xpath=ancestor::div[contains(@class,'flex-1')][1]"
                "//p[contains(@class,'text-3xl') and contains(@class,'font-bold')][1]"
            )
        )
        if not pop:
            pop = _first_text(
                h2_pop.first.locator(
                    "xpath=ancestor::div[contains(@class,'bg-gray-200')][1]"
                    "/following-sibling::p[contains(@class,'text-3xl')][1]"
                )
            )
        out["food_insecure_population"] = pop

    # 2) Food insecurity rate — pie chart label in .pieContainer
    h2_rate = page.locator("h2", has_text=re.compile(r"Food insecurity rate", re.I))
    if h2_rate.count() > 0:
        pie = h2_rate.first.locator(
            "xpath=following::div[contains(@class,'pieContainer')][1]//div[contains(@class,'absolute')][contains(@class,'text-center')]"
        )
        rate_txt = _first_text(pie)
        if rate_txt:
            out["food_insecurity_rate"] = rate_txt
    if not out["food_insecurity_rate"]:
        canvas = page.locator("#foodInsecurityPieChartDataDetails")
        if canvas.count() > 0:
            out["food_insecurity_rate"] = _first_text(
                canvas.locator(
                    "xpath=ancestor::div[contains(@class,'pieContainer')][1]//div[contains(@class,'absolute')][contains(@class,'text-center')]"
                )
            )

    # 3) SNAP rows — direct CSS: wrapper bg-green-600/900 > div.font-black holds the percentage
    out["snap_above_threshold_pct"] = _first_text(page.locator("div.bg-green-600 div.font-black"))
    out["snap_below_threshold_pct"] = _first_text(page.locator("div.bg-green-900 div.font-black"))

    # 4) Average meal cost
    meal_span = page.locator("span", has_text=re.compile(r"Average meal cost", re.I))
    if meal_span.count() > 0:
        out["average_meal_cost"] = _first_text(
            meal_span.first.locator("xpath=following::p[contains(@class,'text-3xl')][1]")
        )

    # 5) Annual food budget shortfall
    shortfall_span = page.locator("span", has_text=re.compile(r"ANNUAL FOOD BUDGET SHORTFALL", re.I))
    if shortfall_span.count() > 0:
        out["annual_food_budget_shortfall"] = _first_text(
            shortfall_span.first.locator("xpath=following::p[contains(@class,'text-3xl')][1]")
        )

    return out


def write_csv(path: Path, rows: list[CountyScrapeRow]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [f.name for f in fields(CountyScrapeRow)]
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(asdict(r))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Open/scrape Feeding America Map the Meal Gap Maryland county pages (Playwright)."
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run browser without a window (default: headed).",
    )
    parser.add_argument(
        "--slow-mo",
        type=int,
        default=0,
        metavar="MS",
        help="Slow down operations by MS milliseconds (debugging).",
    )
    parser.add_argument(
        "--pause-ms",
        type=int,
        default=500,
        metavar="MS",
        help="Extra wait after load for charts (default 500).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print URLs only; do not launch a browser.",
    )
    parser.add_argument(
        "--navigate-only",
        action="store_true",
        help="Visit each URL but do not parse the DOM or write CSV.",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="CSV output path (default: <project root>/output/feeding_america_maryland.csv).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        metavar="N",
        help="Process only the first N county-year rows (0 = all).",
    )
    args = parser.parse_args()

    rows = iter_maryland_county_urls()
    n_counties = len(get_counties("maryland"))
    print(f"Combinations: {len(rows)} ({len(YEARS)} years x {n_counties} counties)")

    if args.limit and args.limit > 0:
        rows = rows[: args.limit]
        print(f"Limited to {len(rows)} row(s).")

    if args.dry_run:
        for year, county, url in rows:
            print(f"{year}\t{county}\t{url}")
        return

    out_path = args.out if args.out is not None else _ROOT / "output" / "feeding_america_maryland.csv"

    from playwright.sync_api import sync_playwright

    if args.navigate_only:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=args.headless, slow_mo=args.slow_mo)
            page = browser.new_page()
            try:
                for year, county, url in rows:
                    print(f"{year}  {county}  ->  {url}")
                    page.goto(url, wait_until="domcontentloaded", timeout=60_000)
                    if args.pause_ms > 0:
                        page.wait_for_timeout(args.pause_ms)
            finally:
                browser.close()
        return

    scraped: list[CountyScrapeRow] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=args.headless, slow_mo=args.slow_mo)
        page = browser.new_page()
        try:
            for year, county, url in rows:
                print(f"{year}  {county}  ->  {url}")
                err: str | None = None
                try:
                    page.goto(url, wait_until="domcontentloaded", timeout=60_000)
                    page.wait_for_selector("h2", timeout=30_000)
                    if args.pause_ms > 0:
                        page.wait_for_timeout(args.pause_ms)
                except Exception as e:
                    err = f"navigation: {e}"

                if err:
                    scraped.append(
                        CountyScrapeRow(
                            year=year,
                            county=county,
                            url=url,
                            food_insecure_population=None,
                            food_insecurity_rate=None,
                            snap_above_threshold_pct=None,
                            snap_below_threshold_pct=None,
                            average_meal_cost=None,
                            annual_food_budget_shortfall=None,
                            scrape_error=err,
                        )
                    )
                    continue

                try:
                    data = extract_county_page(page)
                    scraped.append(
                        CountyScrapeRow(
                            year=year,
                            county=county,
                            url=url,
                            food_insecure_population=data["food_insecure_population"],
                            food_insecurity_rate=data["food_insecurity_rate"],
                            snap_above_threshold_pct=data["snap_above_threshold_pct"],
                            snap_below_threshold_pct=data["snap_below_threshold_pct"],
                            average_meal_cost=data["average_meal_cost"],
                            annual_food_budget_shortfall=data["annual_food_budget_shortfall"],
                            scrape_error=None,
                        )
                    )
                except Exception as e:
                    scraped.append(
                        CountyScrapeRow(
                            year=year,
                            county=county,
                            url=url,
                            food_insecure_population=None,
                            food_insecurity_rate=None,
                            snap_above_threshold_pct=None,
                            snap_below_threshold_pct=None,
                            average_meal_cost=None,
                            annual_food_budget_shortfall=None,
                            scrape_error=f"extract: {e}",
                        )
                    )
        finally:
            browser.close()

    write_csv(out_path, scraped)
    print(f"Wrote {len(scraped)} row(s) to {out_path}")


if __name__ == "__main__":
    main()
