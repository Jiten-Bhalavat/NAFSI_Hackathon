import type { Place } from "../types";
import { directionsUrl } from "../utils/geo";

interface Props {
  place: Place;
  onClose: () => void;
}

export default function PlaceDetail({ place, onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-label={`Details for ${place.name}`}
      className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 mb-4 relative overflow-hidden"
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-300" />

      <div className="flex justify-between items-start mb-3 pt-1">
        <h3 className="text-lg font-bold text-gray-900">{place.name}</h3>
        <button
          onClick={onClose}
          aria-label="Close details"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-1">
        {place.address}, {place.city}, {place.state} {place.zip}
      </p>
      {place.county && (
        <span className="inline-block text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md mb-3">
          {place.county} County
        </span>
      )}

      <div className="grid sm:grid-cols-2 gap-3 my-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Hours</div>
          <div className="text-sm text-gray-800">{place.hours}</div>
        </div>
        {place.eligibility && (
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Eligibility</div>
            <div className="text-sm text-gray-800">{place.eligibility}</div>
          </div>
        )}
        {place.requirements && (
          <div className="bg-gray-50 rounded-xl p-3 sm:col-span-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Requirements</div>
            <div className="text-sm text-gray-800">{place.requirements}</div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <a
          href={`tel:${place.phone}`}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
        >
          📞 Call {place.phone}
        </a>
        <a
          href={directionsUrl(place.address, place.city, place.state, place.zip)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors"
        >
          🗺️ Get Directions
        </a>
      </div>

      {place.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {place.tags.map((t) => (
            <span key={t} className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
