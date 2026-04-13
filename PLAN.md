# NourishNet — Full Assessment & Winning Plan

---

## What You're Doing Well

- **Architecture is solid.** Vite + React + TypeScript + Tailwind + MapLibre is the right stack. HashRouter means zero server config for GitHub Pages.
- **Three separate stakeholder views** (Consumer / Donor / Volunteer) match the challenge brief exactly — judges will notice this.
- **Supercluster + Nominatim boundary overlay** is genuinely impressive UX: type a city and get a boundary + filtered pins. Few teams will have this.
- **Chatbot with Gemini 2.0 Flash** is a real differentiator. Keyword-scored CSV context → LLM is the right approach for this size dataset.
- **Data pipeline is real.** CAFB (382 rows), pantries (1,265 rows), SNAP (4,196 rows), tracts (RFEI/HFPA), Feeding America county stats — this is not mock data.
- **PROMPTS.md** is already kept. That's the 30% prompt engineering score sorted.

---

## What's Off, Naive, or Redundant

### Critical (breaks the demo)

1. **Donor map is mostly blank.** `donor_catalog.json` shows `"lat": null, "lng": null` for the majority of `donorPlaces` — these come from `food_pantries_unified.csv` which lacks coordinates. The map the donor sees is empty.
2. **Chatbot won't run on GitHub Pages.** FastAPI + uvicorn is a Python backend. GitHub Pages is static-only. Judges clicking the live URL will get a broken chatbot unless it's hosted elsewhere (Railway, Render, etc.) and `VITE_CHATBOT_API` is set in the build.
3. **Volunteer page has no real data.** The `Opportunity[]` array in `catalog.json` is likely mock or empty — there's no script that generates real volunteer opportunities from the unified CSVs. The Planner page exists but does nothing meaningful.

### Significant (hurts score)

4. **`snap_retailer_locator.csv` (4,196 rows) is not in any catalog JSON.** It's in `consumer/` but the consumer catalog only loads `catalog.json` which has no SNAP stores. 4,196 real SNAP locations are completely invisible to users.
5. **`market_data.csv` (189 rows) is not in any catalog JSON.** Same problem — in the folder, not in the app.
6. **`farmers_markets.csv` is in the folder but unclear if in `donor_catalog.json`.** The `DonorCatalog` type has `partnerMarkets` but it may be empty.
7. **`food_banks_cafb.csv` is NOT in `catalog.json`.** The consumer catalog has no CAFB locations — 382 food banks with real lat/lon, per-day hours, TEFAP eligibility are invisible to households looking for food.
8. **Chatbot is only on the Donor page.** The consumer (food-insecure household) has no AI help. This is backwards — the most vulnerable user needs the most help navigating.
9. **`tracts_with_municipality.csv` and `feeding_america_maryland.csv` have no visual representation** — no map overlay, no choropleth. The data is there; the insight isn't surfaced.

### Minor (polish)

10. **Place names from 211md display as `"Food Pantry | Neighborhood Service Center Talbot County"`** — the pipe prefix looks broken to a normal user.
11. **Farmers market season dates are from 2013–2015.** Showing old dates to a user in 2026 is misleading.
12. **No SNAP/WIC filter** on the Consumer page. For the target audience, "Does this place accept SNAP?" is the most important filter.
13. **`donor_catalog.json` `summary` field is truncated mid-sentence** — the description from `food_pantry3.csv` is too long and unprocessed.

---

## Data Audit — Used vs. Unused

