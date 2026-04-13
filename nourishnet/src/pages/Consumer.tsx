import { useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useCatalog } from "../hooks/useCatalog";
import { useGeolocation } from "../hooks/useGeolocation";
import { useGeocode } from "../hooks/useGeocode";
import { distanceMiles } from "../utils/geo";
import { pointInGeoJSON } from "../utils/pointInPolygon";
import { consumerIcon } from "../utils/leafletIcons";
import RegionOverlay from "../components/RegionOverlay";
import { FlyToMarker, FitBounds } from "../components/MapController";
import PlaceCard from "../components/PlaceCard";
import PlaceDetail from "../components/PlaceDetail";
import type { Place } from "../types";

const MD_CENTER: [number, number] = [38.95, -77.05];

export default function Consumer() {
  const { catalog, error } = useCatalog();
  const geo = useGeolocation();
  const [search, setSearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const geocode = useGeocode(search);

  const userCoords: [number, number] | null = useMemo(() => {
    if (geo.lat && geo.lng) return [geo.lat, geo.lng];
    if (geocode.result) return [geocode.result.lat, geocode.result.lng];
    return null;
  }, [geo.lat, geo.lng, geocode.result]);

  const counties = useMemo(() => {
    if (!catalog) return [];
    const set = new Set(catalog.places.map((p) => p.county).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [catalog]);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const filtered = useMemo(() => {
    if (!catalog) return [];
    let list = catalog.places;

    if (geocode.result?.boundary) {
      list = list.filter((p) => {
        if (p.lat == null || p.lng == null) return true;
        return pointInGeoJSON(p.lat, p.lng, geocode.result!.boundary);
      });
    }

    if (countyFilter) list = list.filter((p) => p.county === countyFilter);
    if (dayFilter) list = list.filter((p) => p.hours.toLowerCase().includes(dayFilter.toLowerCase()));

    if (userCoords) {
      list = [...list].sort((a, b) => {
        const da = a.lat != null && a.lng != null ? distanceMiles(userCoords[0], userCoords[1], a.lat, a.lng) : Infinity;
        const db = b.lat != null && b.lng != null ? distanceMiles(userCoords[0], userCoords[1], b.lat, b.lng) : Infinity;
        return da - db;
      });
    }
    return list;
  }, [catalog, geocode.result, countyFilter, dayFilter, userCoords]);

  const mappable = filtered.filter(
    (p): p is Place & { lat: number; lng: number } => p.lat != null && p.lng != null
  );
  const selected = catalog?.places.find((p) => p.id === selectedId) ?? null;

  const selectedCoords: [number, number] | null =
    selected?.lat != null && selected?.lng != null ? [selected.lat, selected.lng] : null;

  const fitKey = useMemo(() => mappable.map((p) => p.id).join(","), [mappable]);
  const fitPoints = useMemo<[number, number][]>(() => mappable.map((p) => [p.lat, p.lng]), [mappable]);

  if (error) return <p className="p-8 text-red-600">Failed to load data: {error}</p>;
  if (!catalog) return <p className="p-8 text-gray-500 animate-subtle-pulse">Loading…</p>;

  return (
    <div>
      {/* Page header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Find Food Near You</h1>
          <p className="text-emerald-100 max-w-xl">
            Search by city, ZIP, county, or address to find food pantries, banks, and meal programs in Maryland and DC.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-5">
        {/* Search bar — floating glass style */}
        <div className="filter-bar rounded-2xl shadow-lg p-4 mb-6 border border-gray-200/50">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <label htmlFor="consumer-search" className="sr-only">Search by city, ZIP, county, or address</label>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                id="consumer-search"
                type="text"
                placeholder="Enter ZIP code to sort by distance…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white"
              />
            </div>
            <select
              id="county-filter"
              aria-label="Filter by county"
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white"
            >
              <option value="">All counties</option>
              {counties.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              id="day-filter"
              aria-label="Filter by day"
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white"
            >
              <option value="">Any day</option>
              {days.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <button
              onClick={geo.requestLocation}
              disabled={geo.loading}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
            >
              {geo.loading ? "Locating…" : "📍 My Location"}
            </button>
          </div>

          {/* Status line */}
          <div className="mt-3 min-h-[20px]">
            {geocode.loading && <p className="text-xs text-gray-400 animate-subtle-pulse">Searching…</p>}
            {geocode.error && <p className="text-xs text-red-500">{geocode.error}</p>}
            {geocode.result && (
              <p className="text-xs text-emerald-600">
                📍 Showing results near <span className="font-semibold">{geocode.result.displayName}</span>
                {geocode.result.boundary && " — region boundary on map"}
              </p>
            )}
            {geo.error && <p className="text-xs text-red-500">{geo.error}</p>}
            {!geocode.loading && !geocode.result && !geocode.error && (
              <p className="text-xs text-gray-400">
                Enter a ZIP code to sort locations by distance, or use "My Location" for automatic sorting.
              </p>
            )}
          </div>
        </div>

        {/* Selected place detail */}
        {selected && <PlaceDetail place={selected} onClose={() => setSelectedId(null)} />}

        {/* List + Map */}
        <div className="grid lg:grid-cols-5 gap-5 mb-8">
          <div
            ref={listRef}
            className="lg:col-span-2 max-h-[500px] overflow-y-auto space-y-2 styled-scrollbar pr-1"
            role="list"
            aria-label="Food assistance locations"
          >
            <div className="text-xs text-gray-500 font-medium px-1 mb-1">
              {filtered.length} location{filtered.length !== 1 ? "s" : ""} found
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm text-gray-500">No locations match your search.</p>
                <p className="text-xs text-gray-400 mt-1">Try a different area or clear your filters.</p>
              </div>
            )}
            {filtered.map((p) => {
              const dist =
                userCoords && p.lat != null && p.lng != null
                  ? distanceMiles(userCoords[0], userCoords[1], p.lat, p.lng)
                  : null;
              return (
                <div key={p.id} role="listitem">
                  <PlaceCard place={p} selected={selectedId === p.id} onSelect={setSelectedId} distance={dist} />
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-3 h-[500px] rounded-2xl overflow-hidden map-wrapper border border-gray-200">
            <MapContainer center={MD_CENTER} zoom={10} className="h-full w-full" scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RegionOverlay geocode={geocode.result} color="#059669" />
              <FitBounds points={fitPoints} fitKey={fitKey} />
              <FlyToMarker lat={selectedCoords?.[0] ?? null} lng={selectedCoords?.[1] ?? null} />
              <MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>
                {mappable.map((p) => (
                  <Marker
                    key={p.id}
                    position={[p.lat, p.lng]}
                    icon={consumerIcon}
                    eventHandlers={{ click: () => setSelectedId(p.id) }}
                  >
                    <Popup><strong>{p.name}</strong><br />{p.address}, {p.city}</Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
