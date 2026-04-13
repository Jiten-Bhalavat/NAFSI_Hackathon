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

interface GoogleGeocodeResult {
  geometry: {
    location: { lat: number; lng: number };
    viewport: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  formatted_address: string;
  status?: string;
}

interface GoogleGeocodeResponse {
  status: string;
  results: GoogleGeocodeResult[];
}

const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

/** Returns true for a 5-digit US ZIP code */
function isZipCode(query: string): boolean {
  return /^\d{5}$/.test(query.trim());
}

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
        // Build address query — append ", USA" for ZIP codes to improve accuracy
        const addressQuery = isZipCode(trimmed) ? `${trimmed}, USA` : `${trimmed}, Maryland, USA`;

        const params = new URLSearchParams({
          address: addressQuery,
          key: API_KEY,
          region: "us",
        });

        const res = await fetch(`${GOOGLE_GEOCODE_URL}?${params}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);

        const data: GoogleGeocodeResponse = await res.json();

        if (data.status === "ZERO_RESULTS" || data.results.length === 0) {
          setResult(null);
          setError("No results found. Try a different ZIP or address.");
          setLoading(false);
          return;
        }

        if (data.status !== "OK") {
          throw new Error(`Geocoding error: ${data.status}`);
        }

        const hit = data.results[0];
        const { lat, lng } = hit.geometry.location;
        const { northeast, southwest } = hit.geometry.viewport;

        setResult({
          lat,
          lng,
          displayName: hit.formatted_address,
          boundary: null, // Google Geocoding API does not return polygon boundaries
          bounds: [
            [southwest.lat, southwest.lng],
            [northeast.lat, northeast.lng],
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
