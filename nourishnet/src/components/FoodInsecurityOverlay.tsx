/**
 * FoodInsecurityOverlay — choropleth layer showing county-level food insecurity burden.
 * Renders as a shaded fill over Maryland counties with a legend.
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

// Color stops for food-insecure population (people)
// Buckets are intentionally coarse to stay readable on a small legend.
export const FOOD_INSECURE_POP_STOPS = [0, 5_000, 10_000, 20_000, 40_000, 80_000];
export const FOOD_INSECURE_COLORS = ["#fdd0a2", "#fca082", "#fb6a4a", "#de2d26", "#a50f15", "#67000d"];

function normalizeCountyKey(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/\s+county\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function popToColor(pop: number): string {
  for (let i = FOOD_INSECURE_POP_STOPS.length - 1; i >= 0; i--) {
    if (pop >= FOOD_INSECURE_POP_STOPS[i]) return FOOD_INSECURE_COLORS[i];
  }
  return FOOD_INSECURE_COLORS[0];
}

export default function FoodInsecurityOverlay({ countyStats, visible }: Props) {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch(COUNTIES_URL)
      .then((r) => r.json())
      .then((raw: GeoJSON.FeatureCollection) => {
        // Get most recent stats per county (normalized keys)
        const latestRate: Record<string, number> = {};
        const latestPop: Record<string, number> = {};
        const latestYear: Record<string, string> = {};
        for (const s of countyStats) {
          const key = normalizeCountyKey(s.county);
          if (!key) continue;
          if (!latestYear[key] || s.year > latestYear[key]) {
            latestRate[key] = s.foodInsecurityRate ?? 0;
            latestPop[key] = s.foodInsecurePopulation ?? 0;
            latestYear[key] = s.year;
          }
        }

        // Join stats to each county feature
        const enriched: GeoJSON.FeatureCollection = {
          ...raw,
          features: raw.features.map((f) => {
            const name = f.properties?.county_name as string;
            const key = normalizeCountyKey(name);
            const rate = latestRate[key] ?? 0;
            const pop = latestPop[key] ?? 0;
            return {
              ...f,
              properties: {
                ...f.properties,
                food_insecurity_rate: rate,
                food_insecure_pop: pop,
                fill_color: popToColor(pop),
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

/** Legend component — compact single-line, bottom-left, semi-transparent */
export function InsecurityLegend({ visible }: { visible: boolean }) {
  if (!visible) return null;

  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : String(n));

  return (
    <div className="absolute bottom-3 left-3 z-10 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-[10px] text-white/90 flex items-center gap-2 whitespace-nowrap pointer-events-none">
      <span className="font-semibold">Food insecure</span>
      {FOOD_INSECURE_POP_STOPS.map((stop, i) => {
        const next = FOOD_INSECURE_POP_STOPS[i + 1];
        const label = next != null ? `${fmt(stop)}–${fmt(next)}` : `≥${fmt(stop)}`;
        return (
          <span key={stop} className="flex items-center gap-1">
            <span className="inline-block w-3 h-2.5 rounded-[2px]" style={{ background: FOOD_INSECURE_COLORS[i] }} />
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
}
