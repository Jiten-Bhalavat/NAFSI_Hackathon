"""
NAFSI data pipeline: ArcGIS layers, Playwright (API + optional browser), checkpoints.

Intended to grow: add new fetch strategies here or as functions keyed by `type` in config.
"""

from __future__ import annotations

import csv
import json
import logging
import re
import urllib.error
import urllib.request
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterator
from urllib.parse import urljoin

from playwright.sync_api import APIRequestContext, sync_playwright

logger = logging.getLogger(__name__)

# --- shared -----------------------------------------------------------------

DEFAULT_USER_AGENT = (
    "NAFSI-SnapFetcher/1.0 (+https://github.com/; data pipeline for public ArcGIS layers)"
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def date_from_iso(s: str) -> date:
    return date.fromisoformat(s)


# --- export checkpoint (per source directory) --------------------------------

@dataclass
class ExportCheckpoint:
    """Last data snapshot we successfully exported (ISO YYYY-MM-DD)."""

    snapshot_date: str
    last_checked_utc: str | None = None
    last_export_utc: str | None = None

    @classmethod
    def from_path(cls, path: Path) -> ExportCheckpoint | None:
        if not path.is_file():
            return None
        raw = json.loads(path.read_text(encoding="utf-8"))
        snap = raw.get("snapshot_date") or raw.get("retailer_data_date")
        if not snap:
            return None
        return cls(
            snapshot_date=snap,
            last_checked_utc=raw.get("last_checked_utc"),
            last_export_utc=raw.get("last_export_utc"),
        )

    def write(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "snapshot_date": self.snapshot_date,
            "last_checked_utc": self.last_checked_utc,
            "last_export_utc": self.last_export_utc,
        }
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


# --- ArcGIS Feature Layer (Playwright APIRequestContext) --------------------

def _query_url(layer_url: str) -> str:
    base = layer_url.rstrip("/") + "/"
    return urljoin(base, "query")


@contextmanager
def playwright_request_context(user_agent: str) -> Iterator[APIRequestContext]:
    with sync_playwright() as p:
        ctx = p.request.new_context(user_agent=user_agent)
        try:
            yield ctx
        finally:
            ctx.dispose()


def _query_page(
    request: APIRequestContext,
    layer_url: str,
    *,
    where: str,
    out_fields: str,
    result_offset: int,
    result_record_count: int,
    return_geometry: bool,
    order_by_fields: str | None,
) -> dict[str, Any]:
    params: dict[str, Any] = {
        "f": "json",
        "where": where,
        "outFields": out_fields,
        "returnGeometry": "true" if return_geometry else "false",
        "resultOffset": result_offset,
        "resultRecordCount": result_record_count,
    }
    if order_by_fields:
        params["orderByFields"] = order_by_fields
    url = _query_url(layer_url)
    r = request.get(url, params=params, timeout=120_000)
    if not r.ok:
        raise RuntimeError(f"ArcGIS HTTP {r.status}: {r.text()[:500]}")
    data = r.json()
    if "error" in data:
        raise RuntimeError(f"ArcGIS error: {data['error']}")
    return data


def _iter_features_paginated(
    request: APIRequestContext,
    layer_url: str,
    *,
    where: str,
    out_fields: str = "*",
    page_size: int = 1000,
    return_geometry: bool = False,
    order_by_fields: str | None = None,
) -> Iterator[dict[str, Any]]:
    offset = 0
    while True:
        data = _query_page(
            request,
            layer_url,
            where=where,
            out_fields=out_fields,
            result_offset=offset,
            result_record_count=page_size,
            return_geometry=return_geometry,
            order_by_fields=order_by_fields,
        )
        feats = data.get("features") or []
        for f in feats:
            attrs = f.get("attributes")
            if attrs is not None:
                yield attrs
        n = len(feats)
        exceeded = bool(data.get("exceededTransferLimit"))
        if n == 0:
            break
        offset += n
        if not exceeded:
            break


def _fetch_layer_metadata(request: APIRequestContext, layer_url: str) -> dict[str, Any]:
    meta_url = layer_url.rstrip("/") + "?f=json"
    r = request.get(meta_url, timeout=60_000)
    if not r.ok:
        raise RuntimeError(f"ArcGIS layer metadata HTTP {r.status}: {r.text()[:500]}")
    data = r.json()
    if "error" in data:
        raise RuntimeError(f"ArcGIS layer metadata error: {data['error']}")
    return data


def export_features_to_csv(rows: list[dict[str, Any]], csv_path: Path) -> list[str]:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        csv_path.write_text("", encoding="utf-8")
        return []
    all_keys: set[str] = set()
    for row in rows:
        all_keys.update(row.keys())
    priority = ["Record_ID", "ObjectId", "Store_Name", "State", "City"]
    fieldnames = [k for k in priority if k in all_keys]
    fieldnames.extend(sorted(k for k in all_keys if k not in fieldnames))
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    return fieldnames


def run_arcgis_export(
    *,
    source_id: str,
    name: str,
    layer_url: str,
    where: str,
    out_fields: str,
    out_dir: Path,
    data_root_display: str,
    page_size: int | None,
    return_geometry: bool = False,
    order_by_fields: str | None = "ObjectId ASC",
    user_agent: str = DEFAULT_USER_AGENT,
) -> dict[str, Any]:
    with playwright_request_context(user_agent) as request:
        meta = _fetch_layer_metadata(request, layer_url)
        max_rc = int(meta.get("maxRecordCount") or 1000)
        effective_page = min(page_size or max_rc, max_rc)
        rows: list[dict[str, Any]] = []
        for attrs in _iter_features_paginated(
            request,
            layer_url,
            where=where,
            out_fields=out_fields,
            page_size=effective_page,
            return_geometry=return_geometry,
            order_by_fields=order_by_fields,
        ):
            rows.append(attrs)

    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    base = out_dir / source_id
    base.mkdir(parents=True, exist_ok=True)
    csv_name = f"{source_id}_{day}.csv"
    csv_path = base / csv_name
    fieldnames = export_features_to_csv(rows, csv_path)
    manifest = {
        "source_id": source_id,
        "name": name,
        "layer_url": layer_url,
        "where": where,
        "row_count": len(rows),
        "csv_file": f"{data_root_display.rstrip('/')}/{source_id}/{csv_name}",
        "manifest_file": f"{data_root_display.rstrip('/')}/{source_id}/{source_id}_{day}.manifest.json",
        "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
        "columns": fieldnames,
    }
    (base / f"{source_id}_{day}.manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    logger.info("Wrote %s rows to %s", len(rows), csv_path)
    return manifest


# --- SNAP locator: subtitle date (browser + portal fallback) ---------------

DATE_RE = re.compile(
    r"[/\s]*Retailer data updated:\s*(\d{1,2})/(\d{1,2})/(\d{4})",
    re.IGNORECASE,
)


def _app_item_id_from_locator_url(locator_page_url: str) -> str:
    m = re.search(r"[?&]id=([a-f0-9]{32})", locator_page_url, re.IGNORECASE)
    if not m:
        raise ValueError(f"Could not parse ArcGIS web app item id from URL: {locator_page_url!r}")
    return m.group(1)


def parse_retailer_data_date_from_text(text: str) -> date:
    m = DATE_RE.search(text.replace("\u200b", ""))
    if not m:
        raise ValueError(f"Could not parse retailer data date from: {text!r}")
    month, day, year = (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return date(year, month, day)


def _fetch_snapshot_date_portal(locator_page_url: str, *, timeout_s: int = 60) -> tuple[date, str]:
    item_id = _app_item_id_from_locator_url(locator_page_url)
    data_url = f"https://usda-fns.maps.arcgis.com/sharing/rest/content/items/{item_id}/data?f=pjson"
    req = urllib.request.Request(
        data_url,
        headers={"User-Agent": "NAFSI-SnapFetcher/1.0 (portal subtitle fallback)"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Portal config HTTP {e.code}: {e.reason}") from e
    sub = payload.get("subtitle") or ""
    if not sub:
        raise ValueError("Portal app config has no subtitle field.")
    raw = str(sub).strip()
    return parse_retailer_data_date_from_text(raw), raw


def _fetch_snapshot_date_browser(
    locator_page_url: str,
    *,
    headless: bool = True,
    navigation_timeout_ms: int = 120_000,
) -> tuple[date, str]:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (compatible; NAFSI-SnapFetcher/1.0; "
                "+https://github.com/; retailer subtitle check)"
            )
        )
        page = context.new_page()
        try:
            page.goto(locator_page_url, wait_until="domcontentloaded", timeout=navigation_timeout_ms)
            page.wait_for_selector("text=/Retailer data updated/i", timeout=90_000)
            raw = page.locator("text=/Retailer data updated/i").first.inner_text()
        finally:
            context.close()
            browser.close()
    raw = raw.strip()
    return parse_retailer_data_date_from_text(raw), raw


def fetch_locator_snapshot_date(
    locator_page_url: str,
    *,
    headless: bool = True,
    navigation_timeout_ms: int = 120_000,
    prefer_browser: bool = True,
) -> tuple[date, str]:
    """Retailer-data date from live page, or portal `subtitle` if Chromium unavailable."""
    if prefer_browser:
        try:
            return _fetch_snapshot_date_browser(
                locator_page_url,
                headless=headless,
                navigation_timeout_ms=navigation_timeout_ms,
            )
        except Exception as e:
            logger.info(
                "Chromium subtitle read failed (%s); using portal app config. "
                "Install: python -m playwright install chromium",
                e,
            )
    return _fetch_snapshot_date_portal(locator_page_url)


# --- Web page + flyer PDF (e.g. Caroline Better Together food pantries) ------

LAST_UPDATED_LONG_RE = re.compile(
    r"Last\s+Updated\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})",
    re.IGNORECASE,
)
PDF_HREF_RE = re.compile(r"""href=["'](https?://[^"']+\.pdf)["']""", re.IGNORECASE)


def parse_last_updated_long_date(text: str) -> tuple[date, str]:
    """Parse 'Last Updated February 10, 2026' from visible page text or HTML."""
    m = LAST_UPDATED_LONG_RE.search(text.replace("\u200b", ""))
    if not m:
        raise ValueError("Could not find 'Last Updated Month DD, YYYY' in page content.")
    label = m.group(1).strip()
    parsed = datetime.strptime(label, "%B %d, %Y").date()
    return parsed, m.group(0).strip()


def fetch_flyer_page_snapshot(
    page_url: str,
    *,
    headless: bool = True,
    navigation_timeout_ms: int = 120_000,
) -> tuple[date, str, str]:
    """
    Load the flyer page in Chromium; return (snapshot date, 'Last Updated …' snippet, HTML for PDF hrefs).
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (NAFSI flyer fetcher)"
            )
        )
        page = context.new_page()
        try:
            page.goto(page_url, wait_until="domcontentloaded", timeout=navigation_timeout_ms)
            page.wait_for_selector("text=/Last Updated/i", timeout=90_000)
            body_text = page.inner_text("body")
            html = page.content()
        finally:
            context.close()
            browser.close()
    combined = body_text + "\n" + html
    site_date, snippet = parse_last_updated_long_date(combined)
    return site_date, snippet, html


def pick_printable_flyer_pdf_url(html: str) -> str:
    """Choose a primary printable PDF link (first suitable https … .pdf)."""
    urls = PDF_HREF_RE.findall(html)
    if not urls:
        raise ValueError("No .pdf link found in page HTML.")
    for u in urls:
        if "storage.googleapis.com" in u and "media" in u:
            return u
    return urls[0]


def download_url_to_file(url: str, dest: Path, *, timeout_s: int = 120) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": DEFAULT_USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        dest.write_bytes(resp.read())


def extract_pdf_text(pdf_path: Path, *, page_indices: list[int] | None = None) -> str:
    """Extract text from selected PDF pages (0-based). Default: all pages."""
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    n = len(reader.pages)
    indices = list(range(n)) if page_indices is None else [i for i in page_indices if 0 <= i < n]
    chunks: list[str] = []
    for i in indices:
        t = reader.pages[i].extract_text()
        if t:
            chunks.append(t)
    return "\n\n".join(chunks).strip()


def clean_flyer_text_for_export(raw_text: str) -> dict[str, Any]:
    """
    Normalize PDF extraction: trim lines, collapse internal whitespace, drop empties.
    Paragraphs = blocks separated by blank lines in the raw extract (English flyer layout).
    """
    raw_text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
    lines_out: list[str] = []
    for line in raw_text.split("\n"):
        s = " ".join(line.split())
        if s:
            lines_out.append(s)
    paragraphs: list[str] = []
    for block in raw_text.split("\n\n"):
        s = " ".join(block.split())
        if s:
            paragraphs.append(s)
    records = [{"idx": i, "text": t} for i, t in enumerate(lines_out, start=1)]
    return {
        "lines": lines_out,
        "paragraphs": paragraphs,
        "records": records,
    }


def write_flyer_lines_csv(lines: list[str], csv_path: Path) -> None:
    """UTF-8 with BOM for Excel; columns idx, text."""
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    with csv_path.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        w.writerow(["idx", "text"])
        for i, text in enumerate(lines, start=1):
            w.writerow([i, text])


# --- Heuristic flyer → tabular locations (best-effort; PDF order may differ from print layout)

PHONE_LINE_RE = re.compile(r"^\s*(\d{3}-\d{3}-\d{4})\s*$")
ADDR_LINE_RE = re.compile(
    r"\d.+\b(?:"
    r"Street|St\.?|Avenue|Ave\.?|Lane|Ln|Road|Rd\.?|Drive|Dr\.?|Hub|Hall|Barn|Main|"
    r"Central|Henderson|University|Sunset|Williamson|Grove|Way|Line|Reed|Route|Park|"
    r"Fire\s+Hall|Box|Church|Hills|Plaza|Blvd|Court|Terrace"
    r")\b",
    re.I,
)
HOUR_LINE_RE = re.compile(
    r"\b(?:Mon|Tues?|Wed(?:nesday)?|Thurs?|Fri|Sat|Sun|Every|Everyday|Monthly|am|pm|"
    r"\d{1,2}:\d{2}|until|following)\b",
    re.I,
)
CAROLINE_TOWNS = frozenset(
    {
        "Ridgely",
        "Preston",
        "Denton",
        "Federalsburg",
        "Greensboro",
        "Goldsboro",
        "Marydel",
        "Cordova",
        "Denton",
    }
)


def _looks_like_hours_line(line: str) -> bool:
    s = line.lower()
    return bool(HOUR_LINE_RE.search(line)) or " am" in s or " pm" in s or "monthly" in s


def _classify_location_chunk(chunk: list[str], phone: str) -> dict[str, str]:
    """Turn lines before a phone into place_name, address, hours, notes."""
    chunk = [c.strip() for c in chunk if c.strip()]
    if not chunk:
        return {
            "place_name": "",
            "address": "",
            "phone": phone,
            "hours": "",
            "notes": "",
        }
    addr = ""
    addr_i: int | None = None
    for i, ln in enumerate(chunk):
        if ADDR_LINE_RE.search(ln):
            addr = ln
            addr_i = i
            break
    before_addr = chunk[:addr_i] if addr_i is not None else chunk
    after_addr = chunk[addr_i + 1 :] if addr_i is not None else []

    hour_lines = [ln for ln in chunk if _looks_like_hours_line(ln)]
    hours = "; ".join(hour_lines)

    name_parts: list[str] = []
    for ln in before_addr:
        if _looks_like_hours_line(ln):
            continue
        if ln in CAROLINE_TOWNS and len(before_addr) > 1:
            continue
        name_parts.append(ln)
    place_name = " ".join(name_parts).strip()
    if len(place_name) > 120:
        place_name = place_name[:117] + "..."

    tail = [ln for ln in after_addr if ln not in hour_lines]
    notes = " | ".join(tail)[:800] if tail else ""

    return {
        "place_name": place_name,
        "address": addr,
        "phone": phone,
        "hours": hours,
        "notes": notes,
    }


def _trim_flyer_chunk_header(chunk: list[str]) -> list[str]:
    """Drop leading title / blessing-box intro lines before the first real site block."""
    out = list(chunk)
    skip_substrings = (
        "FOOD PANTRIES",
        "CAROLINE BETTER",
        "BLESSING BOX",
        "Blessing Boxes are",
        "Need Immediate",
        "Food Assistance?",
    )
    while out:
        first = out[0].strip()
        if any(s in first for s in skip_substrings):
            out.pop(0)
            continue
        if first in CAROLINE_TOWNS and len(out) > 1:
            out.pop(0)
            continue
        break
    return out


def heuristic_locations_from_flyer_lines(lines: list[str]) -> list[dict[str, Any]]:
    """
    One row per standalone phone line: text *since the previous phone* up to this phone.
    (Avoids a sliding window that mixes multiple venues.) Entries with no phone are omitted.
    """
    phone_idxs = [i for i, line in enumerate(lines) if PHONE_LINE_RE.match(line)]
    rows: list[dict[str, Any]] = []
    for k, pi in enumerate(phone_idxs):
        lo = phone_idxs[k - 1] + 1 if k > 0 else 0
        chunk = _trim_flyer_chunk_header(lines[lo:pi])
        m = PHONE_LINE_RE.match(lines[pi])
        phone = m.group(1) if m else ""
        rec = _classify_location_chunk(chunk, phone)
        rec["source_line_end"] = pi + 1
        rows.append(rec)
    return rows


def write_locations_table_csv(records: list[dict[str, Any]], csv_path: Path) -> None:
    """Wide CSV: place_name, address, phone, hours, notes."""
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["place_name", "address", "phone", "hours", "notes"]
    with csv_path.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore", quoting=csv.QUOTE_MINIMAL)
        w.writeheader()
        for r in records:
            w.writerow({k: r.get(k, "") for k in fieldnames})


def run_flyer_pdf_ingest(
    *,
    source_id: str,
    name: str,
    page_url: str,
    pdf_url: str,
    snapshot_date: date,
    last_updated_snippet: str,
    out_dir: Path,
    data_root_display: str,
    pdf_text_page_indices: list[int] | None = None,
    flyer_structured_rows: bool = False,
) -> dict[str, Any]:
    """
    Download PDF only; extract text from selected pages (e.g. [0] = English, skip Spanish page).
    Writes JSON + CSV with cleaned lines (same content as the English JPG / PDF page 1).
    """
    day = snapshot_date.isoformat()
    base = out_dir / source_id
    base.mkdir(parents=True, exist_ok=True)
    pdf_name = f"{source_id}_{day}.pdf"
    json_name = f"{source_id}_{day}.json"
    csv_name = f"{source_id}_{day}.csv"
    loc_csv_name = f"{source_id}_{day}_locations.csv"
    pdf_path = base / pdf_name
    json_path = base / json_name
    csv_path = base / csv_name
    loc_csv_path = base / loc_csv_name

    logger.info("Downloading flyer PDF from %s", pdf_url)
    download_url_to_file(pdf_url, pdf_path)

    page_ix = pdf_text_page_indices if pdf_text_page_indices is not None else None
    raw_text = extract_pdf_text(pdf_path, page_indices=page_ix)
    cleaned = clean_flyer_text_for_export(raw_text)
    lines = cleaned["lines"]
    write_flyer_lines_csv(lines, csv_path)

    files_meta: dict[str, str] = {
        "pdf": f"{data_root_display.rstrip('/')}/{source_id}/{pdf_name}",
        "json": f"{data_root_display.rstrip('/')}/{source_id}/{json_name}",
        "csv": f"{data_root_display.rstrip('/')}/{source_id}/{csv_name}",
    }

    content_body: dict[str, Any] = {
        "line_count": len(lines),
        "lines": lines,
        "paragraphs": cleaned["paragraphs"],
        "records": cleaned["records"],
    }

    if flyer_structured_rows:
        locations = heuristic_locations_from_flyer_lines(lines)
        # Drop internal helper key for JSON cleanliness
        loc_json = [{k: v for k, v in r.items() if k != "source_line_end"} for r in locations]
        write_locations_table_csv(locations, loc_csv_path)
        files_meta["locations_csv"] = f"{data_root_display.rstrip('/')}/{source_id}/{loc_csv_name}"
        content_body["locations"] = loc_json
        content_body["locations_meta"] = {
            "row_count": len(locations),
            "method": "heuristic_phone_blocks",
            "disclaimer": (
                "Columns are inferred from lines before each standalone phone number. "
                "PDF text order may not match the printed multi-column flyer. "
                "Sites without a phone line on this page may be missing; verify against the PDF."
            ),
        }

    payload = {
        "source_id": source_id,
        "name": name,
        "page_url": page_url,
        "pdf_url": pdf_url,
        "snapshot_date": day,
        "last_updated_snippet": last_updated_snippet,
        "extracted_at_utc": utc_now_iso(),
        "content_scope": {
            "language": "english",
            "pdf_pages_extracted": page_ix if page_ix is not None else "all",
            "note": "Text from PDF page 1 (English). Structured columns are best-effort heuristics, not hand-keyed data.",
        },
        "files": files_meta,
        "content": content_body,
    }
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    log_files = [pdf_path.name, json_path.name, csv_path.name]
    if flyer_structured_rows:
        log_files.append(loc_csv_path.name)
    logger.info("Wrote %s", ", ".join(log_files))
    out = {
        "source_id": source_id,
        "name": name,
        "snapshot_date": day,
        "line_count": len(lines),
        "paragraph_count": len(cleaned["paragraphs"]),
        "pdf_path": str(pdf_path),
        "json_path": str(json_path),
        "csv_path": str(csv_path),
    }
    if flyer_structured_rows:
        out["locations_csv_path"] = str(loc_csv_path)
        out["location_row_count"] = len(content_body.get("locations", []))
    return out
