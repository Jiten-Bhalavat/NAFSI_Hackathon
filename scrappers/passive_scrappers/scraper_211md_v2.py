#!/usr/bin/env python3
"""
scraper_211md_v2.py
===================
Scraper for 211md.org food pantry listings using Playwright (headless Chromium).

The site is a Next.js / React Server Components app that renders results
via JavaScript — plain requests.get() returns 0 matching cards. This version
uses a real browser (headless Chromium via Playwright) to get fully-rendered
HTML, then parses it with BeautifulSoup.

Scrapes all food pantry results from:
  https://search.211md.org/search?query=food+pantry&query_label=food+pantry&query_type=text

For each listing collects:
  name, address, phone, website, description, categories   (search results page)
  eligibility, hours, email, service_area, providing_org   (detail page)

Outputs:
  data/211md_food_pantries.json
  data/211md_food_pantries.csv

Usage:
  python scrappers/scraper_211md_v2.py            # full scrape (~21 pages + detail pages)
  python scrappers/scraper_211md_v2.py --test     # quick test (2 pages, no detail pages)
  python scrappers/scraper_211md_v2.py --no-detail # skip detail pages (faster)
"""

import csv
import io
import json
import os
import re
import sys
import time

# Force UTF-8 stdout on Windows to avoid encoding errors for non-ASCII chars
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_URL      = "https://search.211md.org"
SEARCH_URL    = f"{BASE_URL}/search"
QUERY_PARAMS  = "query=food+pantry&query_label=food+pantry&query_type=text"
RESULTS_PER_PAGE = 25          # site shows 25 results/page
PAGE_LOAD_TIMEOUT = 30_000     # ms
NAVIGATION_DELAY  = 1.5        # seconds between page requests
DETAIL_DELAY      = 1.0        # seconds between detail page requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(SCRIPT_DIR, "..", "data")
JSON_OUT   = os.path.join(DATA_DIR, "211md_food_pantries.json")
CSV_OUT    = os.path.join(DATA_DIR, "211md_food_pantries.csv")

UUID_RE = re.compile(
    r"/search/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})",
    re.IGNORECASE,
)

CSV_FIELDS = [
    "id", "name", "address", "phone", "email", "website",
    "description", "categories", "hours",
    "eligibility", "service_area", "providing_org", "url",
]


