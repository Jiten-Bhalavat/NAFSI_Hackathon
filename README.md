# NAFSI — data pipeline

Small layout so you can add **many sources** and feed a **web app** from `data/`.

## Layout

| Path | Role |
|------|------|
| [`config/sources.yaml`](config/sources.yaml) | Registry: one block per site (URLs, filters, `type`). |
| [`scrappers/nafsi/pipeline.py`](scrappers/nafsi/pipeline.py) | Config-driven fetch logic (ArcGIS, flyer PDF pages, checkpoints). |
| [`scrappers/nafsi/cli.py`](scrappers/nafsi/cli.py) | Pipeline CLI (`python -m nafsi.cli`). |
| `helpers/`, `scrappers/passive_scrappers/` | Shared helpers + standalone scrapers (same layout as [NAFSI_Track2](https://github.com/protocorn/NAFSI_Track2)). |
| `output/` | Committed sample CSV from those scrapers (separate from pipeline `data/sources/`). |
| `data/sources/<source_id>/` | Outputs: CSV + manifests (ArcGIS), or PDF + JSON text (flyer sources), plus `daily_status.json` and `.export_state.json`. |

Add a **`web/`** (or `frontend/`) app later that reads JSON/CSV from `data/` or an API — keep scrape code separate from UI.

### Data shapes (not one global schema)

Sources measure different things, so **columns are not unified** across the whole project. Each export is still **structured** (typed columns, not one blob):

| Area | Typical CSV / JSON | Notes |
|------|-------------------|--------|
| **Config pipeline** (`python -m nafsi.cli …`) | ArcGIS: retailer fields from the layer; flyer: `…_locations.csv` with `place_name`, `address`, `phone`, `hours`, `notes` + `content.locations` in JSON | Flyer columns are **heuristic** (PDF order); see `locations_meta` in the JSON. |
| **Standalone scrapers** (`scrappers/`) | e.g. Feeding America: `year`, `county`, `url`, food insecurity metrics, `scrape_error` | Teammate pattern: **`dataclass` → `csv.DictWriter`** with explicit field names (see `CountyScrapeRow` in `open_feeding_america_county_pages.py`). Default output: `output/feeding_america_maryland.csv`. |

A future web app can **normalize** into one API model (e.g. “resource type”, “geo”, “hours”) — the repo stays honest about per-source fields.

### Keeping layout clean (pipeline vs teammate style)

Your teammate’s structure is consistent: **`helpers/`** (shared lists like counties) + **`scrappers/<category>/`** (runnable scripts, argparse, **`--out`**) + **`output/`** (optional committed sample CSV for review or baselines).

The config-driven pipeline lives under **`scrappers/nafsi/`** next to passive scrapers, plus **`config/sources.yaml`** and **`data/sources/<source_id>/`** (runtime exports, mostly gitignored).

**Suggested conventions:**

1. **One folder per logical source under `data/sources/`** for anything generated on a schedule or at scale (matches the pipeline). Standalone scrapers can stay in `scrappers/` but use e.g. `--out data/sources/feeding_america_maryland/feeding_america_maryland.csv` so all machine outputs live under `data/` (keep `output/` only for small checked-in samples if you want a fixed diff in PRs).
2. **Reuse `helpers/`** from the pipeline when you need the same county/state lists (avoid duplicating geography).
3. **Do not commit** `__pycache__/`, large PDFs, or full scrapes — rely on `.gitignore` under `data/sources/`.
4. **New standalone scrapers:** follow the existing pattern (module docstring, `CountyScrapeRow`-style dataclass, `write_csv`, Playwright in `requirements.txt`).

## Run (repo root)

**PowerShell (Windows)**

```powershell
$env:PYTHONPATH = "$PWD\scrappers"
python -m pip install -r requirements.txt
python -m playwright install chromium
python -m nafsi.cli --config config/sources.yaml --source snap_retailer_locator
python -m nafsi.cli --config config/sources.yaml --source caroline_food_pantries_flyer
```

- **`--portal-only`** — (ArcGIS only) skip Chromium; read snapshot date from portal JSON.  
- **`--force-export`** — ignore checkpoint; always export.  

### Source types (in `config/sources.yaml`)

| `type` | Behavior |
|--------|-----------|
| `arcgis_feature_layer` | SNAP-style: date from locator UI / portal, then CSV from Feature Layer. |
| `flyer_pdf_page` | Reads **“Last Updated …”**, downloads the **PDF** (English page). **`pdf_text_pages: [0]`** = English only. Flat **`…csv`** (`idx`,`text`) plus optional **`flyer_structured_rows: true`** → **`…_locations.csv`** and **`content.locations`** with columns **place_name, address, phone, hours, notes** (heuristic; see `locations_meta.disclaimer`). |

## GitHub Actions

[`.github/workflows/daily-snap.yml`](.github/workflows/daily-snap.yml) runs **both** configured sources on a matrix, caches checkpoints per source, uploads each `data/sources/<id>/` folder as an artifact.
