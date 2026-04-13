import { useState, useMemo } from "react";
import { useCatalog } from "../hooks/useCatalog";
import { useGeolocation } from "../hooks/useGeolocation";
import { useGeocode } from "../hooks/useGeocode";
import { distanceMiles } from "../utils/geo";
import { pointInGeoJSON } from "../utils/pointInPolygon";
import NourishMap, { type MapPoint } from "../components/NourishMap";
import VolunteerForm from "../components/VolunteerForm";
import type { Place, Opportunity } from "../types";

export default function Planner() {
  const { catalog, error } = useCatalog();
  const geo = useGeolocation();
  const [search, setSearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState<"" | "weekday" | "weekend">("");
  const [selectedOpp, setSelectedOpp] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formOpp, setFormOpp] = useState<(Opportunity & { place?: Place }) | null>(null);

  const geocode = useGeocode(search);

  const placeMap = useMemo(() => {
    if (!catalog) return new Map<string, Place>();
    return new Map(catalog.places.map((p) => [p.id, p]));
  }, [catalog]);

  const userCoords: [number, number] | null = useMemo(() => {
    if (geo.lat && geo.lng) return [geo.lat, geo.lng];
    if (geocode.result) return [geocode.result.lat, geocode.result.lng];
    return null;
  }, [geo.lat, geo.lng, geocode.result]);

  const counties = useMemo(() => {
    if (!catalog) return [];
    const set = new Set<string>();
    catalog.opportunities
      .filter((o) => o.type === "volunteering")
      .forEach((o) => {
        const p = placeMap.get(o.placeId);
        if (p?.county) set.add(p.county);
      });
    return Array.from(set).sort();
  }, [catalog, placeMap]);

  const weekdayWords = ["mon", "tue", "wed", "thu", "fri", "weekday"];
  const weekendWords = ["sat", "sun", "weekend"];

  const volunteering = useMemo(() => {
    if (!catalog) return [] as (Opportunity & { place: Place | undefined; dist: number | null })[];
    let opps = catalog.opportunities.filter((o) => o.type === "volunteering");

    if (geocode.result?.boundary) {
      opps = opps.filter((o) => {
        const p = placeMap.get(o.placeId);
        if (!p || p.lat == null || p.lng == null) return true;
        return pointInGeoJSON(p.lat, p.lng, geocode.result!.boundary);
      });
    }

    if (countyFilter) {
      opps = opps.filter((o) => placeMap.get(o.placeId)?.county === countyFilter);
    }

    if (scheduleFilter === "weekday") {
      opps = opps.filter((o) => weekdayWords.some((w) => o.schedule.toLowerCase().includes(w)));
    } else if (scheduleFilter === "weekend") {
      opps = opps.filter((o) => weekendWords.some((w) => o.schedule.toLowerCase().includes(w)));
    }

    const enriched = opps.map((o) => {
      const place = placeMap.get(o.placeId);
      const dist =
        userCoords && place?.lat != null && place?.lng != null
          ? distanceMiles(userCoords[0], userCoords[1], place.lat, place.lng)
          : null;
      return { ...o, place, dist };
    });

    if (userCoords) enriched.sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
    return enriched;
  }, [catalog, geocode.result, countyFilter, scheduleFilter, placeMap, userCoords]);

  const mappablePlaces = useMemo(() => {
    const ids = new Set(volunteering.map((o) => o.placeId));
    return Array.from(ids)
      .map((id) => placeMap.get(id))
      .filter((p): p is Place & { lat: number; lng: number } => p != null && p.lat != null && p.lng != null);
  }, [volunteering, placeMap]);

  const selected = volunteering.find((o) => o.id === selectedOpp) ?? null;

  const mapPoints = useMemo<MapPoint[]>(() =>
    mappablePlaces.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, label: p.name, sublabel: `${p.address}, ${p.city}` })),
    [mappablePlaces]
  );

  const openForm = (opp?: (Opportunity & { place?: Place }) | null) => {
    setFormOpp(opp ?? null);
    setShowForm(true);
  };

  if (error) return <p className="p-8 text-red-600">Failed to load data: {error}</p>;
  if (!catalog) return <p className="p-8 text-gray-500 animate-subtle-pulse">Loading…</p>;

  return (
    <div>
      {/* Page header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Volunteer Opportunities</h1>
            <p className="text-blue-100 max-w-xl">
              Find ways to help — sorting food, tending gardens, assisting clients, and more.
            </p>
          </div>
          <button
            onClick={() => openForm()}
            className="self-start bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-transform"
          >
            ✋ Submit Interest
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-5">
        {/* Search & filters */}
        <div className="filter-bar rounded-2xl shadow-lg p-4 mb-6 border border-gray-200/50">
          <div className="flex flex-wrap gap-3">
            <div className="w-full sm:flex-1 sm:min-w-[220px] relative">
              <label htmlFor="planner-search" className="sr-only">Search by city, ZIP, county, or address</label>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                id="planner-search"
                type="text"
                autoComplete="off"
                placeholder="City, ZIP, county, or address…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
              />
            </div>
            <select
              id="planner-county"
              aria-label="Filter by county"
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="flex-1 min-w-0 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white"
            >
              <option value="">All counties</option>
              {counties.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-1 items-center flex-wrap">
              {(["", "weekday", "weekend"] as const).map((val) => {
                const labels: Record<string, string> = { "": "Any", weekday: "Weekdays", weekend: "Weekends" };
                return (
                  <button
                    key={val}
                    onClick={() => setScheduleFilter(val)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      scheduleFilter === val
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {labels[val]}
                  </button>
                );
              })}
            </div>
            <button
              onClick={geo.requestLocation}
              disabled={geo.loading}
              className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm"
            >
              {geo.loading ? "Locating…" : "📍 My Location"}
            </button>
          </div>

          <div className="mt-3 min-h-[20px]">
            {geocode.loading && <p className="text-xs text-gray-400 animate-subtle-pulse">Searching…</p>}
            {geocode.error && <p className="text-xs text-red-500">{geocode.error}</p>}
            {geocode.result && (
              <p className="text-xs text-blue-600">
                📍 Showing results near <span className="font-semibold">{geocode.result.displayName}</span>
                {geocode.result.boundary && " — region boundary on map"}
              </p>
            )}
            {geo.error && <p className="text-xs text-red-500">{geo.error}</p>}
            {!geocode.loading && !geocode.result && !geocode.error && (
              <p className="text-xs text-gray-400">Location is used only to sort by distance. Nothing is stored or shared.</p>
            )}
          </div>
        </div>

        {/* Selected detail */}
        {selected && selected.place && (
          <div role="dialog" aria-label={`Details for ${selected.title}`} className="bg-white border border-blue-200 rounded-2xl shadow-xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-blue-300" />
            <div className="flex justify-between items-start mb-3 pt-1">
              <h3 className="text-lg font-bold text-gray-900">{selected.title}</h3>
              <button onClick={() => setSelectedOpp(null)} aria-label="Close details" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">✕</button>
            </div>
            <p className="text-sm text-gray-700 mb-3">{selected.summary}</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Location</div>
                <div className="text-sm text-gray-800">{selected.place.name} — {selected.place.address}, {selected.place.city}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Schedule</div>
                <div className="text-sm text-gray-800">{selected.schedule}</div>
              </div>
            </div>
            {selected.dist != null && (
              <p className="text-sm text-blue-600 font-medium mb-3">{selected.dist.toFixed(1)} miles away</p>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {selected.contactPhone && (
                <a href={`tel:${selected.contactPhone}`} className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700">
                  📞 {selected.contactPhone}
                </a>
              )}
              {selected.contactEmail && (
                <a href={`mailto:${selected.contactEmail}`} className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-200">
                  ✉️ Email
                </a>
              )}
              <button
                onClick={() => openForm({ ...selected, place: selected.place })}
                className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-100"
              >
                ✋ I'm Interested
              </button>
            </div>
            {selected.needsTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.needsTags.map((t) => (
                  <span key={t} className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-5 mb-8">
          {/* List */}
          <div className="order-2 lg:order-none lg:col-span-2 max-h-[60vh] lg:max-h-[500px] overflow-y-auto space-y-3 styled-scrollbar pr-1" role="list" aria-label="Volunteer opportunities">
            <div className="text-xs text-gray-500 font-medium px-1 mb-1">
              {volunteering.length} opportunit{volunteering.length !== 1 ? "ies" : "y"} found
            </div>
            {volunteering.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🙋</div>
                <p className="text-sm text-gray-500">No volunteer opportunities match your filters.</p>
                <p className="text-xs text-gray-400 mt-1">Try a different area or schedule.</p>
              </div>
            )}
            {volunteering.map((opp) => (
              <div key={opp.id} role="listitem" className="flex gap-2">
                <button
                  onClick={() => setSelectedOpp(opp.id)}
                  aria-pressed={selectedOpp === opp.id}
                  className={`flex-1 text-left p-5 rounded-xl border-2 transition-all group ${
                    selectedOpp === opp.id
                      ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                      : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-700">{opp.title}</div>
                    {opp.dist != null && (
                      <span className="shrink-0 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-lg">
                        {opp.dist.toFixed(1)} mi
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{opp.summary}</p>
                  {opp.place && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <span className="text-gray-400">📍</span> {opp.place.name}, {opp.place.city}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span className="text-gray-400">🕐</span> {opp.schedule}
                  </p>
                </button>
                <button
                  onClick={() => openForm({ ...opp, place: opp.place })}
                  title="Submit interest for this opportunity"
                  className="self-center shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  ✋
                </button>
              </div>
            ))}
          </div>

          {/* Map */}
          <div className="order-1 lg:order-none lg:col-span-3 h-[45vh] sm:h-[50vh] lg:h-[500px] rounded-2xl overflow-hidden map-wrapper border border-gray-200">
            <NourishMap
              points={mapPoints}
              variant="planner"
              selectedId={selected?.place?.id ?? null}
              onSelect={() => {}}
              geocode={geocode.result}
              initialZoom={9}
            />
          </div>
        </div>
      </div>

      {/* Volunteer interest form modal */}
      {showForm && (
        <VolunteerForm
          opportunity={formOpp}
          onClose={() => { setShowForm(false); setFormOpp(null); }}
        />
      )}
    </div>
  );
}