# ---------------------------------------------------------------------------
# HTML Parsing helpers
# ---------------------------------------------------------------------------
def parse_search_page(html: str) -> list[dict]:
    """
    Parse a fully-rendered search results page and return partial records.
    Each record has: id, url, name, address, phone, website, description, categories.

    The site uses Tailwind CSS classes. Each result card is a:
      <div class="rounded-lg border bg-card p-3 ..." id="<some-id>">
    Inside it, the detail link has data-testid="resource-link".
    """
    soup = BeautifulSoup(html, "html.parser")
    records: list[dict] = []
    seen_ids: set[str] = set()

    # Strategy 1: find cards by their bg-card class (most reliable)
    cards = soup.find_all("div", class_="bg-card")

    # Strategy 2 fallback — walk up from UUID links (for structure changes)
    if not cards:
        seen_for_cards: set[int] = set()
        for link in soup.find_all("a", href=UUID_RE):
            card = link
            for _ in range(12):
                parent = card.parent
                if parent is None:
                    break
                tag = parent.name
                if tag in ("article", "li", "section"):
                    card = parent
                    break
                if tag == "div":
                    uuid_links = parent.find_all("a", href=UUID_RE)
                    if 1 <= len(uuid_links) <= 3:
                        card = parent
                        break
                card = parent
            cid = id(card)
            if cid not in seen_for_cards:
                seen_for_cards.add(cid)
                cards.append(card)

    for card in cards:
        # Find the primary detail link (data-testid="resource-link" preferred)
        link = card.find("a", attrs={"data-testid": "resource-link"})
        if link is None:
            link = card.find("a", href=UUID_RE)
        if link is None:
            continue

        href = link.get("href", "")
        m = UUID_RE.search(href)
        if not m:
            continue
        uid = m.group(1)
        if uid in seen_ids:
            continue
        seen_ids.add(uid)

        name = link.get_text(separator=" ", strip=True)

        # ---- Extract fields from the card ----
        address = ""
        phone = ""
        email = ""
        website = ""
        description = ""
        categories: list[str] = []

        # Address: first <p> tag in the card (inside the map-pin SVG row)
        paras = [p.get_text(strip=True) for p in card.find_all("p") if p.get_text(strip=True)]
        if paras:
            address = paras[0]

        # Description: look for longer text blocks (divs/spans with many words)
        for el in card.find_all(["div", "span", "p"]):
            text = el.get_text(separator=" ", strip=True)
            # Heuristic: description is a longer text that's not an address/phone
            if (
                len(text) > 80
                and not re.search(r"^\d{3}[-.\s]\d{3}", text)  # not a phone
                and not text.startswith("http")
                and "lucide" not in el.get("class", [""])[0] if el.get("class") else True
            ):
                description = text
                break

        # Phone
        tel_a = card.find("a", href=re.compile(r"^tel:", re.I))
        if tel_a:
            phone = tel_a.get_text(strip=True)

        # Email
        mail_a = card.find("a", href=re.compile(r"^mailto:", re.I))
        if mail_a:
            raw = mail_a.get("href", "")
            email = re.sub(r"^mailto:", "", raw, flags=re.I).strip()

        # External website (not a UUID detail link, not tel:/mailto:)
        for a in card.find_all("a", href=True):
            href2 = a.get("href", "")
            if (
                href2.startswith("http")
                and not UUID_RE.search(href2)
                and "search.211md.org" not in href2
            ):
                website = href2
                break

        # Category tags — links to /search?query=...
        for a in card.find_all("a", href=re.compile(r"/search\?query=", re.I)):
            cat = a.get_text(strip=True)
            if cat and cat not in categories:
                categories.append(cat)

        records.append({
            "id":          uid,
            "url":         f"{BASE_URL}/search/{uid}",
            "name":        name,
            "address":     address,
            "phone":       phone,
            "email":       email,
            "website":     website,
            "description": description,
            "categories":  categories,
            # Detail fields filled later
            "hours":       "",
            "eligibility": "",
            "service_area": "",
            "providing_org": "",
        })

    return records


def _label_value_blocks(soup: BeautifulSoup) -> dict[str, str]:
    """
    Build a mapping of {heading_text_lower: value_text} from common
    label/value patterns used on 211md detail pages.
    """
    out: dict[str, str] = {}
    for el in soup.find_all(["h2", "h3", "h4", "dt", "strong", "b", "label", "span"]):
        label = el.get_text(strip=True).lower().rstrip(":")
        if not label or len(label) > 60:
            continue
        # Value is the next sibling element or the next element
        sib = el.find_next_sibling()
        if sib is None:
            sib = el.find_next(["p", "dd", "div", "span", "ul", "li"])
        if sib:
            val = sib.get_text(separator=" ", strip=True)
            if val:
                out[label] = val
    return out


