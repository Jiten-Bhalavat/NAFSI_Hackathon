import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useDonorCatalog } from "../hooks/useDonorCatalog";
import { useGeolocation } from "../hooks/useGeolocation";
import { useGeocode } from "../hooks/useGeocode";
import { distanceMiles } from "../utils/geo";
import { pointInGeoJSON } from "../utils/pointInPolygon";
import { consumerIcon } from "../utils/leafletIcons";
import RegionOverlay from "../components/RegionOverlay";
import { FlyToMarker, FitBounds } from "../components/MapController";
import type { DonorPlace, CountyStat } from "../types";

const MD_CENTER: [number, number] = [38.95, -77.05];
const DONOR_TYPES = ["", "pantry", "food-bank", "farmers-market", "store"] as const;
const TYPE_LABELS: Record<string, string> = {
  "": "All Types",
  pantry: "🏠 Pantries",
  "food-bank": "🏦 Food Banks",
  "farmers-market": "🌽 Farmers Markets",
  store: "🛒 Stores",
};

export default function Donor() {
  const { catalog, error } = useDonorCatalog();
  const geo = useGeolocation();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [countyFilter, setCountyFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

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

  const mappable = filtered.filter(
    (p): p is DonorPlace & { lat: number; lng: number } => p.lat != null && p.lng != null
  );

  const selected = catalog?.donorPlaces.find((p) => p.id === selectedId) ?? null;

  // Coords of the selected item (for fly-to)
  const selectedCoords: [number, number] | null =
    selected?.lat != null && selected?.lng != null
      ? [selected.lat, selected.lng]
      : null;

  // Key that changes when the visible set of mappable points changes → triggers fit-bounds
  const fitKey = useMemo(
    () => mappable.map((p) => p.id).join(","),
    [mappable]
  );
  const fitPoints = useMemo<[number, number][]>(
    () => mappable.map((p) => [p.lat, p.lng]),
    [mappable]
  );

  // County stats for the selected county or top needs
  const relevantStats = useMemo(() => {
    if (!catalog) return [];
    let stats = catalog.countyStats;
    if (countyFilter) stats = stats.filter((s) => s.county === countyFilter);
    return stats
      .filter((s) => s.foodInsecurityRate != null)
      .sort((a, b) => (b.foodInsecurityRate ?? 0) - (a.foodInsecurityRate ?? 0))
      .slice(0, 10);
  }, [catalog, countyFilter]);

  // Summary counts
  const typeCounts = useMemo(() => {
    if (!catalog) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    for (const p of catalog.donorPlaces) {
      counts[p.donorType] = (counts[p.donorType] || 0) + 1;
    }
    return counts;
  }, [catalog]);

  if (error) return <p className="p-8 text-red-600">Failed to load data: {error}</p>;
  if (!catalog) return <p className="p-8 text-gray-500 animate-subtle-pulse">Loading donor data…</p>;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Donate Food or Funds</h1>
          <p className="text-amber-100 max-w-xl">
            Find {catalog.donorPlaces.length.toLocaleString()} locations across Maryland where you can donate food, produce, or funds.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-5">
        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {(["pantry", "food-bank", "farmers-market", "store"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
              className={`rounded-xl p-3 text-center transition-all ${
                typeFilter === t
                  ? "bg-amber-600 text-white shadow-md"
                  : "bg-white shadow-sm border border-gray-200 hover:border-amber-300"
              }`}
            >
              <div className="text-2xl font-bold">{(typeCounts[t] || 0).toLocaleString()}</div>
              <div className="text-xs mt-0.5">{TYPE_LABELS[t]}</div>
            </button>
          ))}
        </div>

        {/* Search & filters */}
        <div className="filter-bar rounded-2xl shadow-lg p-4 mb-6 border border-gray-200/50">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <label htmlFor="donor-search" className="sr-only">Search by city, ZIP, county, or address</label>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                id="donor-search"
                type="text"
                placeholder="City, ZIP, county, or address…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 bg-white"
              />
            </div>
            <select
              id="donor-type"
              aria-label="Filter by type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white"
            >
              {DONOR_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
            <select
              id="donor-county"
              aria-label="Filter by county"
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white"
            >
              <option value="">All counties</option>
              {counties.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={geo.requestLocation}
              disabled={geo.loading}
              className="bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-700 disabled:opacity-50 shadow-sm"
            >
              {geo.loading ? "Locating…" : "📍 My Location"}
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                showStats ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300"
              }`}
            >
              📊 Need Stats
            </button>
          </div>

          <div className="mt-3 min-h-[20px]">
            {geocode.loading && <p className="text-xs text-gray-400 animate-subtle-pulse">Searching…</p>}
            {geocode.error && <p className="text-xs text-red-500">{geocode.error}</p>}
            {geocode.result && (
              <p className="text-xs text-amber-600">
                📍 Showing results near <span className="font-semibold">{geocode.result.displayName}</span>
                {geocode.result.boundary && " — region boundary on map"}
              </p>
            )}
            {geo.error && <p className="text-xs text-red-500">{geo.error}</p>}
          </div>
        </div>

        {/* County food insecurity stats panel */}
        {showStats && relevantStats.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-amber-900 mb-3">
              📊 Food Insecurity by County {countyFilter ? `— ${countyFilter}` : "— Top 10 Most Affected"}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relevantStats.map((s) => (
                <CountyStatCard key={`${s.county}-${s.year}`} stat={s} />
              ))}
            </div>
          </div>
        )}

        {/* Selected place detail */}
        {selected && <DonorPlaceDetail place={selected} onClose={() => setSelectedId(null)} />}

        {/* List + Map */}
        <div className="grid lg:grid-cols-5 gap-5 mb-8">
          <div className="lg:col-span-2 max-h-[500px] overflow-y-auto space-y-2 styled-scrollbar pr-1" role="list" aria-label="Donor locations">
            <div className="text-xs text-gray-500 font-medium px-1 mb-1">
              {filtered.length.toLocaleString()} location{filtered.length !== 1 ? "s" : ""} found
              {mappable.length < filtered.length && ` (${mappable.length} on map)`}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🤲</div>
                <p className="text-sm text-gray-500">No locations match your filters.</p>
              </div>
            )}
            {filtered.slice(0, 200).map((p) => {
              const dist =
                userCoords && p.lat != null && p.lng != null
                  ? distanceMiles(userCoords[0], userCoords[1], p.lat, p.lng)
                  : null;
              return (
                <div key={p.id} role="listitem">
                  <DonorCard
                    place={p}
                    selected={selectedId === p.id}
                    onSelect={setSelectedId}
                    distance={dist}
                  />
                </div>
              );
            })}
            {filtered.length > 200 && (
              <p className="text-xs text-gray-400 text-center py-2">
                Showing first 200 of {filtered.length.toLocaleString()} results. Use search or filters to narrow down.
              </p>
            )}
          </div>

          <div className="lg:col-span-3 h-[500px] rounded-2xl overflow-hidden map-wrapper border border-gray-200">
            <MapContainer center={MD_CENTER} zoom={9} className="h-full w-full" scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RegionOverlay geocode={geocode.result} color="#d97706" />
              <FitBounds points={fitPoints} fitKey={fitKey} />
              <FlyToMarker
                lat={selectedCoords?.[0] ?? null}
                lng={selectedCoords?.[1] ?? null}
              />
              <MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>
                {mappable.map((p) => (
                  <Marker
                    key={p.id}
                    position={[p.lat, p.lng]}
                    icon={consumerIcon}
                    eventHandlers={{ click: () => setSelectedId(p.id) }}
                  >
                    <Popup>
                      <strong>{p.name}</strong><br />
                      {p.address}, {p.city}<br />
                      <em className="text-xs">{p.donorType}</em>
                    </Popup>
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

/* ── Sub-components ── */

function DonorCard({
  place,
  selected,
  onSelect,
  distance,
}: {
  place: DonorPlace;
  selected: boolean;
  onSelect: (id: string) => void;
  distance: number | null;
}) {
  const typeColors: Record<string, string> = {
    pantry: "bg-emerald-100 text-emerald-700",
    "food-bank": "bg-blue-100 text-blue-700",
    "farmers-market": "bg-green-100 text-green-700",
    store: "bg-gray-100 text-gray-600",
  };

  return (
    <button
      onClick={() => onSelect(place.id)}
      aria-pressed={selected}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all group ${
        selected
          ? "border-amber-500 bg-amber-50 shadow-md shadow-amber-100"
          : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-amber-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 group-hover:text-amber-700 truncate">
            {place.name}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {place.city}, {place.state} {place.zip}
            {place.county && <span className="text-gray-400"> · {place.county}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${typeColors[place.donorType] || "bg-gray-100 text-gray-600"}`}>
            {place.donorType}
          </span>
          {distance != null && (
            <span className="text-xs text-amber-600 font-medium">{distance.toFixed(1)} mi</span>
          )}
        </div>
      </div>
      {place.hours && (
        <div className="text-xs text-gray-600 mt-1.5 flex items-center gap-1">
          <span className="text-gray-400">🕐</span>
          <span className="truncate">{place.hours}</span>
        </div>
      )}
      {place.phone && (
        <div className="text-xs text-gray-500 mt-1">📞 {place.phone}</div>
      )}
      {!place.lat && (
        <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
          📍 Address only
        </div>
      )}
    </button>
  );
}

