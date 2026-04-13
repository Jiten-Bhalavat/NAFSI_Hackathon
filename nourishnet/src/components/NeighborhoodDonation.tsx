import { useState } from "react";
import type { CountyStat } from "../types";

interface Props {
  countyStats: CountyStat[];
  highlightedCounty?: string | null;
  onSelectCounty: (county: string | null) => void;
}

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

const INITIAL_VISIBLE = 8;

export default function NeighborhoodDonation({ countyStats, highlightedCounty, onSelectCounty }: Props) {
  const [showAll, setShowAll] = useState(false);

  const latest = latestPerCounty(countyStats)
    .filter((s) => s.foodInsecurityRate != null)
    .sort((a, b) => (b.foodInsecurityRate ?? 0) - (a.foodInsecurityRate ?? 0));

  const visible = showAll ? latest : latest.slice(0, INITIAL_VISIBLE);
  const maxPop = Math.max(...latest.map((s) => s.foodInsecurePopulation));

  const highlighted = highlightedCounty
    ? latest.find((s) => s.county === highlightedCounty)
    : null;

  return (
    <div className="mt-6 mb-8">
      {/* Header with clear purpose */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            📍 Where Your Donation Matters Most
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 max-w-lg">
            These Maryland counties have the highest food insecurity rates. Selecting a county shows how many people need help and what your donation can provide — so you can direct your support where it's needed most.
          </p>
        </div>
        {highlightedCounty && (
          <button
            onClick={() => onSelectCounty(null)}
            className="text-xs text-gray-500 hover:text-gray-700 underline shrink-0 mt-1"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Highlighted county detail panel */}
      {highlighted && (
        <div className={`rounded-2xl border p-5 my-4 ${urgencyColor(highlighted.foodInsecurityRate!).bg} ${urgencyColor(highlighted.foodInsecurityRate!).border}`}>
          <div className="mb-3">
            <h4 className="font-bold text-gray-900 text-lg">{highlighted.county}</h4>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urgencyColor(highlighted.foodInsecurityRate!).badge}`}>
              {highlighted.foodInsecurityRate}% food insecure ({highlighted.year})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <div className="bg-white/70 rounded-xl p-3 text-center">
              <div className="font-bold text-red-600 text-xl">{highlighted.foodInsecurePopulation.toLocaleString()}</div>
              <div className="text-xs text-gray-500">people affected</div>
            </div>
            {highlighted.annualFoodBudgetShortfall && (
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <div className="font-bold text-amber-600 text-xl">${(highlighted.annualFoodBudgetShortfall / 1_000_000).toFixed(1)}M</div>
                <div className="text-xs text-gray-500">funding gap / year</div>
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

      {/* County grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
        {visible.map((stat) => {
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

      {/* See more / See less toggle */}
      {latest.length > INITIAL_VISIBLE && (
        <div className="text-center mt-3">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
          >
            {showAll ? `Show less` : `See all ${latest.length} counties`}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2 text-center">
        Data: Feeding America {latest[0]?.year} · Bar = relative population affected · Click any county for details
      </p>
    </div>
  );
}
