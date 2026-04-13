/**
 * NourishMap — MapLibre GL map with clustering, fly-to, fit-bounds, and region overlay.
 * Tile source: OpenFreeMap (https://openfreemap.org) — free, no key, vector tiles.
 *
 * For items without coordinates, pass their address via `addressLookup`.
 * When selected, the address is geocoded on-the-fly and the map flies there.
 */
import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import Map, { Marker, Popup, Source, Layer, type MapRef } from "react-map-gl/maplibre";
import Supercluster from "supercluster";
import type { GeocodeResult } from "../hooks/useGeocode";
import { directionsUrl } from "../utils/geo";

// ── Type label + icon per place type ─────────────────────────────────────────
const TYPE_LABEL: Record<string, { icon: string; label: string }> = {
  "pantry":         { icon: "🥫", label: "Food Pantry" },
  "food-bank":      { icon: "🏦", label: "Food Bank" },
  "snap-store":     { icon: "🛒", label: "SNAP Store" },
  "farmers-market": { icon: "🌽", label: "Farmers Market" },
};

const MODEL_ICONS: Record<string, string> = {
  "drive-through": "🚗", "walk-in": "🚶", "home-delivery": "🏠",
  "by-appointment": "📱", "mobile-pantry": "🚚",
};

// ── Rich popup rendered inside the MapLibre Popup ────────────────────────────
function RichPopup({ point, color }: { point: MapPoint; color: string }) {
  const typeMeta = point.placeType ? TYPE_LABEL[point.placeType] : null;
  const models: string[] = (() => { try { return JSON.parse(point.distributionModel as unknown as string ?? "[]"); } catch { return []; } })();
  const formats: string[] = (() => { try { return JSON.parse(point.foodFormats as unknown as string ?? "[]"); } catch { return []; } })();
  const dirUrl = point.directionsUrl || (point.sublabel ? directionsUrl(point.sublabel, "", "", "") : null);

  return (
    <div className="text-xs" style={{ minWidth: 220, maxWidth: 280 }}>
      {/* Accent bar */}
      <div className="h-1 -mx-3 -mt-3 mb-2 rounded-t" style={{ backgroundColor: color }} />

      {/* Type badge + name */}
      {typeMeta && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded mb-1"
          style={{ backgroundColor: color + "22", color }}>
          {typeMeta.icon} {typeMeta.label}
        </span>
      )}
      <p className="font-bold text-sm text-gray-900 leading-tight mb-0.5">{point.label}</p>
      {point.sublabel && <p className="text-gray-500 mb-1">{point.sublabel}</p>}

      {/* Hours */}
      {point.hours && point.hours !== "Hours not available" && (
        <p className="text-gray-600 mb-1">🕐 {point.hours}</p>
      )}

      {/* Eligibility */}
      {point.eligibility && (
        <p className="text-gray-600 mb-1">✅ {point.eligibility}</p>
      )}

      {/* SNAP / WIC */}
      {(point.acceptsSnap || point.acceptsWic) && (
        <div className="flex gap-1 mb-1.5">
          {point.acceptsSnap && <span className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-medium">💳 SNAP</span>}
          {point.acceptsWic  && <span className="bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-medium">🍼 WIC</span>}
        </div>
      )}

      {/* Distribution models */}
      {models.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {models.map((m) => (
            <span key={m} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">
              {MODEL_ICONS[m] ?? "📦"} {m}
            </span>
          ))}
        </div>
      )}

      {/* Food formats */}
      {formats.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {formats.map((f) => (
            <span key={f} className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">{f}</span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-100 mt-1">
        {point.phone && (
          <a href={`tel:${point.phone}`}
            className="inline-flex items-center gap-1 text-white text-[10px] font-semibold px-2 py-1 rounded-lg"
            style={{ backgroundColor: color }}>
            📞 {point.phone}
          </a>
        )}
        {dirUrl && (
          <a href={dirUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[10px] font-medium px-2 py-1 rounded-lg hover:bg-gray-200">
            🗺️ Directions
          </a>
        )}
        {point.website && (
          <a href={point.website} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[10px] font-medium px-2 py-1 rounded-lg hover:bg-gray-200">
            🌐 Website
          </a>
        )}
        {point.email && (
          <a href={`mailto:${point.email}`}
            className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[10px] font-medium px-2 py-1 rounded-lg hover:bg-gray-200">
            ✉️ Email
          </a>
        )}
      </div>
    </div>
  );
}

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  phone?: string;
  hours?: string;
  website?: string;
  email?: string;
  placeType?: string;
  // Rich detail fields for full popup
  eligibility?: string;
  county?: string;
  zip?: string;
  state?: string;
  acceptsSnap?: boolean;
  acceptsWic?: boolean;
  distributionModel?: string[];
  foodFormats?: string[];
  directionsUrl?: string;
}

/** Items without coords: id → "address, city, state zip" */
export type AddressLookup = Record<string, { label: string; address: string; phone?: string; hours?: string; website?: string }>;

export type MarkerVariant = "consumer" | "donor" | "planner";

interface Props {
  points: MapPoint[];
  variant: MarkerVariant;
  selectedId: string | null;
  onSelect: (id: string) => void;
  geocode?: GeocodeResult | null;
  addressLookup?: AddressLookup;
  initialZoom?: number;
  /** Extra MapLibre layers to render inside the map (e.g. choropleth overlay) */
  children?: React.ReactNode;
}

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const MD_CENTER = { longitude: -77.05, latitude: 38.95 };
const VARIANT_COLOR: Record<MarkerVariant, string> = {
  consumer: "#059669",
  donor:    "#d97706",
  planner:  "#2563eb",
};

// Per-type pin colors for consumer map
export const PLACE_TYPE_COLOR: Record<string, string> = {
  "pantry":         "#059669", // emerald
  "food-bank":      "#2563eb", // blue
  "snap-store":     "#7c3aed", // violet
  "farmers-market": "#d97706", // amber
};

function clusterClass(count: number) {
  if (count < 10) return "nn-cluster nn-cluster-sm";
  if (count < 50) return "nn-cluster nn-cluster-md";
  return "nn-cluster nn-cluster-lg";
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({
      q: `${address}, Maryland, USA`,
      format: "json",
      limit: "1",
      countrycodes: "us",
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": "NourishNet-ClassProject/1.0" },
    });
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export default function NourishMap({
  points, variant, selectedId, onSelect, geocode, addressLookup = {}, initialZoom = 9, children,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const [zoom, setZoom] = useState(initialZoom);
  const zoomRef = useRef(initialZoom);
  const [viewBounds, setViewBounds] = useState<[number, number, number, number] | null>(null);
  const [popupPoint, setPopupPoint] = useState<MapPoint | null>(null);
  // Temporary pin for address-only items that were geocoded on the fly
  const [tempPin, setTempPin] = useState<MapPoint | null>(null);
  // Cache geocoded addresses so we don't re-fetch
  const geocodeCache = useRef<Record<string, { lat: number; lng: number }>>({});

  const sc = useMemo(() => {
    const index = new Supercluster({ radius: 60, maxZoom: 16 });
    index.load(
      points.map((p) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
        properties: {
          id: p.id, label: p.label, sublabel: p.sublabel ?? "",
          phone: p.phone ?? "", hours: p.hours ?? "", website: p.website ?? "",
          email: p.email ?? "",
          placeType: p.placeType ?? "",
          eligibility: p.eligibility ?? "",
          county: p.county ?? "",
          zip: p.zip ?? "",
          state: p.state ?? "",
          acceptsSnap: p.acceptsSnap ?? false,
          acceptsWic: p.acceptsWic ?? false,
          distributionModel: JSON.stringify(p.distributionModel ?? []),
          foodFormats: JSON.stringify(p.foodFormats ?? []),
          directionsUrl: p.directionsUrl ?? "",
        },
      }))
    );
    return index;
  }, [points]);

  const clusters = useMemo(() => {
    if (!viewBounds) return [];
    return sc.getClusters(viewBounds, Math.floor(zoom));
  }, [sc, zoom, viewBounds]);

  const updateViewport = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const b = map.getBounds();
    setViewBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    const z = map.getZoom();
    setZoom(z);
    zoomRef.current = z;
  }, []);

  const pointsRef = useRef(points);
  useEffect(() => { pointsRef.current = points; }, [points]);

  const addressLookupRef = useRef(addressLookup);
  useEffect(() => { addressLookupRef.current = addressLookup; }, [addressLookup]);

  // Fly to selected point — handles both mapped pins and address-only items
  useEffect(() => {
    if (!selectedId) {
      setPopupPoint(null);
      setTempPin(null);
      return;
    }

    // Case 1: item has coordinates — fly directly
    const pt = pointsRef.current.find((p) => p.id === selectedId);
    if (pt) {
      setTempPin(null);
      setPopupPoint(pt);
      mapRef.current?.flyTo({
        center: [pt.lng, pt.lat],
        zoom: Math.max(zoomRef.current, 13),
        duration: 800,
      });
      return;
    }

    // Case 2: address-only item — geocode on the fly
    const entry = addressLookupRef.current[selectedId];
    if (!entry?.address) return;

    const cached = geocodeCache.current[selectedId];
    if (cached) {
      const pin: MapPoint = { id: selectedId, lat: cached.lat, lng: cached.lng, label: entry.label, phone: entry.phone, hours: entry.hours, website: entry.website };
      setTempPin(pin);
      setPopupPoint(pin);
      mapRef.current?.flyTo({ center: [cached.lng, cached.lat], zoom: Math.max(zoomRef.current, 14), duration: 800 });
      return;
    }

    // Geocode and fly
    geocodeAddress(entry.address).then((coords) => {
      if (!coords) return;
      geocodeCache.current[selectedId] = coords;
      const pin: MapPoint = { id: selectedId, lat: coords.lat, lng: coords.lng, label: entry.label, phone: entry.phone, hours: entry.hours, website: entry.website };
      setTempPin(pin);
      setPopupPoint(pin);
      mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: Math.max(zoomRef.current, 14), duration: 800 });
    });
  }, [selectedId]);

  // Fit bounds when filtered point set changes
  const fitKey = useMemo(() => points.map((p) => p.id).join(","), [points]);
  const prevFitKey = useRef("");
  useEffect(() => {
    if (fitKey === prevFitKey.current || points.length === 0) return;
    prevFitKey.current = fitKey;
    if (points.length === 1) {
      mapRef.current?.flyTo({ center: [points[0].lng, points[0].lat], zoom: 13, duration: 800 });
      return;
    }
    const lngs = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    mapRef.current?.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 60, maxZoom: 14, duration: 800 }
    );
  }, [fitKey, points]);

  // Fit to geocoded region
  const prevGeocode = useRef<string>("");
  useEffect(() => {
    if (!geocode) return;
    const key = `${geocode.lat},${geocode.lng}`;
    if (key === prevGeocode.current) return;
    prevGeocode.current = key;
    if (geocode.bounds) {
      const [[s, w], [n, e]] = geocode.bounds as [[number, number], [number, number]];
      mapRef.current?.fitBounds([[w, s], [e, n]], { padding: 40, duration: 800 });
    } else {
      mapRef.current?.flyTo({ center: [geocode.lng, geocode.lat], zoom: 12, duration: 800 });
    }
  }, [geocode]);

  const handleClusterClick = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      const z = Math.min(sc.getClusterExpansionZoom(clusterId), 20);
      mapRef.current?.flyTo({ center: [lng, lat], zoom: z, duration: 500 });
    },
    [sc]
  );

  const color = VARIANT_COLOR[variant];

  return (
    <Map
      ref={mapRef}
      mapStyle={STYLE_URL}
      initialViewState={{ ...MD_CENTER, zoom: initialZoom }}
      onLoad={updateViewport}
      onMoveEnd={updateViewport}
      onZoomEnd={updateViewport}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Extra overlay layers (e.g. choropleth) — rendered first so pins appear on top */}
      {children}

      {/* Region boundary */}
      {geocode?.boundary && (
        <Source id="nn-region" type="geojson" data={geocode.boundary as GeoJSON.Feature}>
          <Layer id="nn-region-fill" type="fill" paint={{ "fill-color": color, "fill-opacity": 0.08 }} />
          <Layer id="nn-region-line" type="line" paint={{ "line-color": color, "line-width": 2.5, "line-dasharray": [4, 3] }} />
        </Source>
      )}

      {/* Clustered pins */}
      {clusters.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        const props = feature.properties as {
          cluster?: boolean; cluster_id?: number; point_count?: number;
          id?: string; label?: string; sublabel?: string; phone?: string; hours?: string; website?: string;
          placeType?: string;
          email?: string; eligibility?: string; county?: string; zip?: string; state?: string;
          acceptsSnap?: boolean; acceptsWic?: boolean;
          distributionModel?: string; foodFormats?: string; directionsUrl?: string;
        };

        if (props.cluster) {
          return (
            <Marker key={`c-${props.cluster_id}`} longitude={lng} latitude={lat} anchor="center">
              <div
                className={clusterClass(props.point_count ?? 0)}
                onClick={() => handleClusterClick(props.cluster_id!, lng, lat)}
                role="button"
                aria-label={`${props.point_count} locations, click to expand`}
              >
                {props.point_count}
              </div>
            </Marker>
          );
        }

        const isSelected = props.id === selectedId;
        const pinColor = props.placeType && PLACE_TYPE_COLOR[props.placeType]
          ? PLACE_TYPE_COLOR[props.placeType]
          : color;
        return (
          <Marker key={props.id} longitude={lng} latitude={lat} anchor="bottom"
            onClick={(e) => { e.originalEvent.stopPropagation(); onSelect(props.id!); }}
          >
            <div
              className={`nn-pin nn-pin-${variant}${isSelected ? " nn-pin-selected" : ""}`}
              style={{ background: isSelected ? pinColor : pinColor, opacity: isSelected ? 1 : 0.85 }}
              role="button" aria-label={props.label} aria-pressed={isSelected}
            />
          </Marker>
        );
      })}

      {/* Temporary pin for address-only items */}
      {tempPin && tempPin.id === selectedId && (
        <Marker key={`temp-${tempPin.id}`} longitude={tempPin.lng} latitude={tempPin.lat} anchor="bottom">
          <div
            className={`nn-pin nn-pin-${variant} nn-pin-selected`}
            style={{ background: tempPin.placeType && PLACE_TYPE_COLOR[tempPin.placeType] ? PLACE_TYPE_COLOR[tempPin.placeType] : color }}
            role="img"
            aria-label={tempPin.label}
          />
        </Marker>
      )}

      {/* Rich popup */}
      {popupPoint && selectedId === popupPoint.id && (
        <Popup
          longitude={popupPoint.lng}
          latitude={popupPoint.lat}
          anchor="top"
          onClose={() => { setPopupPoint(null); setTempPin(null); }}
          closeButton
          closeOnClick={false}
          maxWidth="300px"
        >
          <RichPopup point={popupPoint} color={popupPoint.placeType && PLACE_TYPE_COLOR[popupPoint.placeType] ? PLACE_TYPE_COLOR[popupPoint.placeType] : color} />
        </Popup>
      )}
    </Map>
  );
}
