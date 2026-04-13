/**
 * FoodInsecurityOverlay — choropleth layer showing county-level food insecurity rates.
 * Renders as a red-shaded fill over Maryland counties with a legend.
 * Uses the most recent year available per county.
 */
import { useEffect, useState } from "react";
import { Source, Layer } from "react-map-gl/maplibre";
import type { CountyStat } from "../types";

interface Props {
  countyStats: CountyStat[];
  visible: boolean;
}

const COUNTIES_URL = `${import.meta.env.BASE_URL}data/md_counties.geojson`;

// Color stops for food insecurity rate (%)
// MD range is roughly 5%–20%
const RATE_STOPS = [5, 8, 11, 14, 17, 20];
const COLORS = ["#fff5f0", "#fca082", "#fb6a4a", "#de2d26", "#a50f15", "#67000d"];

function rateToColor(rate: number): string {
  for (let i = RATE_STOPS.length - 1; i >= 0; i--) {
    if (rate >= RATE_STOPS[i]) return COLORS[i];
  }
  return COLORS[0];
}

export default function FoodInsecurityOverlay({ countyStats, visible }: Props) {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch(COUNTIES_URL)
      .then((r) => r.json())
      .then((raw: GeoJSON.FeatureCollection) => {
        // Get most recent rate per county
        const latestRate: Record<string, number> = {};
        const latestPop: Record<string, number> = {};
        const latestYear: Record<string, string> = {};
        for (const s of countyStats) {
          if (!latestYear[s.county] || s.year > latestYear[s.county]) {
            latestRate[s.county] = s.foodInsecurityRate ?? 0;
            latestPop[s.county] = s.foodInsecurePopulation;
            latestYear[s.county] = s.year;
          }
        }

        // Join rate to each county feature
        const enriched: GeoJSON.FeatureCollection = {
          ...raw,
          features: raw.features.map((f) => {
            const name = f.properties?.county_name as string;
            const rate = latestRate[name] ?? 0;
            const pop = latestPop[name] ?? 0;
            return {
              ...f,
              properties: {
                ...f.properties,
                food_insecurity_rate: rate,
                food_insecure_pop: pop,
                fill_color: rateToColor(rate),
              },
            };
          }),
        };
        setGeojson(enriched);
      })
      .catch(console.error);
  }, [countyStats]);

  if (!geojson || !visible) return null;

  return (
    <Source id="food-insecurity" type="geojson" data={geojson}>
      <Layer
        id="food-insecurity-fill"
        type="fill"
        paint={{
          "fill-color": ["get", "fill_color"],
          "fill-opacity": 0.55,
        }}
      />
      <Layer
        id="food-insecurity-line"
        type="line"
        paint={{
          "line-color": "#7f0000",
          "line-width": 0.8,
          "line-opacity": 0.6,
        }}
      />
    </Source>
  );
}

/** Legend component — render outside the map */
export function InsecurityLegend({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute bottom-8 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 text-xs">
      <div className="font-semibold text-gray-800 mb-2">Food Insecurity Rate</div>
      <div className="space-y-1">
        {RATE_STOPS.map((stop, i) => (
          <div key={stop} className="flex items-center gap-2">
            <div
              className="w-5 h-3 rounded-sm border border-gray-200"
              style={{ background: COLORS[i] }}
            />
            <span className="text-gray-600">
              {i < RATE_STOPS.length - 1
                ? `${stop}–${RATE_STOPS[i + 1]}%`
                : `≥${stop}%`}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-200">
          <div className="w-5 h-3 rounded-sm border border-gray-200" style={{ background: "#fff5f0" }} />
          <span className="text-gray-400">&lt;5% / no data</span>
        </div>
      </div>
      <div className="text-gray-400 mt-2 text-[10px]">Source: Feeding America</div>
    </div>
  );
}
