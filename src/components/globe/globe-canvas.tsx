"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { MeshPhongMaterial } from "three";
import { polygonToCells } from "h3-js";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countries from "world-atlas/countries-110m.json";
import { heatPoints, type GlobeCity, type HeatPoint } from "@/lib/globe-data";

const topology = countries as unknown as Topology<{ countries: GeometryCollection }>;
/**
 * Country shapes the dotted land is drawn from. A few 110m outlines (today, North Korea's)
 * are invalid for H3 and would throw inside the globe, so they're checked once and left out.
 */
const LAND = feature(topology, topology.objects.countries).features.filter((country) => {
  const g = country.geometry;
  const polygons = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  try {
    for (const polygon of polygons) polygonToCells(polygon, 3, true);
    return true;
  } catch {
    return false;
  }
});

const PALETTE = {
  light: { sphere: "#f4f4f5", land: "#c4c4cb", emissive: "#e4e4e7", markerOn: "#111113" },
  dark: { sphere: "#141416", land: "#3a3a40", emissive: "#0b0b0c", markerOn: "#ffffff" },
} as const;

type HexBin = { sumWeight: number; points: HeatPoint[] };

/** How hot a hexagon is, 0–1. Weights are affinity cubed, so a few strong points saturate. */
const strength = (d: HexBin) => Math.min(1, d.sumWeight / 6);

const STOPS = [
  [255, 214, 186],
  [255, 140, 70],
  [255, 103, 25],
  [214, 66, 8],
] as const;

/** Pale peach for faint signal, through ember, to deep burnt orange at the strongest places. */
function heatColor(t: number, alpha = 0.95) {
  const x = Math.max(0, Math.min(1, t)) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(x));
  const k = x - i;
  const from = STOPS[i]!;
  const to = STOPS[i + 1]!;
  const mix = (j: number) => Math.round(from[j]! + (to[j]! - from[j]!) * k);
  return `rgba(${mix(0)}, ${mix(1)}, ${mix(2)}, ${alpha})`;
}

export type GlobeCanvasProps = {
  width: number;
  height: number;
  dark: boolean;
  cities: GlobeCity[];
  /** Whose places are shaded: a side key ("you" or a rival's). */
  side: string;
  /** Where the globe starts looking; altitude zooms in for one country. */
  start: { lat: number; lng: number; altitude: number };
  /** Heat spread in degrees: tighter for towns in one country, wider for a world view. */
  spread: number;
  /** Plain words for the hover label, e.g. "Top pick for Jude's". */
  describe: (city: GlobeCity) => string;
  selected: GlobeCity | null;
  reduceMotion: boolean;
  onSelect: (city: GlobeCity) => void;
  /** Bumped by the parent to fly back to the starting view. */
  resetKey: number;
};

