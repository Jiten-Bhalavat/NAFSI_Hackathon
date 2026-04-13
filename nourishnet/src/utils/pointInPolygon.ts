/**
 * Ray-casting point-in-polygon test.
 * Works with a single ring (array of [lng, lat] pairs — GeoJSON order).
 */
function pointInRing(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = ring[i][1], xi = ring[i][0];
    const yj = ring[j][1], xj = ring[j][0];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Check if a lat/lng point is inside a GeoJSON Polygon or MultiPolygon geometry. */
export function pointInGeoJSON(
  lat: number,
  lng: number,
  geojson: GeoJSON.GeoJsonObject | null
): boolean {
  if (!geojson) return true; // no boundary = don't filter

  const feature = geojson as GeoJSON.Feature;
  const geom = feature.geometry ?? (geojson as GeoJSON.Geometry);

  if (geom.type === "Polygon") {
    const poly = geom as GeoJSON.Polygon;
    // Check outer ring, ignore holes for simplicity
    return pointInRing(lat, lng, poly.coordinates[0]);
  }

  if (geom.type === "MultiPolygon") {
    const multi = geom as GeoJSON.MultiPolygon;
    return multi.coordinates.some((poly) => pointInRing(lat, lng, poly[0]));
  }

  return true; // unsupported geometry type = don't filter
}
