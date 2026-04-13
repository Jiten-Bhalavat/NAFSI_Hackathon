import type { CountyStat } from "../types";

interface Props {
  countyStats: CountyStat[];
  highlightedCounty?: string | null; // county selected by clicking heatmap bubble
  onSelectCounty: (county: string | null) => void;
}

// Most recent stat per county
function latestPerCounty(stats: CountyStat[]): CountyStat[] {
  const map = new Map<string, CountyStat>();
  for (const s of stats) {
    const existing = map.get(s.county);
    if (!existing || s.year > existing.year) map.set(s.county, s);
  }
  return Array.from(map.values());
}

function urgencyColor(rate: number) {
  if (rate >= 18) return { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", bar: "bg-red-400" };
  if (rate >= 15) return { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-700", bar: "bg-orange-400" };
  if (rate >= 12) return { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700", bar: "bg-yellow-400" };
  return { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700", bar: "bg-green-400" };
}

const FEEDING_AMERICA_BASE = "https://map.feedingamerica.org/county/2023/overall/maryland/county/";

function countySlug(county: string) {
  return county.toLowerCase().replace(/['\s]+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function NeighborhoodDonation({ countyStats, highlightedCounty, onSelectCounty }: Props) {
  const latest = latestPerCounty(countyStats)
    .filter((s) => s.foodInsecurityRate != null)
    .sort((a, b) => (b.foodInsecurityRate ?? 0) - (a.foodInsecurityRate ?? 0));

  const top8 = latest.slice(0, 8);
  const maxPop = Math.max(...latest.map((s) => s.foodInsecurePopulation));

  const highlighted = highlightedCounty
    ? latest.find((s) => s.county === highlightedCounty)
    : null;

  return (
    <div className="mt-6 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            📍 Donate to a Specific Neighborhood
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {highlightedCounty
              ? `Showing ${highlightedCounty} — click another bubble or clear to see all`
              : "Click a bubble on the map, or choose a county below to see exactly where your support goes."}
          </p>
        </div>
        {highlightedCounty && (
          <button
            onClick={() => onSelectCounty(null)}
            className="text-xs text-gray-500 hover:text-gray-700 underline shrink-0"
          >
            ✕ Clear selection
          </button>
        )}
      </div>

      {/* Highlighted county detail panel */}
      {highlighted && (
        <div className={`rounded-2xl border p-5 mb-4 ${urgencyColor(highlighted.foodInsecurityRate!).bg} ${urgencyColor(highlighted.foodInsecurityRate!).border}`}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h4 className="font-bold text-gray-900 text-lg">{highlighted.county}</h4>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urgencyColor(highlighted.foodInsecurityRate!).badge}`}>
                {highlighted.foodInsecurityRate}% food insecure ({highlighted.year})
              </span>
            </div>
            <a
              href={`${FEEDING_AMERICA_BASE}${countySlug(highlighted.county)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              💛 Give Here
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <div className="bg-white/70 rounded-xl p-3 text-center">
              <div className="font-bold text-red-600 text-xl">{highlighted.foodInsecurePopulation.toLocaleString()}</div>
              <div className="text-xs text-gray-500">people affected</div>
            </div>
            {highlighted.annualFoodBudgetShortfall && (
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <div className="font-bold text-amber-600 text-xl">${(highlighted.annualFoodBudgetShortfall / 1_000_000).toFixed(1)}M</div>
                <div className="text-xs text-gray-500">funding gap/year</div>
              </div>
            )}
            {highlighted.averageMealCost && (
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <div className="font-bold text-emerald-600 text-xl">${highlighted.averageMealCost.toFixed(2)}</div>
                <div className="text-xs text-gray-500">per meal</div>
              </div>
            )}
          </div>

          {highlighted.averageMealCost && (
            <div className="bg-white/70 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Your donation impact in {highlighted.county}:</p>
              <div className="space-y-1.5">
                {[25, 50, 100].map((amt) => {
                  const meals = Math.round(amt / highlighted.averageMealCost!);
                  return (
                    <div key={amt} className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-amber-700 w-8">${amt}</span>
                      <span className="text-gray-600">→ {meals} meals for families in {highlighted.county}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top counties grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {top8.map((stat) => {
          const colors = urgencyColor(stat.foodInsecurityRate!);
          const isSelected = highlightedCounty === stat.county;
          const popPct = stat.foodInsecurePopulation / maxPop;

          return (
            <button
              key={stat.county}
              onClick={() => onSelectCounty(isSelected ? null : stat.county)}
              className={`relative text-left rounded-xl border-2 p-3 transition-all hover:shadow-md ${
                isSelected
                  ? `${colors.bg} ${colors.border} ring-2 ring-amber-400 shadow-md`
                  : `bg-white border-gray-200 hover:${colors.border}`
              }`}
            >
              {/* Population bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl bg-gray-100 overflow-hidden">
                <div
                  className={`h-full ${colors.bar} transition-all`}
                  style={{ width: `${popPct * 100}%` }}
                />
              </div>

              <div className="font-semibold text-xs text-gray-900 leading-tight mb-1">{stat.county}</div>
              <div className={`text-lg font-bold ${isSelected ? "" : "text-gray-800"}`}>
                {stat.foodInsecurityRate}%
              </div>
              <div className="text-xs text-gray-500">{(stat.foodInsecurePopulation / 1000).toFixed(0)}k affected</div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">
        Data: Feeding America {latest[0]?.year} · Bar = relative population affected · Click any county to see donation details
      </p>
    </div>
  );
}
