import { useEffect, useMemo, useState } from "react";
import { useDonorCatalog } from "../hooks/useDonorCatalog";
import { useGeolocation } from "../hooks/useGeolocation";
import { useGeocode } from "../hooks/useGeocode";
import { distanceMiles } from "../utils/geo";
import { pointInGeoJSON } from "../utils/pointInPolygon";
import NourishMap, { type MapPoint, type AddressLookup } from "../components/NourishMap";
import FoodInsecurityOverlay, { InsecurityLegend } from "../components/FoodInsecurityOverlay";
import type { DonorPlace } from "../types";
import SurplusFoodBoard from "../components/SurplusFoodBoard";
import DonorImpactPanel from "../components/DonorImpactPanel";
import NeighborhoodDonation from "../components/NeighborhoodDonation";

const DONOR_TYPES = ["", "pantry", "food-bank"] as const;
const TYPE_LABELS: Record<string, string> = {
  "": "All",
  pantry: "🏠 Pantries",
  "food-bank": "🏦 Food Banks",
};

const TYPE_COLORS: Record<string, string> = {
  pantry: "bg-emerald-100 text-emerald-700",
  "food-bank": "bg-blue-100 text-blue-700",
};

export default function Donor() {
  const { catalog, error } = useDonorCatalog();
  const geo = useGeolocation();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [countyFilter, setCountyFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showImpact, setShowImpact] = useState(false);
  const [selectedHeatmapCounty, setSelectedHeatmapCounty] = useState<string | null>(null);

  const geocode = useGeocode(search);

  const userCoords: [number, number] | null = useMemo(() => {
    if (geo.lat && geo.lng) return [geo.lat, geo.lng];
    if (geocode.result) return [geocode.result.lat, geocode.result.lng];
    return null;
  }, [geo.lat, geo.lng, geocode.result]);

  const counties = useMemo(() => {
    if (!catalog) return [];
    const set = new Set(catalog.donorPlaces.map((p) => p.county).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [catalog]);

  const filtered = useMemo(() => {
    if (!catalog) return [];
    let list = catalog.donorPlaces;
    if (geocode.result?.boundary) {
      list = list.filter((p) => {
        if (p.lat == null || p.lng == null) return true;
        return pointInGeoJSON(p.lat, p.lng, geocode.result!.boundary);
      });
    }
    if (typeFilter) list = list.filter((p) => p.donorType === typeFilter);
    if (countyFilter) list = list.filter((p) => p.county === countyFilter);
    if (userCoords) {
      list = [...list].sort((a, b) => {
        const da = a.lat != null && a.lng != null ? distanceMiles(userCoords[0], userCoords[1], a.lat, a.lng) : Infinity;
        const db = b.lat != null && b.lng != null ? distanceMiles(userCoords[0], userCoords[1], b.lat, b.lng) : Infinity;
        return da - db;
      });
    }
    return list;
  }, [catalog, geocode.result, typeFilter, countyFilter, userCoords]);

  const mapPoints = useMemo<MapPoint[]>(() =>
    filtered
      .filter((p): p is DonorPlace & { lat: number; lng: number } => p.lat != null && p.lng != null)
      .map((p) => ({
        id: p.id, lat: p.lat, lng: p.lng, label: p.name,
        sublabel: p.address ? `${p.address}, ${p.city}` : p.city,
        phone: p.phone, hours: p.hours, website: p.website, email: p.email,
      })),
    [filtered]
  );

  // Address lookup for items without coordinates (pantries)
  const addressLookup = useMemo<AddressLookup>(() => {
    const lookup: AddressLookup = {};
    for (const p of filtered) {
      if (p.lat == null && p.address) {
        lookup[p.id] = {
          label: p.name,
          address: `${p.address}, ${p.city}, ${p.state} ${p.zip}`.trim(),
          phone: p.phone || undefined,
          hours: p.hours || undefined,
          website: p.website || undefined,
        };
      }
    }
    return lookup;
  }, [filtered]);

  const typeCounts = useMemo(() => {
    if (!catalog) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    for (const p of catalog.donorPlaces) counts[p.donorType] = (counts[p.donorType] || 0) + 1;
    return counts;
  }, [catalog]);

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7273/ingest/2e98aacf-fd4e-4abd-8ec2-44bbe6fa1fa2", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d952e0" },
      body: JSON.stringify({
        sessionId: "d952e0",
        runId: "pre-fix",
        hypothesisId: "H_mount",
        location: "Donor.tsx:mount",
        message: "Donor page mounted",
        data: { hasCatalog: Boolean(catalog), hasError: Boolean(error) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("http://127.0.0.1:7273/ingest/2e98aacf-fd4e-4abd-8ec2-44bbe6fa1fa2", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d952e0" },
      body: JSON.stringify({
        sessionId: "d952e0",
        runId: "pre-fix",
        hypothesisId: "H_catalogState",
        location: "Donor.tsx:state",
        message: "Donor page state",
        data: { hasCatalog: Boolean(catalog), error: error ?? null },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [catalog, error]);

  useEffect(() => {
    if (!catalog) return;
    fetch("http://127.0.0.1:7273/ingest/2e98aacf-fd4e-4abd-8ec2-44bbe6fa1fa2", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d952e0" },
      body: JSON.stringify({
        sessionId: "d952e0",
        runId: "pre-fix",
        hypothesisId: "H_render",
        location: "Donor.tsx:render",
        message: "Donor page catalog loaded",
        data: {
          donorPlacesCount: catalog.donorPlaces.length,
          countyStatsCount: catalog.countyStats?.length ?? 0,
          showHeatmap,
          showImpact,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [catalog, showHeatmap, showImpact]);
  // #endregion agent log

  if (error) return <p className="p-8 text-red-600">Failed to load data: {error}</p>;
  if (!catalog) return <p className="p-8 text-gray-500 animate-subtle-pulse">Loading donor data…</p>;

  return (
    <div>
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Donate Food or Funds</h1>
          <p className="text-amber-100 max-w-xl">
            Find {catalog.donorPlaces.length.toLocaleString()} food pantries and food banks across Maryland where you can donate.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {(["pantry", "food-bank"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
              className={`rounded-xl p-3 text-center transition-all ${
                typeFilter === t ? "bg-amber-600 text-white shadow-md" : "bg-white shadow-sm border border-gray-200 hover:border-amber-300"
              }`}
            >
              <div className="text-2xl font-bold">{(typeCounts[t] || 0).toLocaleString()}</div>
              <div className="text-xs mt-0.5">{TYPE_LABELS[t]}</div>
            </button>
          ))}
          <div className="rounded-xl p-3 text-center bg-white shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-red-600">
              {Math.round(
                catalog.countyStats
                  .filter((s) => s.year === "2021" || s.year === "2020")
                  .reduce((sum, s) => sum + s.foodInsecurePopulation, 0) / 1000
              )}K
            </div>
            <div className="text-xs mt-0.5">😟 Food Insecure (MD)</div>
          </div>
          <div className="rounded-xl p-3 text-center bg-white shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-amber-600">
              {catalog.donorPlaces.filter((p) => p.lat != null).length}
            </div>
            <div className="text-xs mt-0.5">📍 Mapped Locations</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar rounded-2xl shadow-lg p-4 mb-6 border border-gray-200/50">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <label htmlFor="donor-search" className="sr-only">Search by city, ZIP, county, or address</label>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                id="donor-search"
                type="text"
                autoComplete="off"
                placeholder="City, ZIP, county, or address…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 bg-white"
              />
            </div>
            <select aria-label="Filter by type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white">
              {DONOR_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <select aria-label="Filter by county" value={countyFilter} onChange={(e) => setCountyFilter(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white">
              <option value="">All counties</option>
              {counties.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={geo.requestLocation} disabled={geo.loading} className="bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-700 disabled:opacity-50 shadow-sm">
              {geo.loading ? "Locating…" : "📍 My Location"}
            </button>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${showHeatmap ? "bg-red-100 text-red-800 border-red-300" : "bg-white text-gray-600 border-gray-200 hover:border-red-300"}`}
            >
              🌡️ Food Insecurity Map
            </button>
            <button
              onClick={() => setShowImpact(!showImpact)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                showImpact ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
              }`}
            >
              💛 My Impact
            </button>
          </div>
          <div className="mt-3 min-h-[20px]">
            {geocode.loading && <p className="text-xs text-gray-400 animate-subtle-pulse">Searching…</p>}
            {geocode.error && <p className="text-xs text-red-500">{geocode.error}</p>}
            {geocode.result && (
              <p className="text-xs text-amber-600">
                📍 Near <span className="font-semibold">{geocode.result.displayName}</span>
                {geocode.result.boundary && " — boundary on map"}
              </p>
            )}
            {geo.error && <p className="text-xs text-red-500">{geo.error}</p>}
          </div>
        </div>

        {/* Donor Impact Panel */}
        {showImpact && (
          <DonorImpactPanel
            countyStats={catalog.countyStats}
            selectedCounty={selectedHeatmapCounty || countyFilter || undefined}
          />
        )}

        {/* Surplus Food Board */}
        <SurplusFoodBoard />

        {/* List + Map */}
        <div className="grid lg:grid-cols-5 gap-5 mb-8">
          {/* List with inline expandable details */}
          <div className="lg:col-span-2 max-h-[560px] overflow-y-auto space-y-1 styled-scrollbar pr-1" role="list" aria-label="Donor locations">
            <div className="text-xs text-gray-500 font-medium px-1 mb-2">
              {filtered.length.toLocaleString()} location{filtered.length !== 1 ? "s" : ""} found
              {mapPoints.length < filtered.length && ` · ${mapPoints.length} on map`}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🤲</div>
                <p className="text-sm text-gray-500">No locations match your filters.</p>
              </div>
            )}
            {filtered.slice(0, 200).map((p) => {
              const dist = userCoords && p.lat != null && p.lng != null
                ? distanceMiles(userCoords[0], userCoords[1], p.lat, p.lng) : null;
              const isOpen = selectedId === p.id;
              return (
                <div key={p.id} role="listitem">
                  {/* Card header — always visible */}
                  <button
                    onClick={() => setSelectedId(isOpen ? null : p.id)}
                    aria-expanded={isOpen}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all group ${
                      isOpen
                        ? "border-amber-400 bg-amber-50 rounded-b-none border-b-0"
                        : "border-transparent bg-white shadow-sm hover:shadow hover:border-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 group-hover:text-amber-700 truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.city}, {p.state}{p.county ? ` · ${p.county}` : ""}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {dist != null && <span className="text-xs text-amber-600 font-medium">{dist.toFixed(1)} mi</span>}
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${TYPE_COLORS[p.donorType] ?? "bg-gray-100 text-gray-600"}`}>{p.donorType}</span>
                        <span className={`text-gray-400 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                      </div>
                    </div>
                  </button>

                  {/* Inline detail panel — slides open */}
                  {isOpen && (
                    <div className="bg-amber-50 border border-amber-400 border-t-0 rounded-b-xl px-3 py-3 text-xs space-y-2">
                      {p.address && <p className="text-gray-600">📍 {p.address}, {p.city}, {p.state} {p.zip}</p>}
                      {p.hours && <p className="text-gray-600">🕐 {p.hours}</p>}
                      {p.eligibility && <p className="text-gray-600">ℹ️ {p.eligibility}</p>}
                      {p.summary && <p className="text-gray-500 italic">{p.summary}</p>}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {p.phone && (
                          <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1 bg-amber-600 text-white px-2.5 py-1 rounded-lg hover:bg-amber-700 font-medium">
                            📞 {p.phone}
                          </a>
                        )}
                        {p.email && (
                          <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-200">
                            ✉️ Email
                          </a>
                        )}
                        {p.website && (
                          <a href={p.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-200">
                            🌐 Website
                          </a>
                        )}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${p.address}, ${p.city}, ${p.state} ${p.zip}`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-200"
                        >
                          🗺️ Directions
                        </a>
                      </div>
                      {p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.tags.slice(0, 5).map((t) => (
                            <span key={t} className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length > 200 && (
              <p className="text-xs text-gray-400 text-center py-2">
                Showing first 200 of {filtered.length.toLocaleString()}. Use search or filters to narrow down.
              </p>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-3 h-[560px] rounded-2xl overflow-hidden map-wrapper border border-gray-200 relative">
            <NourishMap
              points={mapPoints}
              variant="donor"
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
              geocode={geocode.result}
              addressLookup={addressLookup}
              initialZoom={9}
            >
              <FoodInsecurityOverlay
                countyStats={catalog.countyStats}
                visible={showHeatmap}
              />
            </NourishMap>
            <InsecurityLegend visible={showHeatmap} />
          </div>
        </div>

        {/* Neighborhood donation section — always visible on donor page */}
        <NeighborhoodDonation
          countyStats={catalog.countyStats}
          highlightedCounty={selectedHeatmapCounty}
          onSelectCounty={(c) => {
            setSelectedHeatmapCounty(c);
            if (c) setShowImpact(true);
          }}
        />
      </div>
    </div>
  );
}
