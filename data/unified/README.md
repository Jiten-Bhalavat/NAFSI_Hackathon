# Unified Data

Three folders — one per stakeholder type. Each file is clean, snake_case, and ready for the React app.

---

## `consumer/` — Households finding food

| File | Rows | Used for |
|---|---|---|
| `food_pantries_unified.csv` | 1,265 | Find nearby food pantries by location/hours |
| `food_banks_cafb.csv` | 382 | Find CAFB food banks with per-day hours, eligibility, lat/lon |
| `farmers_markets.csv` | 21 | Find markets that accept SNAP/WIC; filter by payment method or product |
| `snap_retailer_locator.csv` | 4,196 | Find SNAP-authorized stores (grocery, supermarket, convenience) |
| `market_data.csv` | 189 | Find healthy food stores (grocery, meat, seafood) in PG County |
| `tracts_with_municipality.csv` | 283 | Map layer — shows if user's census tract is a food desert (RFEI, HFPA) |

---

## `donor/` — Donors giving food or money

| File | Rows | Used for |
|---|---|---|
| `food_pantries_unified.csv` | 1,265 | Find pantries to donate to; contact info, location |
| `food_banks_cafb.csv` | 382 | Find CAFB food banks to donate to; TEFAP status, email |
| `farmers_markets.csv` | 21 | Find markets to partner with; see what products they carry |
| `market_data.csv` | 189 | See where healthy food stores exist — identify supply gaps |
| `tracts_with_municipality.csv` | 283 | Prioritise donations — high RFEI tracts = most underserved areas |
| `feeding_america_maryland.csv` | 120 | County-level food insecurity rates and budget shortfalls |

---

## `volunteer/` — Volunteers giving time

| File | Rows | Used for |
|---|---|---|
| `food_pantries_unified.csv` | 1,265 | Find pantries near you to volunteer at; phone/hours |
| `food_banks_cafb.csv` | 382 | Find CAFB food banks near you; lat/lon for map |
| `farmers_markets.csv` | 21 | Find markets that may need volunteer help |

---

## Key fields across files

| Need | Field to use |
|---|---|
| Map pin | `latitude` / `longitude` |
| Filter by SNAP | `accepts_snap = True` (farmers_markets) or `store_type` (snap_retailer) |
| Filter by hours | `hours_monday` … `hours_sunday` (food_banks) or `hours` (pantries) |
| Prioritise by need | `rfei` + `is_healthy_food_priority_area` (tracts) or `food_insecurity_rate` (feeding_america) |
| Contact for donation | `email` (food_banks) or `phone` / `website` (pantries) |
