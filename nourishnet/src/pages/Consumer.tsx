import { useState, useMemo, useRef } from "react";
import { useCatalog } from "../hooks/useCatalog";
import { useGeolocation } from "../hooks/useGeolocation";
import { useGeocode } from "../hooks/useGeocode";
import { distanceMiles } from "../utils/geo";
import { pointInGeoJSON } from "../utils/pointInPolygon";
import NourishMap, { type MapPoint, type AddressLookup } from "../components/NourishMap";
import PlaceCard from "../components/PlaceCard";
import PlaceDetail from "../components/PlaceDetail";
import type { Place } from "../types";

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

  const selected = catalog?.places.find((p) => p.id === selectedId) ?? null;

  const mapPoints = useMemo<MapPoint[]>(() =>
    filtered
      .filter((p): p is Place & { lat: number; lng: number } => p.lat != null && p.lng != null)
      .map((p) => ({
        id: p.id, lat: p.lat, lng: p.lng, label: p.name,
        sublabel: p.address ? `${p.address}, ${p.city}` : p.city,
        phone: p.phone, hours: p.hours,
      })),
    [filtered]
  );

  const addressLookup = useMemo<AddressLookup>(() => {
    const lookup: AddressLookup = {};
    for (const p of filtered) {
      if (p.lat == null && p.address) {
        lookup[p.id] = {
          label: p.name,
          address: `${p.address}, ${p.city}, ${p.state} ${p.zip}`.trim(),
          phone: p.phone || undefined,
          hours: p.hours || undefined,
        };
      }
    }
    return lookup;
  }, [filtered]);

  if (error) return <p className="p-8 text-red-600">Failed to load data: {error}</p>;
  if (!catalog) return <p className="p-8 text-gray-500 animate-subtle-pulse">Loading…</p>;

  return (
    <div>
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Find Food Near You</h1>
          <p className="text-emerald-100 max-w-xl">
            Search by city, ZIP, county, or address to find food pantries, banks, and meal programs in Maryland and DC.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-5">
        <div className="filter-bar rounded-2xl shadow-lg p-4 mb-6 border border-gray-200/50">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <label htmlFor="consumer-search" className="sr-only">Search by city, ZIP, county, or address</label>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                id="consumer-search"
                type="text"
                autoComplete="off"
                placeholder="City, ZIP, county, or address…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white"
              />
            </div>
            <select aria-label="Filter by county" value={countyFilter} onChange={(e) => setCountyFilter(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white">
              <option value="">All counties</option>
              {counties.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select aria-label="Filter by day" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white">
              <option value="">Any day</option>
              {days.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={geo.requestLocation} disabled={geo.loading} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 shadow-sm">
              {geo.loading ? "Locating…" : "📍 My Location"}
            </button>
          </div>
          <div className="mt-3 min-h-[20px]">
            {geocode.loading && <p className="text-xs text-gray-400 animate-subtle-pulse">Searching…</p>}
            {geocode.error && <p className="text-xs text-red-500">{geocode.error}</p>}
            {geocode.result && (
              <p className="text-xs text-emerald-600">
                📍 Near <span className="font-semibold">{geocode.result.displayName}</span>
                {geocode.result.boundary && " — boundary shown on map"}
              </p>
            )}
            {geo.error && <p className="text-xs text-red-500">{geo.error}</p>}
          </div>
        </div>

        {selected && <PlaceDetail place={selected} onClose={() => setSelectedId(null)} />}

        <div className="grid lg:grid-cols-5 gap-5 mb-8">
          <div ref={listRef} className="lg:col-span-2 max-h-[500px] overflow-y-auto space-y-2 styled-scrollbar pr-1" role="list" aria-label="Food assistance locations">
            <div className="text-xs text-gray-500 font-medium px-1 mb-1">
              {filtered.length} location{filtered.length !== 1 ? "s" : ""} found
              {mapPoints.length < filtered.length && ` (${mapPoints.length} on map)`}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm text-gray-500">No locations match your search.</p>
              </div>
            )}
            {filtered.map((p) => {
              const dist = userCoords && p.lat != null && p.lng != null
                ? distanceMiles(userCoords[0], userCoords[1], p.lat, p.lng) : null;
              return (
                <div key={p.id} role="listitem">
                  <PlaceCard place={p} selected={selectedId === p.id} onSelect={setSelectedId} distance={dist} />
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-3 h-[500px] rounded-2xl overflow-hidden map-wrapper border border-gray-200">
            <NourishMap
              points={mapPoints}
              variant="consumer"
              selectedId={selectedId}
              onSelect={setSelectedId}
              geocode={geocode.result}
              addressLookup={addressLookup}
              initialZoom={9}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
