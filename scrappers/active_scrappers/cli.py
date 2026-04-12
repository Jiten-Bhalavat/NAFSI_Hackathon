"""CLI: `python -m nafsi.cli` (set `PYTHONPATH=scrappers` from repo root)."""

from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import date
from pathlib import Path

import yaml

_REPO = Path(__file__).resolve().parents[2]
if str(_REPO / "scrappers") not in sys.path:
    sys.path.insert(0, str(_REPO / "scrappers"))

from nafsi.pipeline import (
    ExportCheckpoint,
    date_from_iso,
    fetch_flyer_page_snapshot,
    fetch_locator_snapshot_date,
    pick_printable_flyer_pdf_url,
    run_arcgis_export,
    run_flyer_pdf_ingest,
    utc_now_iso,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def _load_config(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _checkpoint_paths(source_dir: Path) -> tuple[Path, ExportCheckpoint | None, Path]:
    state_new = source_dir / ".export_state.json"
    state_legacy = source_dir / ".retailer_state.json"
    prev = ExportCheckpoint.from_path(state_new) or ExportCheckpoint.from_path(state_legacy)
    return state_new, prev, state_legacy


def _should_skip_export(
    site_date: date,
    prev: ExportCheckpoint | None,
    force: bool,
) -> tuple[bool, str | None]:
    """Returns (skip, reason) where reason is status action name."""
    if force or prev is None:
        return False, None
    try:
        last_export = date_from_iso(prev.snapshot_date)
    except ValueError:
        return False, None
    if site_date < last_export:
        return True, "skipped_site_older_than_state"
    if site_date == last_export:
        return True, "skipped_no_new_snapshot"
    return False, None


def run_arcgis_branch(
    match: dict,
    *,
    args: argparse.Namespace,
    out_root: Path,
    data_root_display: str,
) -> int:
    locator_url = match.get("locator_page_url")
    if not locator_url:
        logger.error("Source %r needs locator_page_url.", match["id"])
        return 1

    source_id = match["id"]
    source_dir = out_root / source_id
    source_dir.mkdir(parents=True, exist_ok=True)
    state_path, prev, _ = _checkpoint_paths(source_dir)
    status_path = source_dir / "daily_status.json"

    try:
        site_date, raw_subtitle = fetch_locator_snapshot_date(
            locator_url.strip(),
            headless=not args.headed,
            prefer_browser=not args.portal_only,
        )
    except Exception as e:
        logger.exception("Failed to read snapshot date: %s", e)
        _write_json(
            status_path,
            {
                "action": "error_subtitle",
                "error": str(e),
                "checked_at_utc": utc_now_iso(),
                "locator_page_url": locator_url,
            },
        )
        return 1

    site_iso = site_date.isoformat()
    prev_iso = prev.snapshot_date if prev else None
    skip, skip_reason = _should_skip_export(site_date, prev, args.force_export)
    if skip and skip_reason:
        logger.info("Skipping ArcGIS export (%s).", skip_reason)
        if prev:
            prev.last_checked_utc = utc_now_iso()
            prev.write(state_path)
        _write_json(
            status_path,
            {
                "action": skip_reason,
                "site_snapshot_date": site_iso,
                "site_subtitle_raw": raw_subtitle,
                "checkpoint_snapshot_date": prev.snapshot_date if prev else None,
                "checked_at_utc": utc_now_iso(),
            },
        )
        return 0

    logger.info("Exporting CSV (site=%s, previous=%s).", site_iso, prev_iso)
    manifest = run_arcgis_export(
        source_id=match["id"],
        name=match.get("name", match["id"]),
        layer_url=match["layer_url"],
        where=match["where"],
        out_fields=match.get("out_fields") or "*",
        out_dir=out_root,
        data_root_display=data_root_display,
        page_size=match.get("page_size"),
        return_geometry=bool(match.get("return_geometry", False)),
        order_by_fields=match.get("order_by_fields") or "ObjectId ASC",
    )
    if manifest.get("row_count") == 0:
        logger.warning("Zero rows exported.")
        _write_json(
            status_path,
            {
                "action": "error_zero_rows",
                "site_snapshot_date": site_iso,
                "site_subtitle_raw": raw_subtitle,
                "checked_at_utc": utc_now_iso(),
            },
        )
        return 2

    ExportCheckpoint(
        snapshot_date=site_iso,
        last_checked_utc=utc_now_iso(),
        last_export_utc=utc_now_iso(),
    ).write(state_path)
    _write_json(
        status_path,
        {
            "action": "exported_csv",
            "site_snapshot_date": site_iso,
            "site_subtitle_raw": raw_subtitle,
            "previous_checkpoint": prev_iso,
            "row_count": manifest.get("row_count"),
            "checked_at_utc": utc_now_iso(),
            "locator_page_url": locator_url,
        },
    )
    return 0


def run_flyer_pdf_branch(
    match: dict,
    *,
    args: argparse.Namespace,
    out_root: Path,
    data_root_display: str,
) -> int:
    page_url = (match.get("page_url") or "").strip()
    if not page_url:
        logger.error("Source %r needs page_url.", match["id"])
        return 1

    source_id = match["id"]
    source_dir = out_root / source_id
    source_dir.mkdir(parents=True, exist_ok=True)
    state_path, prev, _ = _checkpoint_paths(source_dir)
    status_path = source_dir / "daily_status.json"

    try:
        site_date, last_snippet, html = fetch_flyer_page_snapshot(
            page_url,
            headless=not args.headed,
        )
    except Exception as e:
        logger.exception("Failed to load flyer page: %s", e)
        _write_json(
            status_path,
            {"action": "error_page", "error": str(e), "checked_at_utc": utc_now_iso(), "page_url": page_url},
        )
        return 1

    site_iso = site_date.isoformat()
    prev_iso = prev.snapshot_date if prev else None
    skip, skip_reason = _should_skip_export(site_date, prev, args.force_export)
    if skip and skip_reason:
        logger.info("Skipping flyer download (%s).", skip_reason)
        if prev:
            prev.last_checked_utc = utc_now_iso()
            prev.write(state_path)
        _write_json(
            status_path,
            {
                "action": skip_reason,
                "site_snapshot_date": site_iso,
                "last_updated_snippet": last_snippet,
                "checkpoint_snapshot_date": prev.snapshot_date if prev else None,
                "checked_at_utc": utc_now_iso(),
                "page_url": page_url,
            },
        )
        return 0

    try:
        pdf_url = pick_printable_flyer_pdf_url(html)
    except Exception as e:
        logger.exception("Could not find PDF URL: %s", e)
        _write_json(
            status_path,
            {
                "action": "error_no_pdf",
                "error": str(e),
                "site_snapshot_date": site_iso,
                "checked_at_utc": utc_now_iso(),
            },
        )
        return 1

    pdf_pages = match.get("pdf_text_pages")
    if pdf_pages is not None and isinstance(pdf_pages, list):
        pdf_pages = [int(x) for x in pdf_pages]
    else:
        pdf_pages = None

    logger.info("Ingesting flyer (site=%s, previous=%s).", site_iso, prev_iso)
    try:
        manifest = run_flyer_pdf_ingest(
            source_id=source_id,
            name=match.get("name", source_id),
            page_url=page_url,
            pdf_url=pdf_url,
            snapshot_date=site_date,
            last_updated_snippet=last_snippet,
            out_dir=out_root,
            data_root_display=data_root_display,
            pdf_text_page_indices=pdf_pages,
            flyer_structured_rows=bool(match.get("flyer_structured_rows", False)),
        )
    except Exception as e:
        logger.exception("Flyer ingest failed: %s", e)
        _write_json(
            status_path,
            {
                "action": "error_ingest",
                "error": str(e),
                "site_snapshot_date": site_iso,
                "pdf_url": pdf_url,
                "checked_at_utc": utc_now_iso(),
            },
        )
        return 1

    if manifest.get("line_count", 0) == 0:
        logger.warning("PDF extracted zero lines — check PDF quality.")

    ExportCheckpoint(
        snapshot_date=site_iso,
        last_checked_utc=utc_now_iso(),
        last_export_utc=utc_now_iso(),
    ).write(state_path)
    _write_json(
        status_path,
        {
            "action": "exported_flyer",
            "site_snapshot_date": site_iso,
            "last_updated_snippet": last_snippet,
            "pdf_url": pdf_url,
            "previous_checkpoint": prev_iso,
            "line_count": manifest.get("line_count"),
            "checked_at_utc": utc_now_iso(),
            "page_url": page_url,
        },
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="NAFSI: checkpointed exports (ArcGIS CSV, flyer PDF+JSON, …)."
    )
    parser.add_argument("--config", type=Path, default=_REPO / "config" / "sources.yaml")
    parser.add_argument("--source", default="snap_retailer_locator")
    parser.add_argument("--out-root", type=Path, default=None)
    parser.add_argument("--force-export", action="store_true")
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--portal-only", action="store_true")
    args = parser.parse_args()

    cfg = _load_config(args.config)
    out_root = args.out_root or Path(cfg.get("output_root", "data/sources"))
    if not out_root.is_absolute():
        out_root = _REPO / out_root
    data_root_display = str(cfg.get("output_root", "data/sources")).replace("\\", "/")

    match = next((s for s in (cfg.get("sources") or []) if s.get("id") == args.source), None)
    if not match:
        logger.error("No source with id=%r in %s", args.source, args.config)
        return 1

    stype = match.get("type")
    if stype == "arcgis_feature_layer":
        return run_arcgis_branch(match, args=args, out_root=out_root, data_root_display=data_root_display)
    if stype == "flyer_pdf_page":
        return run_flyer_pdf_branch(match, args=args, out_root=out_root, data_root_display=data_root_display)

    logger.error("Unknown source type %r for %r.", stype, args.source)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