def parse_detail_page(html: str, record: dict) -> dict:
    """
    Enrich a record with detail-page fields.
    Strategy: search for known label keywords in the page.
    """
    soup = BeautifulSoup(html, "html.parser")
    lv = _label_value_blocks(soup)

    def find_val(*keywords: str) -> str:
        for k in keywords:
            for label, val in lv.items():
                if k in label:
                    return val
        return ""

    # Providing organization
    providing_org = find_val("organization name", "organization", "provider", "agency")

    # Service area
    service_area = find_val("service area", "area served", "geographic area")

    # Eligibility
    eligibility = find_val("eligib", "who can", "requirements")

    # Hours
    hours = find_val("hours", "schedule", "when")

    # Email (if not already set from search page)
    if not record.get("email"):
        mail_a = soup.find("a", href=re.compile(r"^mailto:", re.I))
        if mail_a:
            raw = mail_a.get("href", "")
            record["email"] = re.sub(r"^mailto:", "", raw, flags=re.I).strip()

    # Phone (if not already set from search page)
    if not record.get("phone"):
        tel_a = soup.find("a", href=re.compile(r"^tel:", re.I))
        if tel_a:
            record["phone"] = tel_a.get_text(strip=True)

    # Address (if not already set)
    if not record.get("address"):
        for el in soup.find_all(["p", "span", "div"]):
            text = el.get_text(strip=True)
            if text and re.search(r"\bMD\b|\bMaryland\b|\d{5}", text):
                record["address"] = text
                break

    # Description — use longest paragraph if not already set
    if not record.get("description"):
        paras = [p.get_text(separator=" ", strip=True) for p in soup.find_all("p") if p.get_text(strip=True)]
        if paras:
            record["description"] = max(paras, key=len)

    record["providing_org"] = providing_org
    record["service_area"]  = service_area
    record["eligibility"]   = eligibility
    record["hours"]         = hours
    return record


# ---------------------------------------------------------------------------
# Playwright helpers
# ---------------------------------------------------------------------------
def build_search_url(page_num: int) -> str:
    url = f"{SEARCH_URL}?{QUERY_PARAMS}"
    if page_num > 1:
        url += f"&page={page_num}"
    return url


def wait_for_results(page) -> None:
    """
    Wait until at least one result card is visible on screen.
    We detect by looking for an <a> link whose href contains a UUID.
    """
    try:
        page.wait_for_selector(
            'a[href*="/search/"]:not([href="/search"])',
            timeout=PAGE_LOAD_TIMEOUT,
        )
    except PlaywrightTimeout:
        pass  # Will parse whatever is loaded


def get_total_pages(html: str) -> int:
    """
    Try to read the total number of pages from the rendered HTML.
    Falls back to 21 (safe default) if detection fails.
    """
    soup = BeautifulSoup(html, "html.parser")
    full_text = soup.get_text()

    # Strategy 1: "X results" text  -> ceil(X / per_page)
    m = re.search(r"([\d,]+)\s+result", full_text, re.I)
    if m:
        total_results = int(m.group(1).replace(",", ""))
        pages = (total_results + RESULTS_PER_PAGE - 1) // RESULTS_PER_PAGE
        if pages > 0:
            return pages

    # Strategy 2: highest page number in pagination buttons/links
    max_page = 1
    for el in soup.find_all(["button", "a", "span", "li"]):
        text = el.get_text(strip=True)
        if re.fullmatch(r"\d+", text):
            val = int(text)
            if 1 < val <= 200:
                max_page = max(max_page, val)
    if max_page > 1:
        return max_page

    return 21  # safe default


