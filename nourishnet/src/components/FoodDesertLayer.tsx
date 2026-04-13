import { CircleMarker, Tooltip } from "react-leaflet";
import type { CountyStat } from "../types";

interface Props {
  countyStats: CountyStat[];
  visible: boolean;
  onCountyClick?: (county: string) => void;
}

// Approximate centroids for all 24 Maryland jurisdictions
const COUNTY_CENTROIDS: Record<string, [number, number]> = {
  "Allegany":        [39.596, -78.753],
  "Anne Arundel":    [38.980, -76.596],
  "Baltimore City":  [39.290, -76.612],
  "Baltimore County":[39.440, -76.610],
  "Calvert":         [38.530, -76.536],
  "Caroline":        [38.882, -75.866],
  "Carroll":         [39.564, -76.988],
  "Cecil":           [39.540, -75.969],
  "Charles":         [38.490, -76.940],
  "Dorchester":      [38.561, -76.074],
  "Frederick":       [39.465, -77.411],
  "Garrett":         [39.549, -79.283],
  "Harford":         [39.544, -76.327],
  "Howard":          [39.287, -76.877],
  "Kent":            [39.215, -76.098],
  "Montgomery":      [39.154, -77.240],
  "Prince George's": [38.846, -76.877],
  "Queen Anne's":    [38.921, -76.117],
  "Somerset":        [38.025, -75.869],
  "St. Mary's":      [38.217, -76.600],
  "Talbot":          [38.767, -76.178],
  "Washington":      [39.604, -77.817],
  "Wicomico":        [38.373, -75.650],
  "Worcester":       [38.075, -75.202],
};

function insecurityColor(rate: number): string {
  if (rate >= 18) return "#dc2626"; // red — critical
  if (rate >= 15) return "#ea580c"; // orange — high
  if (rate >= 12) return "#ca8a04"; // yellow — moderate
  return "#16a34a";                 // green — lower
}

// Get the most recent stat per county
function latestByCounty(stats: CountyStat[]): Map<string, CountyStat> {
  const map = new Map<string, CountyStat>();
  for (const s of stats) {
    const existing = map.get(s.county);
    if (!existing || s.year > existing.year) map.set(s.county, s);
  }
  return map;
}

export default function FoodDesertLayer({ countyStats, visible, onCountyClick }: Props) {
  if (!visible) return null;

  const latest = latestByCounty(countyStats);
  const maxPop = Math.max(...Array.from(latest.values()).map((s) => s.foodInsecurePopulation));

  return (
    <>
      {Array.from(latest.entries()).map(([county, stat]) => {
        const center = COUNTY_CENTROIDS[county];
        if (!center || stat.foodInsecurityRate == null) return null;

        // Radius: 14–42 px, scaled by sqrt of population share
        const radius = 14 + Math.sqrt(stat.foodInsecurePopulation / maxPop) * 28;
        const color = insecurityColor(stat.foodInsecurityRate);
        const shortfall = stat.annualFoodBudgetShortfall
          ? `$${(stat.annualFoodBudgetShortfall / 1_000_000).toFixed(1)}M/yr gap`
          : null;

        return (
          <CircleMarker
            key={county}
            center={center}
            radius={radius}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.55,
              color: color,
              weight: 2,
              opacity: 0.85,
            }}
            eventHandlers={onCountyClick ? { click: () => onCountyClick(county) } : undefined}
          >
            <Tooltip sticky>
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                <strong>{county}</strong>
                <br />
                Food insecurity: <strong>{stat.foodInsecurityRate}%</strong> ({stat.year})
                <br />
                {stat.foodInsecurePopulation.toLocaleString()} people affected
                {shortfall && <><br />{shortfall}</>}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
