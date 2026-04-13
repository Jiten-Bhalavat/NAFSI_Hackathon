import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useCatalog } from "../hooks/useCatalog";
import { consumerIcon } from "../utils/leafletIcons";
import type { Place } from "../types";

const MD_CENTER: [number, number] = [38.95, -77.05];

export default function Donor() {
  const { catalog, error } = useCatalog();
  const [typeFilter, setTypeFilter] = useState<"" | "monetary" | "food" | "produce">("");
  const [selectedOpp, setSelectedOpp] = useState<string | null>(null);

  const donations = useMemo(() => {
    if (!catalog) return [];
    let opps = catalog.opportunities.filter((o) => o.type === "donation");
    if (typeFilter) {
      opps = opps.filter((o) => o.needsTags.some((t) => t.toLowerCase().includes(typeFilter)));
    }
    return opps;
  }, [catalog, typeFilter]);

  const placeMap = useMemo(() => {
    if (!catalog) return new Map<string, Place>();
    return new Map(catalog.places.map((p) => [p.id, p]));
  }, [catalog]);

  const mappablePlaces = useMemo(() => {
    const ids = new Set(donations.map((o) => o.placeId));
    return Array.from(ids)
      .map((id) => placeMap.get(id))
      .filter((p): p is Place & { lat: number; lng: number } => p != null && p.lat != null && p.lng != null);
  }, [donations, placeMap]);

  const selected = donations.find((o) => o.id === selectedOpp) ?? null;
  const selectedPlace = selected ? placeMap.get(selected.placeId) : null;

  if (error) return <p className="p-8 text-red-600">Failed to load data: {error}</p>;
  if (!catalog) return <p className="p-8 text-gray-500 animate-subtle-pulse">Loading…</p>;

  return (
    <div>
      {/* Page header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Donate Food or Funds</h1>
          <p className="text-amber-100 max-w-xl">
            See what organizations need and how you can help. Every contribution makes a difference.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-5">
        {/* Filter bar */}
        <div className="filter-bar rounded-2xl shadow-lg p-4 mb-6 border border-gray-200/50">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-gray-600">Filter by type:</span>
            {(["", "monetary", "food", "produce"] as const).map((val) => {
              const labels: Record<string, string> = { "": "All", monetary: "💰 Monetary", food: "🥫 Food", produce: "🥬 Produce" };
              return (
                <button
                  key={val}
                  onClick={() => setTypeFilter(val)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    typeFilter === val
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-amber-300"
                  }`}
                >
                  {labels[val]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected opportunity detail */}
        {selected && selectedPlace && (
          <div role="dialog" aria-label={`Details for ${selected.title}`} className="bg-white border border-amber-200 rounded-2xl shadow-xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300" />
            <div className="flex justify-between items-start mb-3 pt-1">
              <h3 className="text-lg font-bold text-gray-900">{selected.title}</h3>
              <button onClick={() => setSelectedOpp(null)} aria-label="Close details" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">✕</button>
            </div>
            <p className="text-sm text-gray-700 mb-3">{selected.summary}</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Location</div>
                <div className="text-sm text-gray-800">{selectedPlace.name} — {selectedPlace.address}, {selectedPlace.city}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Schedule</div>
                <div className="text-sm text-gray-800">{selected.schedule}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {selected.contactPhone && (
                <a href={`tel:${selected.contactPhone}`} className="inline-flex items-center gap-2 bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-amber-700">
                  📞 {selected.contactPhone}
                </a>
              )}
              {selected.contactEmail && (
                <a href={`mailto:${selected.contactEmail}`} className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-200">
                  ✉️ Email
                </a>
              )}
            </div>
            {selected.needsTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.needsTags.map((t) => (
                  <span key={t} className="bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-5 mb-8">
          {/* Opportunities list */}
          <div className="lg:col-span-3 max-h-[500px] overflow-y-auto space-y-3 styled-scrollbar pr-1" role="list" aria-label="Donation opportunities">
            <div className="text-xs text-gray-500 font-medium px-1 mb-1">
              {donations.length} opportunit{donations.length !== 1 ? "ies" : "y"} found
            </div>
            {donations.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🤲</div>
                <p className="text-sm text-gray-500">No donation opportunities match your filter.</p>
              </div>
            )}
            {donations.map((opp) => {
              const place = placeMap.get(opp.placeId);
              return (
                <button
                  key={opp.id}
                  role="listitem"
                  onClick={() => setSelectedOpp(opp.id)}
                  aria-pressed={selectedOpp === opp.id}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all group ${
                    selectedOpp === opp.id
                      ? "border-amber-500 bg-amber-50 shadow-md shadow-amber-100"
                      : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-amber-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-gray-900 group-hover:text-amber-700">{opp.title}</div>
                    <span className="shrink-0 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded-lg">
                      Donation
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{opp.summary}</p>
                  {place && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <span className="text-gray-400">📍</span> {place.name}, {place.city}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span className="text-gray-400">🕐</span> {opp.schedule}
                  </p>
                  {opp.needsTags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {opp.needsTags.map((t) => (
                        <span key={t} className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full border border-amber-200">{t}</span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Map */}
          <div className="lg:col-span-2 h-[400px] rounded-2xl overflow-hidden map-wrapper border border-gray-200">
            <MapContainer center={MD_CENTER} zoom={9} className="h-full w-full" scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mappablePlaces.map((p) => (
                <Marker key={p.id} position={[p.lat, p.lng]} icon={consumerIcon}>
                  <Popup><strong>{p.name}</strong><br />{p.address}, {p.city}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