# ---------------------------------------------------------------------------
# Main scraping logic
# ---------------------------------------------------------------------------
def scrape(
    max_pages: int | None = None,
    fetch_details: bool = True,
    verbose: bool = True,
) -> list[dict]:
    all_records: list[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="en-US",
        )
        page = context.new_page()

        # ----------------------------------------------------------------
        # Phase 1: Collect all search result listings
        # ----------------------------------------------------------------
        # Load page 1 first to determine total pages
        url_p1 = build_search_url(1)
        if verbose:
            print(f"[Phase 1] Loading page 1 to determine total pages …")
        page.goto(url_p1, wait_until="domcontentloaded")
        wait_for_results(page)
        time.sleep(NAVIGATION_DELAY)
        html_p1 = page.content()

        inferred_pages = get_total_pages(html_p1)
        total_pages = max_pages if max_pages is not None else inferred_pages
        if verbose:
            print(f"          Inferred: {inferred_pages} pages. Will scrape: {total_pages} pages.")

        records_p1 = parse_search_page(html_p1)
        if verbose:
            print(f"  Page  1/{total_pages} → {url_p1}  ({len(records_p1)} results)")
        all_records.extend(records_p1)

        # Pages 2..N
        for page_num in range(2, total_pages + 1):
            url = build_search_url(page_num)
            try:
                page.goto(url, wait_until="domcontentloaded")
                wait_for_results(page)
                time.sleep(NAVIGATION_DELAY)
                html = page.content()
                records = parse_search_page(html)
                if verbose:
                    print(f"  Page {page_num:2d}/{total_pages} → {url}  ({len(records)} results)")
                all_records.extend(records)
            except Exception as exc:
                print(f"  ERROR on page {page_num}: {exc}")

        # Deduplicate by UUID (page boundaries can overlap)
        seen: set[str] = set()
        deduped: list[dict] = []
        for r in all_records:
            if r["id"] not in seen:
                seen.add(r["id"])
                deduped.append(r)
        all_records = deduped
        if verbose:
            print(f"\n[Phase 1 complete] {len(all_records)} unique listings found.\n")

        # ----------------------------------------------------------------
        # Phase 2: Enrich each listing from its detail page
        # ----------------------------------------------------------------
        if fetch_details:
            if verbose:
                print(f"[Phase 2] Fetching detail pages for {len(all_records)} listings …")
            for i, record in enumerate(all_records, start=1):
                detail_url = record["url"]
                if verbose:
                    name_preview = record["name"][:55].ljust(55)
                    print(f"  [{i:3d}/{len(all_records)}] {name_preview}", end=" … ", flush=True)
                try:
                    page.goto(detail_url, wait_until="domcontentloaded")
                    time.sleep(DETAIL_DELAY)
                    html = page.content()
                    parse_detail_page(html, record)
                    if verbose:
                        print("ok")
                except Exception as exc:
                    if verbose:
                        print(f"ERROR: {exc}")
                time.sleep(DETAIL_DELAY)
            if verbose:
                print(f"\n[Phase 2 complete] All detail pages fetched.")
        else:
            if verbose:
                print("[Phase 2 skipped] --no-detail flag set.")

        browser.close()

    return all_records


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------
def save_json(records: list[dict], path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    print(f"\n[Output] JSON → {os.path.abspath(path)}  ({len(records)} records)")


def save_csv(records: list[dict], path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        for r in records:
            row = dict(r)
            if isinstance(row.get("categories"), list):
                row["categories"] = "; ".join(row["categories"])
            writer.writerow(row)
    print(f"[Output] CSV  → {os.path.abspath(path)}  ({len(records)} records)")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    args = sys.argv[1:]
    test_mode    = "--test"      in args
    no_detail    = "--no-detail" in args

    if test_mode:
        print("[TEST MODE] Scraping 2 pages only, skipping detail pages.")
        records = scrape(max_pages=2, fetch_details=False)
    else:
        records = scrape(fetch_details=not no_detail)

    save_json(records, JSON_OUT)
    save_csv(records, CSV_OUT)

    # Print summary of first 3 results
    print("\n" + "=" * 72)
    print("FIRST 3 RESULTS (verification)")
    print("=" * 72)
    for r in records[:3]:
        print(f"\nName         : {r['name']}")
        print(f"Address      : {r['address']}")
        print(f"Phone        : {r['phone']}")
        print(f"Email        : {r['email']}")
        print(f"Website      : {r['website']}")
        desc = r['description']
        print(f"Description  : {desc[:100]}{'…' if len(desc) > 100 else ''}")
        print(f"Categories   : {', '.join(r['categories'])}")
        print(f"Hours        : {r['hours']}")
        print(f"Eligibility  : {r['eligibility'][:100]}{'…' if len(r['eligibility']) > 100 else ''}")
        print(f"Service Area : {r['service_area']}")
        print(f"Providing Org: {r['providing_org']}")
        print(f"URL          : {r['url']}")
        print("-" * 72)
