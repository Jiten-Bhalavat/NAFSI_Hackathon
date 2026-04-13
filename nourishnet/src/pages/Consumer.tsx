import { useState, useMemo, useCallback, useRef, useTransition, useEffect } from "react";
import { useCatalog } from "../hooks/useCatalog";
import { useGeolocation } from "../hooks/useGeolocation";
import { useGeocode } from "../hooks/useGeocode";
import { distanceMiles, directionsUrl } from "../utils/geo";
import { pointInGeoJSON } from "../utils/pointInPolygon";
import NourishMap, { type MapPoint, type AddressLookup, PLACE_TYPE_COLOR } from "../components/NourishMap";
import PlaceCard from "../components/PlaceCard";
import PlaceDetail from "../components/PlaceDetail";
import EmergencyFoodModal from "../components/EmergencyFoodModal";
import QuickFoodRequest from "../components/QuickFoodRequest";
import type { Place, PlaceType } from "../types";

const TYPE_CHIPS: { type: PlaceType; icon: string; label: string }[] = [
  { type: "pantry",         icon: "🥫", label: "Pantries" },
  { type: "food-bank",      icon: "🏦", label: "Food Banks" },
  { type: "snap-store",     icon: "🛒", label: "SNAP Stores" },
  { type: "farmers-market", icon: "🌽", label: "Farmers Markets" },
];

