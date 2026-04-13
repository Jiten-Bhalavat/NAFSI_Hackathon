# Tasks: Zipcode Food Locator

## Task 1: Create Python Data Pipeline Foundation
- [x] 1.1 Create `convert_to_catalog.py` with CLI argument parsing (--no-geocode, --output, --frontend-copy) and main `convert_to_catalog()` entry point that orchestrates the pipeline steps: read unified CSV → enrich fields → deduplicate → geocode → write JSON to `data/unified/consumer/catalog.json` (source of truth) → copy to `nourishnet/public/data/catalog.json` (for Vite serving)
  > Requirements: 1.1, 1.9
- [x] 1.2 Implement `Place` dataclass in the script with all fields (id, name, address, city, state, zip, county, lat, lng, phone, email, hours, eligibility, requirements, tags, source, distribution_model, food_formats, dietary_info, website, hours_structured) and `to_dict()` method that serializes to camelCase JSON
  > Requirements: 1.2
- [x] 1.3 Implement `read_unified_csv(csv_path)` that reads `data/unified/consumer/food_pantries_unified.csv`, maps columns directly to Place fields (id as UUID, street→address, city, state, zip, etc.), sets lat/lng to None, splits categories on semicolons for tags, and calls inference functions for enrichment
  > Requirements: 1.1, 1.2, 1.4
- [x] 1.4 Implement `build_hours_string(hours, days)` that combines the hours and days CSV columns into a human-readable string, defaulting to "Hours not available" when both are empty
  > Requirements: 1.3

## Task 2: Implement Inference, Deduplication, and Geocoding
- [x] 2.1 Implement `infer_distribution_model(description, notes, categories, by_appointment)` keyword matcher that returns non-empty list from allowed set, defaulting to ["walk-in"]
  > Requirements: 1.5
- [x] 2.2 Implement `infer_food_formats(description, categories, tags)` keyword matcher that returns non-empty list from allowed set, defaulting to ["groceries"]
  > Requirements: 1.6
- [x] 2.3 Implement `deduplicate(places, threshold=0.85)` using SequenceMatcher fuzzy matching on normalized name+address; keeps record with more populated fields
  > Requirements: 1.8
- [x] 2.4 Implement `geocode_missing(places, delay_sec=1.1)` that queries Nominatim for places with null lat/lng, respects rate limit, uses geocode_cache.json for caching, and applies exponential backoff on HTTP 429
  > Requirements: 1.7, 3.1, 3.3
- [x] 2.5 Implement coordinate bounds validation that sets lat/lng to null for values outside Maryland/DC range (lat: 37.0-40.0, lng: -80.0 to -75.0) and ZIP format validation (5-digit pattern)
  > Requirements: 1.10, 1.11, 3.4

## Task 3: Extend Frontend Types and Catalog Hook
- [x] 3.1 Update `Place` interface in `nourishnet/src/types.ts` to add: distributionModel (string[]), foodFormats (string[]), dietaryInfo (string[]), email (string | null), website (string | null), hoursStructured (DayHours[] | null); add `DayHours` interface; update `Catalog` interface to add sources (SourceMeta[]) and bump schemaVersion to "2.0.0"
  > Requirements: 2.1, 2.6
- [x] 3.2 Update `useCatalog` hook if needed to handle the new schema fields; ensure backward compatibility so existing code doesn't break
  > Requirements: 2.6

## Task 4: Enhance PlaceCard Component
- [x] 4.1 Update `PlaceCard` to display distribution model icon badges (🚗 drive-through, 🚶 walk-in, 🏠 home-delivery, 📱 by-appointment, 🚚 mobile-pantry) below the hours line; show max 3 badges with "+N more" overflow
  > Requirements: 2.2
- [x] 4.2 Update `PlaceCard` to display food format tag pills (colored badges) below distribution model; show max 3 with "+N more" overflow
  > Requirements: 2.2

## Task 5: Enhance PlaceDetail Component
- [x] 5.1 Add structured hours table to `PlaceDetail` that renders day-by-day hours when `hoursStructured` is available, showing appointment-only and residents-only indicators and notes per day
  > Requirements: 2.3
- [x] 5.2 Add distribution model section to `PlaceDetail` with icons and labels
  > Requirements: 2.3
- [x] 5.3 Add food formats and dietary accommodations sections to `PlaceDetail`
  > Requirements: 2.3
- [x] 5.4 Add email link and website link to `PlaceDetail` contact section; hide sections when fields are null/empty
  > Requirements: 2.3, 2.5

## Task 6: Run Pipeline and Integration Verification
- [x] 6.1 Run `convert_to_catalog.py` on the unified CSV at `data/unified/consumer/food_pantries_unified.csv` to generate `data/unified/consumer/catalog.json` (source of truth); verify the script also copies it to `nourishnet/public/data/catalog.json` for frontend serving; verify output has places with new fields populated
  > Requirements: 1.1, 1.9
- [x] 6.2 Verify the frontend loads the new catalog.json without errors, ZIP code search returns distance-sorted results, and new fields render correctly in PlaceCard and PlaceDetail
  > Requirements: 2.4, 2.5
