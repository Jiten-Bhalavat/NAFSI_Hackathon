import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { GeocodeResult } from "../hooks/useGeocode";

interface Props {
  geocode: GeocodeResult | null;
  color?: string;
}

export default function RegionOverlay({ geocode, color = "#059669" }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!geocode) return;

    // Fit map to the geocoded bounds
    if (geocode.bounds) {
      map.fitBounds(geocode.bounds as L.LatLngBoundsExpression, { padding: [30, 30] });
    } else {
      map.flyTo([geocode.lat, geocode.lng], 13, { duration: 1 });
    }

    // Draw boundary polygon if available
    let layer: L.GeoJSON | null = null;
    if (geocode.boundary) {
      layer = L.geoJSON(geocode.boundary as GeoJSON.GeoJsonObject, {
        style: {
          color,
          weight: 3,
          fillColor: color,
          fillOpacity: 0.08,
          dashArray: "6 4",
        },
      }).addTo(map);
    }

    return () => {
      if (layer) map.removeLayer(layer);
    };
  }, [geocode, map, color]);

  return null;
}