| Dataset | Status | Notes |
|---|---|---|
| `food_pantries_unified.csv` | Partially used | In `catalog.json` + `donor_catalog.json`. Missing lat/lon for ~60% of rows. |
| `food_banks_cafb.csv` | Partially used | In `donor_catalog.json` only. NOT in `catalog.json` — invisible to consumers. Has real lat/lon. |
| `farmers_markets.csv` | Unclear | In `donor_catalog.json` as `partnerMarkets`? Unconfirmed. Not in consumer catalog. |
| `snap_retailer_locator.csv` | **NOT USED** | In `consumer/` folder. Never added to any catalog JSON. 4,196 rows wasted. |
| `market_data.csv` | **NOT USED** | In both folders. Never added to any catalog JSON. 189 rows wasted. |
| `feeding_america_maryland.csv` | Partially used | In `donor_catalog.json` as `countyStats`. No visual representation. |
| `tracts_with_municipality.csv` | Partially used | In `donor_catalog.json` as `priorityTracts`. No map overlay rendered. |
| `volunteer/food_pantries_unified.csv` | **NOT USED** | No volunteer catalog JSON exists. |
| `volunteer/food_banks_cafb.csv` | **NOT USED** | Same — no volunteer catalog JSON. |
| `volunteer/farmers_markets.csv` | **NOT USED** | Same. |

---

## What to Build to Win

Scoring: **50% Usability / 30% Prompts / 20% Report**. Items are ranked by judging impact.

---

### Priority 1 — Fix the broken donor map

**Problem:** Donor map is empty — pantry rows lack lat/lon.

**Fix:** Rebuild `donor_catalog.json` so CAFB rows (all 382 have lat/lon) are included as `donorPlaces` alongside pantries. CAFB rows will all appear as map pins. Pantries without coordinates show in the list only.

Files:
- `donor_catalog.json` — rebuild from `data/unified/donor/food_banks_cafb.csv`
- New script: `build_catalogs.py` at repo root

---

### Priority 2 — Add CAFB + SNAP stores to the consumer catalog

**Problem:** `catalog.json` only has pantries. 382 food banks with real lat/lon, 4,196 SNAP stores, and 21 farmers markets are invisible to households.

**Fix:** Rebuild `catalog.json` to include four source types with a `type` field:
- `"pantry"` — from `food_pantries_unified.csv`
- `"food-bank"` — from `food_banks_cafb.csv` (382 rows, all geolocated)
- `"snap-store"` — from `snap_retailer_locator.csv`
- `"farmers-market"` — from `farmers_markets.csv`

Add type filter chips + SNAP/WIC filter toggles to the Consumer page.

Files:
- `build_catalogs.py` — new script, generates all catalog JSONs from unified CSVs
- `nourishnet/public/data/catalog.json` — rebuilt output
- `nourishnet/src/types.ts` — add `type`, `acceptsSnap`, `acceptsWic` to `Place`
- `nourishnet/src/pages/Consumer.tsx` — add type filter chips + SNAP/WIC toggles

---

### Priority 3 — Build a real Volunteer page

**Problem:** `Opportunity[]` is empty. Judges will click Volunteer and see nothing.

**Fix:** Generate `Opportunity` records in `catalog.json` from the volunteer CSVs. Each food bank becomes a volunteering opportunity with its phone, email, and hours. Each pantry with a phone number gets one too.

Files:
- `build_catalogs.py` — generates `opportunities[]` array in catalog.json
- `nourishnet/src/pages/Planner.tsx` — no changes needed; it already reads opportunities from catalog

---

### Priority 4 — Add a Consumer Chatbot

**Problem:** The food-insecure household has no AI help. The donor has one. This is backwards.

**Fix:** Add a `ConsumerChatbot` component to the Consumer page with a system prompt focused on: "I need food near [ZIP], what's open today, do I need ID?" Add a `POST /consumer-chat` endpoint to `chatbot.py` that loads consumer CSVs as context instead of donor CSVs.

Files:
- `Chatbot/chatbot.py` — add `/consumer-chat` endpoint
- `nourishnet/src/components/ConsumerChatbot.tsx` — new component (mirrors DonorChatbot)
- `nourishnet/src/pages/Consumer.tsx` — add `<ConsumerChatbot />`

---

### Priority 5 — Deploy the chatbot backend

**Problem:** GitHub Pages is static-only. FastAPI won't run there. The chatbot silently fails during judging.

