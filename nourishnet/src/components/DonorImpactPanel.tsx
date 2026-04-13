import type { CountyStat } from "../types";

interface Props {
  countyStats: CountyStat[];
  selectedCounty?: string; // undefined = show Maryland totals
}

function latestPerCounty(stats: CountyStat[]): CountyStat[] {
  const map = new Map<string, CountyStat>();
  for (const s of stats) {
    const existing = map.get(s.county);
    if (!existing || s.year > existing.year) map.set(s.county, s);
  }
  return Array.from(map.values());
}

export default function DonorImpactPanel({ countyStats, selectedCounty }: Props) {
  const subset = selectedCounty
    ? countyStats.filter((s) => s.county === selectedCounty)
    : countyStats;

  const latest = latestPerCounty(subset);
  if (latest.length === 0) return null;

  const totalInsecure = latest.reduce((sum, s) => sum + s.foodInsecurePopulation, 0);
  const totalShortfall = latest.reduce((sum, s) => sum + (s.annualFoodBudgetShortfall ?? 0), 0);
  const mealCostStats = latest.filter((s) => s.averageMealCost);
  const avgMealCost =
    mealCostStats.length > 0
      ? mealCostStats.reduce((sum, s) => sum + s.averageMealCost!, 0) / mealCostStats.length
      : 3.0;

  const scope = selectedCounty ?? "Maryland";

  const DONATION_TIERS = [
    { amount: 10 },
    { amount: 25 },
    { amount: 50 },
    { amount: 100 },
  ];

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6">
      <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-0.5">
        💛 Your Impact in {scope}
      </h3>
      <p className="text-xs text-amber-600 mb-4">Based on Feeding America data · {latest[0].year}</p>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 text-center border border-amber-100 shadow-sm">
          <div className="text-xl font-bold text-red-600">
            {totalInsecure >= 1_000_000
              ? `${(totalInsecure / 1_000_000).toFixed(1)}M`
              : totalInsecure.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 leading-tight">people food insecure</div>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-amber-100 shadow-sm">
          <div className="text-xl font-bold text-amber-600">
            ${(totalShortfall / 1_000_000).toFixed(totalShortfall < 10_000_000 ? 1 : 0)}M
          </div>
          <div className="text-xs text-gray-500 mt-0.5 leading-tight">annual funding gap</div>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-amber-100 shadow-sm">
          <div className="text-xl font-bold text-emerald-600">${avgMealCost.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-0.5 leading-tight">avg cost per meal</div>
        </div>
      </div>

      {/* Impact ladder */}
      <div className="bg-white rounded-xl border border-amber-100 p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          What your donation provides
        </p>
        <div className="space-y-2.5">
          {DONATION_TIERS.map(({ amount }) => {
            const meals = Math.round(amount / avgMealCost);
            const families = Math.round(meals / 21); // ~21 meals/week/family
            const label =
              amount >= 50 && families > 0
                ? `≈ ${families} ${families === 1 ? "family" : "families"} fed for a week`
                : `${meals} meals`;

            return (
              <div key={amount} className="flex items-center gap-3">
                <span className="text-sm font-bold text-amber-800 w-10 shrink-0">${amount}</span>
                <div className="flex-1 bg-amber-50 rounded-lg h-7 relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-amber-400 rounded-lg transition-all"
                    style={{ width: `${(amount / 100) * 100}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2.5 text-xs font-semibold text-amber-900">
                    {amount < 50 ? `${meals} meals` : label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Meal cost estimate from Feeding America. Actual impact may vary by organization.
        </p>
      </div>
    </div>
  );
}