export default function Consumer() {
  const { catalog, error } = useCatalog();
  const geo = useGeolocation();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [typeFilters, setTypeFilters] = useState<Set<PlaceType>>(new Set());
  const [visibleCount, setVisibleCount] = useState(60);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showQuickRequest, setShowQuickRequest] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
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

  // Wrap filter setters in startTransition so React defers the heavy re-render
  const setCountyFilterT = useCallback((v: string) => startTransition(() => setCountyFilter(v)), []);
  const setDayFilterT    = useCallback((v: string) => startTransition(() => setDayFilter(v)), []);

  const toggleType = useCallback((t: PlaceType) => {
    startTransition(() => {
      setTypeFilters((prev) => {
        // If this type is already the only active filter, clear all (toggle off)
        if (prev.size === 1 && prev.has(t)) return new Set();
        // Otherwise select ONLY this type (single-select)
        return new Set([t]);
      });
    });
  }, []);

  // Stage 1: geo-boundary (expensive — cached independently)
  const geoFiltered = useMemo(() => {
    if (!catalog) return [];
    if (!geocode.result?.boundary) return catalog.places;
    return catalog.places.filter((p) => {
      if (p.lat == null || p.lng == null) return true;
      return pointInGeoJSON(p.lat, p.lng, geocode.result!.boundary);
    });
  }, [catalog, geocode.result]);

  // Stage 2: discrete filters
  const filtered = useMemo(() => {
    let list = geoFiltered;
    // Only apply county filter to places that actually have a county set
    if (countyFilter) list = list.filter((p) => !p.county || p.county === countyFilter);
    if (dayFilter)    list = list.filter((p) => p.hours.toLowerCase().includes(dayFilter.toLowerCase()));
    if (typeFilters.size > 0) list = list.filter((p) => typeFilters.has(p.type as PlaceType));
    return list;
  }, [geoFiltered, countyFilter, dayFilter, typeFilters]);

  // Stage 3: distance sort
  const sorted = useMemo(() => {
    if (!userCoords) return filtered;
    return [...filtered].sort((a, b) => {
      const da = a.lat != null && a.lng != null ? distanceMiles(userCoords[0], userCoords[1], a.lat, a.lng) : Infinity;
      const db = b.lat != null && b.lng != null ? distanceMiles(userCoords[0], userCoords[1], b.lat, b.lng) : Infinity;
      return da - db;
    });
  }, [filtered, userCoords]);

  // Scroll list to top and reset pagination whenever filters change
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
    setSelectedId(null);
    setVisibleCount(60);
  }, [countyFilter, dayFilter, typeFilters, geocode.result]);

  const selected = useMemo(
    () => catalog?.places.find((p) => p.id === selectedId) ?? null,
    [catalog, selectedId]
  );

  // Map points — carry full rich data for popup
  const mapPoints = useMemo<MapPoint[]>(() =>
    sorted
      .filter((p): p is Place & { lat: number; lng: number } => p.lat != null && p.lng != null)
      .map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        label: p.name,
        sublabel: p.address ? `${p.address}, ${p.city}` : p.city,
        phone: p.phone || undefined,
        hours: p.hours || undefined,
        website: p.website || undefined,
        email: p.email || undefined,
        placeType: p.type,
        eligibility: p.eligibility || undefined,
        county: p.county || undefined,
        zip: p.zip || undefined,
        state: p.state || undefined,
        acceptsSnap: p.acceptsSnap,
        acceptsWic: p.acceptsWic,
        distributionModel: p.distributionModel,
        foodFormats: p.foodFormats,
        directionsUrl: directionsUrl(p.address, p.city, p.state, p.zip),
      })),
    [sorted]
  );

  const addressLookup = useMemo<AddressLookup>(() => {
    const lookup: AddressLookup = {};
    for (const p of sorted) {
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
  }, [sorted]);

  const distanceFor = useCallback(
    (p: Place) => {
      if (!userCoords || p.lat == null || p.lng == null) return null;
      return distanceMiles(userCoords[0], userCoords[1], p.lat, p.lng);
    },
    [userCoords]
  );

  const hasActiveFilters = typeFilters.size > 0 || !!countyFilter || !!dayFilter;
  const clearFilters = useCallback(() => {
    startTransition(() => {
      setTypeFilters(new Set());
      setCountyFilter("");
      setDayFilter("");
    });
  }, []);

  if (error) return <p className="p-8 text-red-600">Failed to load data: {error}</p>;
  if (!catalog) return <p className="p-8 text-gray-500 animate-subtle-pulse">Loading…</p>;

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Find Food Near You</h1>
            <p className="text-emerald-100 text-sm max-w-xl">
              Search by city, ZIP, county, or address to find food pantries, banks, SNAP stores, and farmers markets in Maryland.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => setShowEmergency(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg text-sm animate-pulse-slow transition-colors">
              🚨 I Need Food Now
            </button>
            <button onClick={() => setShowQuickRequest(true)} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs border border-white/30 transition-colors">
              🍎 Request Anonymously
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* ── Filter bar ── */}
        <div className="filter-bar rounded-2xl shadow-lg p-4 -mt-5 mb-4 border border-gray-200/50 relative z-10 bg-white">
          {/* Row 1 */}
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px] relative">
              <label htmlFor="consumer-search" className="sr-only">Search</label>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                id="consumer-search"
                type="text"
                autoComplete="off"
                placeholder="ZIP code or address…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white"
              />
            </div>
            <select
              aria-label="Filter by county"
              value={countyFilter}
              onChange={(e) => setCountyFilterT(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
            >
              <option value="">All counties</option>
              {counties.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              aria-label="Filter by day"
              value={dayFilter}
              onChange={(e) => setDayFilterT(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
            >
              <option value="">Any day</option>
              {days.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <button
              onClick={geo.requestLocation}
              disabled={geo.loading}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
            >
              {geo.loading ? "…" : "📍 Near Me"}
            </button>
          </div>

          {/* Row 2: type chips + SNAP/WIC */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {TYPE_CHIPS.map(({ type, icon, label }) => {
              const active = typeFilters.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  aria-pressed={active}
                  disabled={isPending}
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full border transition-all disabled:opacity-60 ${
                    active
                      ? "border-transparent text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                  style={active ? { backgroundColor: PLACE_TYPE_COLOR[type] } : undefined}
                >
                  {icon} {label}
                </button>
              );
            })}
            {hasActiveFilters && (
              <button onClick={clearFilters} disabled={isPending} className="text-xs text-gray-400 hover:text-gray-600 underline ml-1 disabled:opacity-50">
                Clear all
              </button>
            )}

            {/* Loading indicator — shown while transition is pending */}
            {isPending && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-emerald-500 animate-spin inline-block" />
                Filtering…
              </span>
            )}
          </div>

          {/* Geocode feedback */}
          {(geocode.loading || geocode.error || geocode.result || geo.error) && (
            <div className="mt-2">
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
          )}
        </div>

        {/* ── Main grid: list + map ── */}
        <div className="grid lg:grid-cols-5 gap-4 mb-6">

          {/* Left: list panel */}
          <div className="lg:col-span-2 flex flex-col gap-2" style={{ height: 620 }}>
            {/* Count bar */}
            <div className="flex items-center justify-between px-1 shrink-0">
              <span className="text-xs text-gray-500 font-medium">
                {isPending ? (
                  <span className="text-gray-400 italic">Updating…</span>
                ) : (
                  <>{sorted.length.toLocaleString()} location{sorted.length !== 1 ? "s" : ""}
                  {mapPoints.length < sorted.length && <span className="text-gray-400"> · {mapPoints.length.toLocaleString()} on map</span>}</>
                )}
              </span>
            </div>

            {/* Inline detail panel */}
            {selected && (
              <div className="shrink-0">
                <PlaceDetail place={selected} onClose={() => setSelectedId(null)} />
              </div>
            )}

            {/* Scrollable card list */}
            <div
              ref={listRef}
              className={`flex-1 overflow-y-auto space-y-1.5 styled-scrollbar pr-1 transition-opacity duration-150 ${isPending ? "opacity-40 pointer-events-none" : "opacity-100"}`}
              role="list"
              aria-label="Food assistance locations"
              aria-busy={isPending}
            >
              {!isPending && sorted.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-sm text-gray-500">No locations match your filters.</p>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="mt-2 text-xs text-emerald-600 underline">Clear filters</button>
                  )}
                </div>
              )}
              {sorted.slice(0, visibleCount).map((p) => (
                <div key={p.id} role="listitem">
                  <PlaceCard
                    place={p}
                    selected={selectedId === p.id}
                    onSelect={setSelectedId}
                    distance={distanceFor(p)}
                    onFilterByType={toggleType}
                  />
                </div>
              ))}
              {visibleCount < sorted.length && (
                <button
                  onClick={() => setVisibleCount((v) => v + 60)}
                  className="w-full py-3 text-sm text-emerald-600 font-medium hover:bg-emerald-50 rounded-xl border border-emerald-200 transition-colors"
                >
                  Show more ({sorted.length - visibleCount} remaining)
                </button>
              )}
            </div>
          </div>

          {/* Right: map with legend overlay */}
          <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-gray-200" style={{ height: 620 }}>
            <NourishMap
              points={mapPoints}
              variant="consumer"
              selectedId={selectedId}
              onSelect={setSelectedId}
              geocode={geocode.result}
              addressLookup={addressLookup}
              initialZoom={9}
            />

            {/* Legend overlay — bottom-left of map */}
            <div className="absolute bottom-3 left-3 z-10">
              {showLegend ? (
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-3 min-w-[160px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Legend</span>
                    <button
                      onClick={() => setShowLegend(false)}
                      className="text-gray-400 hover:text-gray-600 text-xs leading-none ml-3"
                      aria-label="Hide legend"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {TYPE_CHIPS.map(({ type, icon, label }) => {
                      const color = PLACE_TYPE_COLOR[type];
                      const active = typeFilters.size === 0 || typeFilters.has(type);
                      return (
                        <button
                          key={type}
                          onClick={() => toggleType(type)}
                          className={`flex items-center gap-2 w-full text-left rounded-lg px-1.5 py-1 transition-colors ${
                            active ? "opacity-100" : "opacity-40"
                          } hover:bg-gray-50`}
                          title={`Toggle ${label}`}
                        >
                          {/* Pin shape matching the actual map pin */}
                          <span className="shrink-0 flex flex-col items-center" style={{ width: 14 }}>
                            <span
                              className="rounded-full border-2 border-white shadow"
                              style={{ width: 12, height: 12, backgroundColor: color, display: "block" }}
                            />
                            <span style={{ width: 2, height: 5, backgroundColor: color, display: "block", marginTop: -1 }} />
                          </span>
                          <span className="text-xs text-gray-700 font-medium">{icon} {label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowLegend(true)}
                  className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
                  aria-label="Show legend"
                >
                  🗺️ Legend
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {showEmergency && catalog && (
        <EmergencyFoodModal places={catalog.places} onClose={() => setShowEmergency(false)} />
      )}
      {showQuickRequest && (
        <QuickFoodRequest onClose={() => setShowQuickRequest(false)} />
      )}
    </div>
  );
}
