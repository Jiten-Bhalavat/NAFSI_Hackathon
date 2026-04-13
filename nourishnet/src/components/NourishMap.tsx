/**
 * NourishMap — MapLibre GL map with clustering, fly-to, fit-bounds, and region overlay.
 * Tile source: OpenFreeMap (https://openfreemap.org) — free, no key, vector tiles.
 *
 * For items without coordinates, pass their address via `addressLookup`.
 * When selected, the address is geocoded on-the-fly and the map flies there.
 */
import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import Map, { Marker, Popup, Source, Layer, type MapRef, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import Supercluster from "supercluster";
import type { GeocodeResult } from "../hooks/useGeocode";

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
  /** If provided, we will query these layer ids on mouse move and emit feature properties. */
  hoverLayerIds?: string[];
  onHoverFeature?: (props: Record<string, unknown> | null) => void;
  /** Show a small in-map toggle button for the overlay. */
  overlayToggle?: { visible: boolean; onToggle: () => void; label?: string };
}

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const MD_CENTER = { longitude: -77.05, latitude: 38.95 };
const VARIANT_COLOR: Record<MarkerVariant, string> = {
  consumer: "#059669",
  donor:    "#d97706",
  planner:  "#2563eb",
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
  hoverLayerIds = [],
  onHoverFeature,
  overlayToggle,
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

  const handleMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!onHoverFeature || hoverLayerIds.length === 0) return;
      const map = mapRef.current?.getMap();
      if (!map) return;
      const feats = map.queryRenderedFeatures(e.point, { layers: hoverLayerIds });
      const f = feats?.[0];
      // Avoid sending large geometries — only props.
      onHoverFeature((f?.properties as Record<string, unknown>) ?? null);
    },
    [hoverLayerIds, onHoverFeature]
  );

  const handleMouseLeave = useCallback(() => {
    if (!onHoverFeature || hoverLayerIds.length === 0) return;
    onHoverFeature(null);
  }, [hoverLayerIds.length, onHoverFeature]);

  return (
    <Map
      ref={mapRef}
      mapStyle={STYLE_URL}
      initialViewState={{ ...MD_CENTER, zoom: initialZoom }}
      onLoad={() => {
        updateViewport();
      }}
      onMoveEnd={updateViewport}
      onZoomEnd={() => {
        updateViewport();
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      attributionControl={false}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Extra overlay layers (e.g. choropleth) — rendered first so pins appear on top */}
      {children}

      {/* In-map overlay toggle (top-right) */}
      {overlayToggle && (
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={overlayToggle.onToggle}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-md border transition-colors ${
              overlayToggle.visible
                ? "bg-red-600 text-white border-red-700 hover:bg-red-700"
                : "bg-white/95 text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
            aria-pressed={overlayToggle.visible}
            aria-label={overlayToggle.label ?? "Show need in my area"}
          >
            <span className="text-sm leading-none">{overlayToggle.visible ? "🔴" : "⚪"}</span>
            {overlayToggle.visible ? "Hide Hunger Map" : "Show Hunger Map"}
          </button>
        </div>
      )}

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
        return (
          <Marker key={props.id} longitude={lng} latitude={lat} anchor="bottom"
            onClick={(e) => { e.originalEvent.stopPropagation(); onSelect(props.id!); }}
          >
            <div
              className={`nn-pin nn-pin-${variant}${isSelected ? " nn-pin-selected" : ""}`}
              style={{ background: isSelected ? color : undefined }}
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
            style={{ background: color }}
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
          maxWidth="260px"
        >
          <div className="text-xs space-y-1 p-1">
            <p className="font-semibold text-sm text-gray-900 leading-tight">{popupPoint.label}</p>
            {popupPoint.sublabel && <p className="text-gray-500">{popupPoint.sublabel}</p>}
            {popupPoint.hours && <p className="text-gray-600">🕐 {popupPoint.hours}</p>}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {popupPoint.phone && (
                <a href={`tel:${popupPoint.phone}`} className="bg-amber-600 text-white px-2 py-0.5 rounded text-xs font-medium hover:bg-amber-700">
                  📞 Call
                </a>
              )}
              {popupPoint.website && (
                <a href={popupPoint.website} target="_blank" rel="noopener noreferrer" className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs hover:bg-gray-200">
                  🌐 Website
                </a>
              )}
            </div>
          </div>
        </Popup>
      )}
    </Map>
  );
}
