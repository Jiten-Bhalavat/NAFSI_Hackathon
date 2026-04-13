import { useState, useEffect, useMemo } from "react";
import { distanceMiles, directionsUrl } from "../utils/geo";
import { getOpenStatus } from "../utils/hours";
import type { Place } from "../types";

interface Props {
  places: Place[];
  onClose: () => void;
}

type LocationState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "ready"; lat: number; lng: number }
  | { status: "error"; message: string };

function StatusBadge({ hours }: { hours: string }) {
  const status = getOpenStatus(hours);
  if (status === "open")
    return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">● Open now</span>;
  if (status === "closed")
    return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">● Closed now</span>;
  return <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">? Hours unclear</span>;
}

export default function EmergencyFoodModal({ places, onClose }: Props) {
  const [loc, setLoc] = useState<LocationState>({ status: "idle" });

  useEffect(() => {
    setLoc({ status: "locating" });
    if (!navigator.geolocation) {
      setLoc({ status: "error", message: "Your browser doesn't support location access." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc({ status: "ready", lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const msg =
          err.code === 1
            ? "Location access denied. Please allow location in your browser and try again."
            : "Could not detect your location. Try entering your ZIP code instead.";
        setLoc({ status: "error", message: msg });
      },
      { timeout: 10000 }
    );
  }, []);

  const nearest = useMemo(() => {
    if (loc.status !== "ready") return [];
    const { lat, lng } = loc;

    return places
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({
        ...p,
        distance: distanceMiles(lat, lng, p.lat!, p.lng!),
        openStatus: getOpenStatus(p.hours),
      }))
      .sort((a, b) => {
        // Sort: open first, then unknown, then closed — within each group by distance
        const rank = (s: string) => (s === "open" ? 0 : s === "unknown" ? 1 : 2);
        const dr = rank(a.openStatus) - rank(b.openStatus);
        return dr !== 0 ? dr : a.distance - b.distance;
      })
      .slice(0, 5);
  }, [loc, places]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]">
        {/* Header — never scrolls */}
        <div className="bg-red-600 text-white px-5 py-3.5 flex items-center justify-between rounded-t-2xl shrink-0">
          <div>
            <div className="text-base font-bold">🚨 I Need Food Right Now</div>
            <p className="text-red-100 text-xs mt-0.5">Nearest open food locations near you</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none ml-4 w-8 h-8 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {loc.status === "idle" || loc.status === "locating" ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3 animate-bounce">📍</div>
              <p className="text-gray-600 font-medium">Finding your location…</p>
              <p className="text-xs text-gray-400 mt-1">Please allow location access when prompted.</p>
            </div>
          ) : loc.status === "error" ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-red-600 font-medium">{loc.message}</p>
              <p className="text-sm text-gray-500 mt-3">
                Call <a href="tel:211" className="text-blue-600 font-bold underline">211</a> — free helpline, 24/7.
              </p>
            </div>
          ) : nearest.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">😔</div>
              <p className="text-gray-600 font-medium">No nearby locations found with coordinates.</p>
              <p className="text-sm text-gray-500 mt-2">
                Call <a href="tel:211" className="text-blue-600 font-bold underline">211</a> for immediate help.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* 211 sticky banner */}
              <a
                href="tel:211"
                className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 hover:bg-red-100 transition-colors"
              >
                <span className="text-xl">📞</span>
                <div>
                  <div className="font-bold text-red-700 text-sm">Call 211 — Free Helpline</div>
                  <div className="text-xs text-red-500">Available 24/7 · Food, shelter, and crisis help</div>
                </div>
              </a>

              <p className="text-xs text-gray-400 px-1">Or visit one of these locations near you:</p>

              {nearest.map((p) => (
                <div
                  key={p.id}
                  className="border border-gray-200 rounded-xl p-3 bg-gray-50"
                >
                  {/* Name + distance */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-semibold text-gray-900 text-sm leading-snug">{p.name}</div>
                    <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                      {p.distance.toFixed(1)} mi
                    </span>
                  </div>

                  {/* Address */}
                  <div className="text-xs text-gray-500 mb-1.5">
                    {p.address}, {p.city} {p.zip}
                  </div>

                  {/* Status badge only — no verbose hours string */}
                  <div className="mb-2.5">
                    <StatusBadge hours={p.hours} />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {p.phone && p.phone !== "N/A" && (
                      <a
                        href={`tel:${p.phone.replace(/\D/g, "")}`}
                        className="flex-1 bg-emerald-600 text-white text-xs font-bold text-center py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        📞 {p.phone}
                      </a>
                    )}
                    <a
                      href={directionsUrl(p.address, p.city, p.state, p.zip)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 text-white text-xs font-bold text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      🗺 Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
