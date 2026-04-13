import type { Place, PlaceType } from "../types";
import { directionsUrl } from "../utils/geo";

const MODEL_ICONS: Record<string, string> = {
  "drive-through": "🚗",
  "walk-in": "🚶",
  "home-delivery": "🏠",
  "by-appointment": "📱",
  "mobile-pantry": "🚚",
};

const TYPE_META: Record<PlaceType, { icon: string; label: string; accent: string; bg: string }> = {
  "pantry":         { icon: "🥫", label: "Food Pantry",     accent: "text-emerald-700", bg: "bg-emerald-50" },
  "food-bank":      { icon: "🏦", label: "Food Bank",       accent: "text-blue-700",    bg: "bg-blue-50" },
  "snap-store":     { icon: "🛒", label: "SNAP Store",      accent: "text-violet-700",  bg: "bg-violet-50" },
  "farmers-market": { icon: "🌽", label: "Farmers Market",  accent: "text-amber-700",   bg: "bg-amber-50" },
};

const ACCENT_BAR: Record<PlaceType, string> = {
  "pantry":         "from-emerald-500 to-emerald-300",
  "food-bank":      "from-blue-500 to-blue-300",
  "snap-store":     "from-violet-500 to-violet-300",
  "farmers-market": "from-amber-500 to-amber-300",
};

interface Props {
  place: Place;
  onClose: () => void;
}

export default function PlaceDetail({ place, onClose }: Props) {
  const models = place.distributionModel ?? [];
  const formats = place.foodFormats ?? [];
  const dietary = place.dietaryInfo ?? [];
  const structured = place.hoursStructured ?? null;
  const meta = TYPE_META[place.type] ?? TYPE_META["pantry"];
  const bar = ACCENT_BAR[place.type] ?? ACCENT_BAR["pantry"];

  return (
    <div
      role="region"
      aria-label={`Details for ${place.name}`}
      className="bg-white border border-gray-200 rounded-xl shadow-lg relative overflow-hidden text-sm"
    >
      {/* Accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${bar}`} />

      <div className="p-3 pt-3.5">
        {/* Header row: type badge + name + close */}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${meta.bg} ${meta.accent} mb-1`}>
              {meta.icon} {meta.label}
            </span>
            <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{place.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {place.address && `${place.address}, `}{place.city}, {place.state} {place.zip}
              {place.county && <span className="text-gray-400"> · {place.county}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-xs"
          >
            ✕
          </button>
        </div>

        {/* Compact info grid */}
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {/* Hours */}
          <div className="col-span-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Hours</span>
            {structured ? (
              <div className="text-xs text-gray-700 mt-0.5 space-y-0.5">
                {structured.map((dh) => (
                  <div key={dh.day} className="flex gap-2">
                    <span className="font-medium w-12 shrink-0">{dh.day.slice(0, 3)}</span>
                    <span>{dh.hours}</span>
                    {dh.byAppointment && <span className="text-amber-600 text-[10px]">Appt</span>}
                    {dh.residentsOnly && <span className="text-rose-600 text-[10px]">Res. only</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-700 mt-0.5">{place.hours}</div>
            )}
          </div>

          {place.eligibility && (
            <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Eligibility</span>
              <div className="text-xs text-gray-700 mt-0.5">{place.eligibility}</div>
            </div>
          )}

          {place.requirements && (
            <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Requirements</span>
              <div className="text-xs text-gray-700 mt-0.5">{place.requirements}</div>
            </div>
          )}
        </div>

        {/* SNAP / WIC badges */}
        {(place.acceptsSnap || place.acceptsWic) && (
          <div className="flex gap-1 mb-2">
            {place.acceptsSnap && <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-medium">✓ SNAP</span>}
            {place.acceptsWic && <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-medium">✓ WIC</span>}
          </div>
        )}

        {/* Compact pills row: distribution + formats + dietary */}
        {(models.length > 0 || formats.length > 0 || dietary.length > 0) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {models.map((m) => (
              <span key={m} className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                {MODEL_ICONS[m] ?? "📦"} {m}
              </span>
            ))}
            {formats.map((f) => (
              <span key={f} className="bg-amber-50 text-amber-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">{f}</span>
            ))}
            {dietary.map((d) => (
              <span key={d} className="bg-purple-50 text-purple-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">{d}</span>
            ))}
          </div>
        )}

        {/* Action buttons — compact row */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {place.phone && (
            <a href={`tel:${place.phone}`} className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition-colors">
              📞 {place.phone}
            </a>
          )}
          <a
            href={directionsUrl(place.address, place.city, place.state, place.zip)}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🗺️ Directions
          </a>
          {place.email && (
            <a href={`mailto:${place.email}`} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors">
              ✉️ Email
            </a>
          )}
          {place.website && (
            <a href={place.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors">
              🌐 Website
            </a>
          )}
        </div>

        {/* Tags — compact */}
        {place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {place.tags.slice(0, 5).map((t) => (
              <span key={t} className={`${meta.bg} ${meta.accent} text-[10px] font-medium px-1.5 py-0.5 rounded-full`}>{t}</span>
            ))}
            {place.tags.length > 5 && <span className="text-[10px] text-gray-400">+{place.tags.length - 5} more</span>}
          </div>
        )}
      </div>
    </div>
  );
}
