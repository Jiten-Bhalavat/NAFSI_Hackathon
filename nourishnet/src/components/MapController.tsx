import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface FlyToProps {
  lat: number | null;
  lng: number | null;
}

/** Fly the map to a specific lat/lng when they change (e.g. user selects a list item). */
export function FlyToMarker({ lat, lng }: FlyToProps) {
  const map = useMap();
  const prev = useRef<string>("");

  useEffect(() => {
    if (lat == null || lng == null) return;
    const key = `${lat},${lng}`;
    if (key === prev.current) return;
    prev.current = key;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { duration: 0.8 });
  }, [lat, lng, map]);

  return null;
}

interface FitBoundsProps {
  points: Array<[number, number]>;
  /** Only re-fit when this key changes (e.g. a filter string) */
  fitKey: string;
}

/** Fit the map to show all given points whenever fitKey changes. */
export function FitBounds({ points, fitKey }: FitBoundsProps) {
  const map = useMap();
  const prev = useRef<string>("");

  useEffect(() => {
    if (fitKey === prev.current) return;
    prev.current = fitKey;
    if (points.length === 0) return;
    if (points.length === 1) {
      map.flyTo(points[0], 13, { duration: 0.8 });
      return;
    }
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true });
  }, [fitKey, points, map]);

  return null;
}
