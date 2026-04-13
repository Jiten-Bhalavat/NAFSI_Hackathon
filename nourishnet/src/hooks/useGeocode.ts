import { useState, useEffect, useRef, useCallback } from "react";
import type { LatLngBoundsExpression } from "leaflet";

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  /** GeoJSON polygon/multipolygon coordinates for the region boundary, or null */
  boundary: GeoJSON.GeoJsonObject | null;
  bounds: LatLngBoundsExpression | null;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  boundingbox: [string, string, string, string]; // [south, north, west, east]
  geojson?: GeoJSON.Geometry;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export function useGeocode(query: string, debounceMs = 500) {
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Bias results toward MD/DC area
        const params = new URLSearchParams({
          q: trimmed,
          format: "json",
          limit: "1",
          polygon_geojson: "1",
          viewbox: "-79.5,37.9,-75.0,39.8",
          bounded: "0",
          countrycodes: "us",
        });

        const res = await fetch(`${NOMINATIM_URL}?${params}`, {
          signal: controller.signal,
          headers: { "User-Agent": "NourishNet-ClassProject/1.0" },
        });

        if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
        const data: NominatimResult[] = await res.json();

        if (data.length === 0) {
          setResult(null);
          setError("No results found. Try a different search term.");
          setLoading(false);
          return;
        }

        const hit = data[0];
        const lat = parseFloat(hit.lat);
        const lng = parseFloat(hit.lon);
        const [south, north, west, east] = hit.boundingbox.map(Number);

        let boundary: GeoJSON.GeoJsonObject | null = null;
        if (
          hit.geojson &&
          (hit.geojson.type === "Polygon" || hit.geojson.type === "MultiPolygon")
        ) {
          boundary = {
            type: "Feature",
            properties: {},
            geometry: hit.geojson,
          } as GeoJSON.GeoJsonObject;
        }

        setResult({
          lat,
          lng,
          displayName: hit.display_name,
          boundary,
          bounds: [
            [south, west],
            [north, east],
          ],
        });
        setError(null);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Geocoding failed");
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [query, debounceMs]);

  return { result, loading, error, clear };
}