/** The nearest city to a point, if one is close enough to mean "this place". */
function nearestCity(cities: GlobeCity[], lat: number, lng: number, within: number) {
  let best: GlobeCity | null = null;
  let bestDistance = Infinity;
  for (const city of cities) {
    const d = (city.lat - lat) ** 2 + ((city.lng - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      best = city;
    }
  }
  return bestDistance < within ? best : null;
}

/**
 * The WebGL globe. Heat is drawn as hexagon columns binned on the CPU, so it renders
 * the same on every machine and never depends on WebGPU being available.
 */
export default function GlobeCanvas({ width, height, dark, cities, side, start, spread, describe, selected, reduceMotion, onSelect, resetKey }: GlobeCanvasProps) {
  const ref = useRef<GlobeMethods | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const colours = dark ? PALETTE.dark : PALETTE.light;

  const material = useMemo(
    () => new MeshPhongMaterial({ color: colours.sphere, emissive: colours.emissive, emissiveIntensity: 0.25, shininess: 4 }),
    [colours.sphere, colours.emissive],
  );
  useEffect(() => () => material.dispose(), [material]);

  const heat = useMemo(() => heatPoints(cities, side, spread), [cities, side, spread]);

  // Slow spin until someone picks a place; never when reduced motion is on.
  useEffect(() => {
    const globe = ref.current;
    if (!ready || !globe) return;
    const controls = globe.controls();
    controls.autoRotate = !reduceMotion && !selected;
    controls.autoRotateSpeed = 0.35;
    controls.enableDamping = true;
    controls.minDistance = 140;
    controls.maxDistance = 520;
  }, [ready, reduceMotion, selected]);

  useEffect(() => {
    if (!ready) return;
    ref.current?.pointOfView(start, reduceMotion ? 0 : 900);
  }, [ready, resetKey, reduceMotion, start]);

  useEffect(() => {
    if (!ready || !selected) return;
    ref.current?.pointOfView({ lat: selected.lat, lng: selected.lng, altitude: Math.min(1.35, start.altitude * 0.8) }, reduceMotion ? 0 : 1000);
  }, [ready, selected, reduceMotion, start.altitude]);

  // Names come from Qloo and the label is HTML, so escape them.
  const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
  const tooltip = (name: string, words: string) =>
    `<div style="font:500 12.5px Inter,system-ui,sans-serif;padding:6px 10px;border-radius:10px;background:${dark ? "#161618" : "#ffffff"};color:${dark ? "#fafafa" : "#111113"};border:1px solid ${dark ? "#27272a" : "#e4e4e7"};box-shadow:0 4px 16px rgba(0,0,0,.12)">${escape(name)} <span style="color:#a1a1aa">· ${escape(words)}</span></div>`;

  const cityOfHex = (d: HexBin) => {
    const first = d.points[0];
    return first ? nearestCity(cities, first.lat, first.lng, (spread * 6) ** 2) : null;
  };

  return (
    <Globe
      ref={ref}
      width={width}
      height={height}
      backgroundColor="rgba(0,0,0,0)"
      globeMaterial={material}
      showAtmosphere
      atmosphereColor="#ff6719"
      atmosphereAltitude={0.14}
      onGlobeReady={() => setReady(true)}
      hexPolygonsData={LAND}
      hexPolygonResolution={3}
      hexPolygonMargin={0.62}
      hexPolygonUseDots
      hexPolygonColor={() => colours.land}
      hexBinPointsData={heat}
      hexBinPointLat="lat"
      hexBinPointLng="lng"
      hexBinPointWeight="weight"
      hexBinResolution={spread < 0.5 ? 4 : 3}
      hexMargin={0.22}
      hexBinMerge={false}
      hexAltitude={(d) => Math.min(0.16, 0.006 + (d as HexBin).sumWeight * 0.011)}
      hexTopColor={(d) => heatColor(strength(d as HexBin))}
      hexSideColor={(d) => heatColor(strength(d as HexBin), 0.55)}
      hexTransitionDuration={reduceMotion ? 0 : 700}
      hexLabel={(d) => {
        const city = cityOfHex(d as HexBin);
        return city ? tooltip(city.name, describe(city)) : "";
      }}
      onHexClick={(d) => {
        const city = cityOfHex(d as HexBin);
        if (city) onSelect(city);
      }}
      labelsData={selected ? [selected] : []}
      labelLat="lat"
      labelLng="lng"
      labelText="name"
      labelAltitude={0.17}
      labelSize={1.1}
      labelDotRadius={0.45}
      labelColor={() => colours.markerOn}
      labelResolution={3}
      labelsTransitionDuration={reduceMotion ? 0 : 400}
      ringsData={selected && !reduceMotion ? [selected] : []}
      ringLat="lat"
      ringLng="lng"
      ringColor={() => (t: number) => `rgba(255,103,25,${1 - t})`}
      ringMaxRadius={4.5}
      ringPropagationSpeed={2.2}
      ringRepeatPeriod={1100}
    />
  );
}
