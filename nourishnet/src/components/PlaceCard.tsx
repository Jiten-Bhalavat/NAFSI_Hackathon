import type { Place, PlaceType } from "../types";

const MODEL_ICONS: Record<string, string> = {
  "drive-through": "🚗",
  "walk-in": "🚶",
  "home-delivery": "🏠",
  "by-appointment": "📱",
  "mobile-pantry": "🚚",
};

const FORMAT_COLORS: Record<string, string> = {
  "pre-bagged": "bg-violet-100 text-violet-700",
  "groceries": "bg-emerald-100 text-emerald-700",
  "hot-meals": "bg-red-100 text-red-700",
  "produce": "bg-lime-100 text-lime-700",
  "prepared-meals": "bg-orange-100 text-orange-700",
  "shelf-stable": "bg-sky-100 text-sky-700",
};

// Per-type card accent colours (border, bg, badge, icon)
const TYPE_THEME: Record<PlaceType, {
  icon: string;
  label: string;
  badge: string;        // pill bg+text
  selectedBorder: string;
  selectedBg: string;
  hoverBorder: string;
  distanceBadge: string;
}> = {
  "pantry": {
    icon: "🥫",
    label: "Food Pantry",
    badge: "bg-emerald-100 text-emerald-700",
    selectedBorder: "border-emerald-500",
    selectedBg: "bg-emerald-50",
    hoverBorder: "hover:border-emerald-200",
    distanceBadge: "bg-emerald-100 text-emerald-700",
  },
  "food-bank": {
    icon: "🏦",
    label: "Food Bank",
    badge: "bg-blue-100 text-blue-700",
    selectedBorder: "border-blue-500",
    selectedBg: "bg-blue-50",
    hoverBorder: "hover:border-blue-200",
    distanceBadge: "bg-blue-100 text-blue-700",
  },
  "snap-store": {
    icon: "🛒",
    label: "SNAP Store",
    badge: "bg-violet-100 text-violet-700",
    selectedBorder: "border-violet-500",
    selectedBg: "bg-violet-50",
    hoverBorder: "hover:border-violet-200",
    distanceBadge: "bg-violet-100 text-violet-700",
  },
  "farmers-market": {
    icon: "🌽",
    label: "Farmers Market",
    badge: "bg-amber-100 text-amber-700",
    selectedBorder: "border-amber-500",
    selectedBg: "bg-amber-50",
    hoverBorder: "hover:border-amber-200",
    distanceBadge: "bg-amber-100 text-amber-700",
  },
};

interface Props {
  place: Place;
  selected: boolean;
  onSelect: (id: string) => void;
  distance?: number | null;
}

export default function PlaceCard({ place, selected, onSelect, distance }: Props) {
  const models = place.distributionModel ?? [];
  const formats = place.foodFormats ?? [];
  const theme = TYPE_THEME[place.type] ?? TYPE_THEME["pantry"];

  return (
    <button
      onClick={() => onSelect(place.id)}
      aria-pressed={selected}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all group ${
        selected
          ? `${theme.selectedBorder} ${theme.selectedBg} shadow-md`
          : `border-transparent bg-white shadow-sm hover:shadow-md ${theme.hoverBorder}`
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Type badge */}
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md mb-1 ${theme.badge}`}>
            {theme.icon} {theme.label}
          </span>
          <div className="font-semibold text-sm text-gray-900 group-hover:text-gray-700 transition-colors truncate">
            {place.name}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {place.city}, {place.state} {place.zip}
            {place.county && <span className="text-gray-400"> · {place.county} Co.</span>}
          </div>
        </div>
        {distance != null && (
          <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-lg ${theme.distanceBadge}`}>
            {distance.toFixed(1)} mi
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
        <span className="text-gray-400">🕐</span>
        {place.hours}
      </div>

      {/* SNAP / WIC badges */}
      {(place.acceptsSnap || place.acceptsWic) && (
        <div className="flex gap-1 mt-1.5">
          {place.acceptsSnap && (
            <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-medium">SNAP</span>
          )}
          {place.acceptsWic && (
            <span className="text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-medium">WIC</span>
          )}
        </div>
      )}

      {/* Distribution model badges */}
      {models.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mt-2">
          {models.slice(0, 3).map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded-md"
              title={m}
            >
              {MODEL_ICONS[m] ?? "📦"} {m}
            </span>
          ))}
          {models.length > 3 && (
            <span className="text-xs text-gray-400">+{models.length - 3} more</span>
          )}
        </div>
      )}

      {/* Food format pills */}
      {formats.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mt-1.5">
          {formats.slice(0, 3).map((f) => (
            <span
              key={f}
              className={`text-xs px-1.5 py-0.5 rounded-full ${FORMAT_COLORS[f] ?? "bg-gray-100 text-gray-600"}`}
            >
              {f}
            </span>
          ))}
          {formats.length > 3 && (
            <span className="text-xs text-gray-400">+{formats.length - 3} more</span>
          )}
        </div>
      )}

      {!place.lat && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
          📍 Address only — no map pin
        </div>
      )}
    </button>
  );
}