function DonorPlaceDetail({ place, onClose }: { place: DonorPlace; onClose: () => void }) {
  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${place.address}, ${place.city}, ${place.state} ${place.zip}`
  )}`;

  return (
    <div role="dialog" aria-label={`Details for ${place.name}`} className="bg-white border border-amber-200 rounded-2xl shadow-xl p-6 mb-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300" />
      <div className="flex justify-between items-start mb-3 pt-1">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{place.name}</h3>
          <span className="inline-block text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-lg mt-1">
            {place.donorType}
          </span>
        </div>
        <button onClick={onClose} aria-label="Close details" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">✕</button>
      </div>

      <p className="text-sm text-gray-600 mb-1">{place.address}, {place.city}, {place.state} {place.zip}</p>
      {place.county && <span className="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md mb-3">{place.county}</span>}

      {place.summary && <p className="text-sm text-gray-700 mb-3">{place.summary}</p>}

      <div className="grid sm:grid-cols-2 gap-3 my-4">
        {place.hours && (
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Hours</div>
            <div className="text-sm text-gray-800">{place.hours}</div>
          </div>
        )}
        {place.eligibility && (
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Eligibility</div>
            <div className="text-sm text-gray-800">{place.eligibility}</div>
          </div>
        )}
        {place.products && (
          <div className="bg-gray-50 rounded-xl p-3 sm:col-span-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Products</div>
            <div className="text-sm text-gray-800">{place.products}</div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {place.phone && (
          <a href={`tel:${place.phone}`} className="inline-flex items-center gap-2 bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-amber-700">
            📞 {place.phone}
          </a>
        )}
        {place.email && (
          <a href={`mailto:${place.email}`} className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-200">
            ✉️ Email
          </a>
        )}
        {place.website && (
          <a href={place.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-200">
            🌐 Website
          </a>
        )}
        <a href={dirUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-200">
          🗺️ Directions
        </a>
      </div>

      {place.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {place.tags.map((t) => (
            <span key={t} className="bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function CountyStatCard({ stat }: { stat: CountyStat }) {
  const shortfall = stat.annualFoodBudgetShortfall
    ? `$${(stat.annualFoodBudgetShortfall / 1_000_000).toFixed(1)}M`
    : "N/A";

  return (
    <div className="bg-white rounded-xl p-3 border border-amber-100">
      <div className="font-semibold text-sm text-gray-900">{stat.county}</div>
      <div className="text-xs text-gray-500 mb-2">{stat.year} data</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-amber-700 font-bold text-lg">{stat.foodInsecurityRate}%</div>
          <div className="text-gray-500">Food insecurity</div>
        </div>
        <div>
          <div className="text-amber-700 font-bold text-lg">{stat.foodInsecurePopulation.toLocaleString()}</div>
          <div className="text-gray-500">People affected</div>
        </div>
        <div>
          <div className="text-gray-700 font-semibold">${stat.averageMealCost?.toFixed(2) ?? "N/A"}</div>
          <div className="text-gray-500">Avg meal cost</div>
        </div>
        <div>
          <div className="text-gray-700 font-semibold">{shortfall}</div>
          <div className="text-gray-500">Budget shortfall</div>
        </div>
      </div>
    </div>
  );
}
