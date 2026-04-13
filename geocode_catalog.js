/**
 * One-time script: geocodes all locations in catalog.json by ZIP code centroid.
 * Reads VITE_GOOGLE_MAPS_API_KEY from nourishnet/.env
 * Usage: node geocode_catalog.js
 */

const fs = require("fs");
const path = require("path");

// Read API key from .env
const envPath = path.join(__dirname, "nourishnet", ".env");
const envContent = fs.readFileSync(envPath, "utf8");
const match = envContent.match(/VITE_GOOGLE_MAPS_API_KEY=(.+)/);
if (!match) {
  console.error("VITE_GOOGLE_MAPS_API_KEY not found in nourishnet/.env");
  process.exit(1);
}
const API_KEY = match[1].trim();

const CATALOG_PATH = path.join(__dirname, "nourishnet", "public", "data", "catalog.json");
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));

const DELAY_MS = 50; // ~20 req/sec — well within Google's 50 QPS limit

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocodeZip(zip) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zip},USA&key=${API_KEY}&region=us`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.results.length) {
    console.warn(`  SKIP ${zip}: ${data.status}`);
    return null;
  }

  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

async function main() {
  const places = catalog.places;

  // Collect unique ZIPs
  const uniqueZips = [...new Set(places.map((p) => p.zip).filter(Boolean))];
  console.log(`Geocoding ${uniqueZips.length} unique ZIP codes…`);

  // Geocode each ZIP
  const zipMap = {};
  for (let i = 0; i < uniqueZips.length; i++) {
    const zip = uniqueZips[i];
    process.stdout.write(`[${i + 1}/${uniqueZips.length}] ZIP ${zip} … `);
    const coords = await geocodeZip(zip);
    if (coords) {
      zipMap[zip] = coords;
      process.stdout.write(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}\n`);
    } else {
      process.stdout.write("not found\n");
    }
    await sleep(DELAY_MS);
  }

  // Assign coordinates to all places
  let updated = 0;
  for (const place of places) {
    if (place.lat == null && place.zip && zipMap[place.zip]) {
      place.lat = zipMap[place.zip].lat;
      place.lng = zipMap[place.zip].lng;
      updated++;
    }
  }

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
  console.log(`\nDone. Updated ${updated}/${places.length} locations with coordinates.`);
  console.log(`ZIP lookup table: ${Object.keys(zipMap).length}/${uniqueZips.length} resolved.`);
}

main().catch(console.error);
