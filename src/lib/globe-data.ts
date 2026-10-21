/**
 * Sample geography for the audience globe: where a brand's culture concentrates,
 * and where its rival's does. Shaped like the engine's future city-affinity output.
 */
import type { Territory } from "@/components/app/parts";

export type GlobeCity = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  /** Affinity index for the brand and its first rival, 0–1. */
  brand: number;
  rival: number;
  note: string;
};

export const GLOBE_CITIES: GlobeCity[] = [
  { id: "moab", name: "Moab", region: "Utah · US", lat: 38.57, lng: -109.55, brand: 0.95, rival: 0.42, note: "Strongest destination; climbing and slow trips" },
  { id: "denver", name: "Denver", region: "Colorado · US", lat: 39.74, lng: -104.99, brand: 0.92, rival: 0.61, note: "Top city for wellbeing podcasts" },
  { id: "seattle", name: "Seattle", region: "Washington · US", lat: 47.61, lng: -122.33, brand: 0.86, rival: 0.58, note: "Conservation films over-index here" },
  { id: "portland", name: "Portland", region: "Oregon · US", lat: 45.52, lng: -122.68, brand: 0.83, rival: 0.55, note: "Slow-travel writers and trail running" },
  { id: "vancouver", name: "Vancouver", region: "British Columbia · CA", lat: 49.28, lng: -123.12, brand: 0.79, rival: 0.6, note: "Shared climbing scene, leans yours" },
  { id: "telluride", name: "Telluride", region: "Colorado · US", lat: 37.94, lng: -107.81, brand: 0.81, rival: 0.77, note: "Shared ground with the rival" },
  { id: "nyc", name: "New York City", region: "New York · US", lat: 40.71, lng: -74.01, brand: 0.64, rival: 0.71, note: "Big audience; leans the rival's way" },
  { id: "la", name: "Los Angeles", region: "California · US", lat: 34.05, lng: -118.24, brand: 0.58, rival: 0.66, note: "Fitness culture pulls toward the rival" },
  { id: "austin", name: "Austin", region: "Texas · US", lat: 30.27, lng: -97.74, brand: 0.55, rival: 0.52, note: "Even split; music festivals carry it" },
  { id: "chicago", name: "Chicago", region: "Illinois · US", lat: 41.88, lng: -87.63, brand: 0.49, rival: 0.62, note: "Endurance and survival TV" },
  { id: "toronto", name: "Toronto", region: "Ontario · CA", lat: 43.65, lng: -79.38, brand: 0.5, rival: 0.58, note: "Thin signal on both sides" },
  { id: "lakes", name: "Lake District", region: "Cumbria · UK", lat: 54.46, lng: -3.09, brand: 0.9, rival: 0.38, note: "Top UK destination in the UK map" },
  { id: "edinburgh", name: "Edinburgh", region: "Scotland · UK", lat: 55.95, lng: -3.19, brand: 0.7, rival: 0.5, note: "Wild camping creators live here" },
  { id: "london", name: "London", region: "England · UK", lat: 51.51, lng: -0.13, brand: 0.61, rival: 0.57, note: "Largest UK audience; contested" },
  { id: "chamonix", name: "Chamonix", region: "Haute-Savoie · FR", lat: 45.92, lng: 6.87, brand: 0.66, rival: 0.84, note: "Alpinism belongs to the rival" },
  { id: "stockholm", name: "Stockholm", region: "Sweden", lat: 59.33, lng: 18.07, brand: 0.52, rival: 0.69, note: "Rival's home market" },
  { id: "berlin", name: "Berlin", region: "Germany", lat: 52.52, lng: 13.4, brand: 0.44, rival: 0.51, note: "Thin signal on both sides" },
  { id: "queenstown", name: "Queenstown", region: "Otago · NZ", lat: -45.03, lng: 168.66, brand: 0.74, rival: 0.62, note: "Adventure travel that leans yours" },
  { id: "sydney", name: "Sydney", region: "New South Wales · AU", lat: -33.87, lng: 151.21, brand: 0.47, rival: 0.44, note: "Small, even audience" },
  { id: "tokyo", name: "Tokyo", region: "Japan", lat: 35.68, lng: 139.69, brand: 0.31, rival: 0.35, note: "Outside both brands' culture" },
  { id: "capetown", name: "Cape Town", region: "Western Cape · ZA", lat: -33.92, lng: 18.42, brand: 0.41, rival: 0.33, note: "Thin coverage in Qloo" },
  { id: "nairobi", name: "Nairobi", region: "Kenya", lat: -1.29, lng: 36.82, brand: 0.28, rival: 0.22, note: "Thin coverage in Qloo; not offered yet" },
];

export const territoryOf = (city: GlobeCity): Territory => {
  const diff = city.brand - city.rival;
  return diff > 0.08 ? "yours" : diff < -0.08 ? "theirs" : "contested";
};

export type HeatPoint = { lat: number; lng: number; weight: number };

/** Deterministic noise so the heatmap looks the same on every load. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Spreads each city into a soft cluster; strong cities get dense, heavy clusters. */
export function heatPoints(side: "brand" | "rival"): HeatPoint[] {
  const random = seeded(side === "brand" ? 7 : 13);
  const points: HeatPoint[] = [];
  for (const city of GLOBE_CITIES) {
    const score = city[side];
    const count = Math.round(8 + score * 40);
    for (let i = 0; i < count; i++) {
      // Box–Muller for a gaussian spread of roughly 1.1°.
      const u = Math.max(random(), 1e-6);
      const v = random();
      const r = Math.sqrt(-2 * Math.log(u)) * 1.1;
      points.push({ lat: city.lat + r * Math.cos(2 * Math.PI * v), lng: city.lng + r * Math.sin(2 * Math.PI * v) * 1.3, weight: score ** 3 });
    }
  }
  return points;
}