**Fix:** Deploy `Chatbot/chatbot.py` to Railway or Render (free tier). Set `VITE_CHATBOT_API=https://your-app.up.railway.app` in the GitHub Pages build environment. This is ~10 minutes of work but is required for any chatbot functionality during judging.

Files:
- `Chatbot/chatbot.py` — add a `Procfile` or `railway.toml`
- `.github/workflows/` — add `VITE_CHATBOT_API` secret to the Pages deploy action

---

### Priority 6 — Add the food desert map layer

**Problem:** `tracts_with_municipality.csv` has RFEI and HFPA scores per census tract but there is no visual. No other team will have this.

**Fix:** Run `health_food_priorities.py` (which already fetches ArcGIS geometry) to produce a `tracts.geojson`. Add a toggle button "Show food deserts" to the map. Color tracts by RFEI: green (< 1) → yellow (1–3) → red (> 3). Clicking a tract shows its RFEI score and HFPA status.

Files:
- `scrappers/passive_scrappers/health_food_priorities.py` — already fetches geometry, run it to produce GeoJSON
- `nourishnet/public/data/tracts.geojson` — output placed here
- `nourishnet/src/components/NourishMap.tsx` — add optional GeoJSON overlay layer + toggle prop
- `nourishnet/src/pages/Consumer.tsx` and `Donor.tsx` — pass toggle state to NourishMap

---

### Priority 7 — Add a county food insecurity choropleth on the Donor map

**Problem:** `feeding_america_maryland.csv` has county food insecurity rates that just show as a text stat card. No spatial context.

**Fix:** Add a Maryland county GeoJSON choropleth layer to the Donor map, colored by `food_insecurity_rate`. Clicking a county shows its stats (rate, population, shortfall). Turns the Donor page into a genuine prioritization tool.

Files:
- `nourishnet/public/data/md_counties.geojson` — download public-domain MD county boundaries (~150 KB)
- `nourishnet/src/pages/Donor.tsx` — add choropleth layer using `countyStats` from `donor_catalog.json`
- `nourishnet/src/components/NourishMap.tsx` — add choropleth layer support

---

### Priority 9 — Donate vs. Divert decision tool (landfill data)

**Context:** The hackathon organizers explicitly provided landfill data (`data/cleaned/donor/Landfill/landfill_lmop.csv`, 49 MD landfills from EPA LMOP) for this purpose. A donor with surplus food needs to decide: is it worth transporting this food to a donation site, or is diverting to landfill closer/cheaper? This is the most direct tie to NourishNet's FoodLoops mission and a unique differentiator — no other team will have this.

**Problem:** The landfill data exists in the cleaned folder but is not used anywhere in the app.

**Fix:** Add a "Donate or Divert?" calculator panel on the Donor page. The donor enters their ZIP code or clicks their location on the map. The app computes:

1. Distance to nearest **open** food bank/pantry (from `food_banks_cafb.csv`)
2. Distance to nearest **open** landfill (from `landfill_lmop.csv`, filter `Current Landfill Status == "Open"`)
3. Estimated CO2 for each route: `distance_km × 0.21 kg CO2/km` (standard light-duty delivery vehicle emission factor)
4. Output: "Donating to [Name] is X miles away. The nearest open landfill is Y miles. Donating saves ~Z kg CO2 and redirects food from landfill to families."

The recommendation logic:
- If food bank is within 1.5× the landfill distance → **recommend donation**
- If food bank is more than 1.5× farther → **show both options with tradeoff** ("Donation is X miles farther but saves Z kg CO2 and feeds families")
- Always show CO2 savings as the emotional hook — even if the donation is farther, the CO2 saving is usually significant

Data needed in `donor_catalog.json`:
- Add `landfills` array: open MD landfills with `name`, `lat`, `lng`, `county`, `wasteInPlace`

