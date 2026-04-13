# Requirements: Zipcode Food Locator

## Requirement 1: Data Conversion Pipeline

### Description
A Python script (`convert_to_catalog.py`) that reads the unified CSV file (`data/unified/consumer/food_pantries_unified.csv`), maps its columns to the Place schema, infers enrichment fields from description and categories, deduplicates near-duplicates, geocodes all records (the CSV has no lat/lng), and outputs `catalog.json` to `data/unified/consumer/catalog.json` (the source of truth), then copies it to `nourishnet/public/data/catalog.json` for the Vite frontend to serve.

### Acceptance Criteria

#### 1.1 Unified CSV Ingestion
- GIVEN the file `data/unified/consumer/food_pantries_unified.csv` exists with columns: id, name, street, city, state, zip, county, phone, website, hours, days, contact, categories, description, source_url, source, raw_address
- WHEN the conversion script runs
- THEN it reads all rows from the single CSV and produces a non-empty catalog

#### 1.2 Direct Column Mapping
- GIVEN a row from the unified CSV
- WHEN the script maps it to a Place object
- THEN it uses the CSV columns directly: id→id (UUID, no generation), name→name, street→address, city→city, state→state, zip→zip, county→county, phone→phone, website→website, source→source

#### 1.3 Hours String Construction
- GIVEN a row with `hours` and `days` columns (either or both may be empty)
- WHEN the script builds the hours string
- THEN it combines them into a human-readable format (e.g., "Mon-Fri: 9AM-3PM"), defaulting to "Hours not available" when both are empty

#### 1.4 Categories to Tags
- GIVEN a row with a `categories` column containing semicolon-separated values (e.g., "Food Banks & Pantries; Food Pantries/Food Banks; Mobile Food Pantry Programs")
- WHEN the script processes categories
- THEN it splits on semicolons, trims whitespace, and stores as the `tags` array

#### 1.5 Distribution Model Inference
- GIVEN description and categories text from a unified CSV row
- WHEN infer_distribution_model is called
- THEN it returns a non-empty list of distribution model strings from the allowed set (walk-in, drive-through, home-delivery, mobile-pantry, by-appointment), defaulting to ["walk-in"] when no keywords match

#### 1.6 Food Format Inference
- GIVEN description, categories, and tags from a unified CSV row
- WHEN infer_food_formats is called
- THEN it returns a non-empty list of food format strings from the allowed set (pre-bagged, groceries, hot-meals, produce, prepared-meals, shelf-stable), defaulting to ["groceries"] when no keywords match

#### 1.7 Geocoding All Records
- GIVEN all places from the unified CSV have lat=None and lng=None (CSV has no coordinate columns)
- WHEN the geocoding step runs with geocode=True
- THEN it queries Nominatim for each place using street, city, state, zip with at least 1.1 second delay between requests, fills in coordinates when found, and leaves null when geocoding fails

#### 1.8 Cross-Record Deduplication
- GIVEN the unified CSV may contain near-duplicate records (same location from different original sources)
- WHEN the deduplication step runs
- THEN no two places in the output have fuzzy name+address similarity >= 0.85, and the record with more populated fields is kept

#### 1.9 Valid Output Schema
- GIVEN the pipeline has processed the unified CSV
- WHEN it writes catalog.json
- THEN the primary output at `data/unified/consumer/catalog.json` conforms to Catalog v2.0.0 schema with schemaVersion, generatedAt, sources metadata array, places array, and opportunities array, and an identical copy exists at `nourishnet/public/data/catalog.json`

#### 1.10 Coordinate Bounds Validation
- GIVEN a place with lat/lng values from the geocoder
- WHEN the pipeline validates coordinates
- THEN coordinates outside Maryland/DC bounds (lat: 37.0-40.0, lng: -80.0 to -75.0) are set to null

#### 1.11 ZIP Code Format Validation
- GIVEN a place with a zip field from the unified CSV
- WHEN the pipeline validates the zip
- THEN the output zip matches the 5-digit format (^\d{5}$) or is empty string for records where zip cannot be determined

---

## Requirement 2: Frontend Type and UI Enhancements

### Description
Extend the existing TypeScript Place type with new fields and update PlaceCard and PlaceDetail components to display distribution model, food formats, dietary accommodations, structured hours, email, and website.

### Acceptance Criteria

#### 2.1 Extended Place Type
- GIVEN the existing Place interface in types.ts
- WHEN the type is updated
- THEN it includes new fields: distributionModel (string[]), foodFormats (string[]), dietaryInfo (string[]), email (string | null), website (string | null), hoursStructured (DayHours[] | null) — all backward-compatible with existing code

#### 2.2 PlaceCard Distribution and Food Badges
- GIVEN a Place with distributionModel and foodFormats arrays
- WHEN PlaceCard renders
- THEN it displays distribution model as icon badges (e.g., 🚗 drive-through, 🚶 walk-in, 🏠 home-delivery) and food format tags, showing max 3 with "+N more" overflow

#### 2.3 PlaceDetail Full Information Display
- GIVEN a Place with all new fields populated
- WHEN PlaceDetail renders
- THEN it shows: structured hours table (day-by-day when hoursStructured is available), distribution model section with icons, food formats section, dietary accommodations section, email link, and website link

#### 2.4 Distance-Sorted Results for ZIP Code Search
- GIVEN a user enters a ZIP code in the search bar
- WHEN the search is processed via existing useGeocode hook (Nominatim) and results are displayed
- THEN all places are sorted by ascending distance from the ZIP code centroid, with distance badges shown on each PlaceCard

#### 2.5 Graceful Handling of Missing Fields
- GIVEN a Place where some new fields are empty arrays or null (e.g., no dietary info, no website)
- WHEN PlaceCard or PlaceDetail renders
- THEN those sections are hidden rather than showing empty containers

#### 2.6 Catalog Backward Compatibility
- GIVEN the updated catalog.json with schema v2.0.0
- WHEN useCatalog hook fetches and parses it
- THEN the opportunities array is preserved and the Catalog type includes the new SourceMeta array

---

## Requirement 3: Pipeline Robustness

### Description
The conversion pipeline handles errors gracefully, caches geocoding results, and can be run repeatedly with consistent output.

### Acceptance Criteria

#### 3.1 Geocode Caching
- GIVEN the pipeline has previously geocoded addresses
- WHEN it runs again
- THEN it reads from a local geocode_cache.json file and skips Nominatim API calls for already-cached addresses

#### 3.2 Missing CSV Handling
- GIVEN the unified CSV file at `data/unified/consumer/food_pantries_unified.csv` is missing
- WHEN the pipeline runs
- THEN it logs an error and exits with non-zero status (no partial catalog is written)

#### 3.3 Rate Limit Handling
- GIVEN Nominatim returns HTTP 429 during geocoding
- WHEN the pipeline encounters the rate limit
- THEN it applies exponential backoff (starting at 2 seconds, max 3 retries) before continuing

#### 3.4 Invalid Coordinate Handling
- GIVEN the geocoder returns coordinates outside Maryland/DC bounds (e.g., lat=0, lng=0 or lat=41.0)
- WHEN the pipeline validates that record
- THEN it sets lat and lng to null and logs a warning