Files:
- `build_catalogs.py` — add landfills array to donor_catalog.json (open ones only)
- `data/unified/donor/landfill_lmop.csv` — copy cleaned file here
- `nourishnet/src/components/DivertOrDonate.tsx` — new component: ZIP input → haversine calc → recommendation card
- `nourishnet/src/pages/Donor.tsx` — add `<DivertOrDonate />` panel

---

### Priority 10 — Fix name display and summaries

**Problem:** Names like `"Food Pantry | Neighborhood Service Center Talbot County"` look broken. Summaries are truncated mid-URL.

**Fix:** In `build_catalogs.py`, strip everything before and including ` | ` from 211md names. Extract clean summaries by finding the first meaningful sentence after the name/address/URL header block.

Files:
- `build_catalogs.py` — add `clean_name()` and `extract_summary()` helpers

---

## System Architecture

```
Data Pipeline
─────────────────────────────────────────────────────
Scrapers (active + passive)
  └─► clean_data.py + clean_data_pass2.py
        └─► data/unified/ CSVs (15 files, 3 folders)
              └─► build_catalogs.py  [NEW]
                    ├─► nourishnet/public/data/catalog.json
                    ├─► nourishnet/public/data/donor_catalog.json
                    └─► nourishnet/public/data/tracts.geojson  [NEW]

React App — GitHub Pages (static)
─────────────────────────────────────────────────────
Consumer page  ─► catalog.json  +  ConsumerChatbot  [NEW]
Donor page     ─► donor_catalog.json  +  DonorChatbot  +  Choropleth  [NEW]
Volunteer page ─► catalog.json (opportunities[])  [POPULATED]
NourishMap     ─► food desert overlay toggle  [NEW]

Chatbot Backend — Railway / Render (free tier)
─────────────────────────────────────────────────────
POST /chat          ─► donor CSVs context → Gemini 2.0 Flash
POST /consumer-chat ─► consumer CSVs context → Gemini 2.0 Flash  [NEW]
```

---

## Complete File Change List

| File | Change |
|---|---|
| `build_catalogs.py` | **New** — reads all unified CSVs, generates all catalog JSONs |
| `nourishnet/public/data/catalog.json` | Rebuilt — includes pantries + CAFB + SNAP + markets + opportunities |
| `nourishnet/public/data/donor_catalog.json` | Rebuilt — CAFB rows now mapped, summaries fixed, all sections populated |
| `nourishnet/public/data/tracts.geojson` | **New** — from `health_food_priorities.py` ArcGIS geometry |
| `nourishnet/public/data/md_counties.geojson` | **New** — public-domain MD county boundaries for choropleth |
| `nourishnet/src/types.ts` | Add `type`, `acceptsSnap`, `acceptsWic` to `Place` |
| `nourishnet/src/pages/Consumer.tsx` | Add type filter chips, SNAP/WIC toggles, `<ConsumerChatbot />`, food desert toggle |
| `nourishnet/src/pages/Donor.tsx` | Add county choropleth layer |
| `nourishnet/src/pages/Planner.tsx` | No change needed — already reads `opportunities[]` from catalog |
| `nourishnet/src/components/ConsumerChatbot.tsx` | **New** — mirrors DonorChatbot with consumer-focused prompt |
| `nourishnet/src/components/NourishMap.tsx` | Add GeoJSON overlay layer + choropleth layer support |
| `Chatbot/chatbot.py` | Add `POST /consumer-chat` endpoint with consumer CSV context |
| `.github/workflows/` | Add `VITE_CHATBOT_API` secret for GitHub Pages deploy |
| `data/unified/donor/landfill_lmop.csv` | **New** — copy of cleaned landfill data (open landfills only, with lat/lon) |
| `nourishnet/src/components/DivertOrDonate.tsx` | **New** — ZIP input → haversine distance calc → donate vs. divert recommendation |
| `nourishnet/src/pages/Donor.tsx` | Also add `<DivertOrDonate />` panel alongside choropleth |
