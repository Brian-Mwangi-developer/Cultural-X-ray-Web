"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { AdvancedMarker, APIProvider, ColorScheme, Map, RenderingType, useMap } from "@vis.gl/react-google-maps";
import { Component, useCallback, useEffect, useMemo, useState } from "react";
import { CircleAlertIcon, MapPinIcon, XIcon } from "lucide-react";
import { TerritoryGlyph } from "@/components/app/parts";
import { Segmented } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { rankWords, shortRank } from "@/lib/audience";
import type { GlobeCity } from "@/lib/globe-data";
import { reportError } from "@/lib/report";
import { possessive } from "@/lib/intent";
import { cn } from "@/lib/utils";

/*
 * The places on Google Maps, maximised in a dialog: every place a brand's customers pick, as a
 * numbered marker. "3D" tilts and turns the same vector map and flies to the place, where Google
 * draws buildings in 3D. One map for both views: a second (photorealistic) 3D map in the same
 * page tore down the 2D markers and crashed Google's marker library.
 * Needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, billing on its Google Cloud project, and a vector
 * Map ID (NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID; DEMO_MAP_ID works while building).
 */

export const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

type Side = { key: string; name: string };
type View = "map" | "3d";

const standing = (c: GlobeCity) => (c.territory === "yours" ? "Only yours" : c.territory === "contested" ? `Shared with ${c.rival ?? "a rival"}` : `Only ${c.rival ?? "your rivals"}`);

/** Bounds and centre of the places. */
function frameOf(cities: GlobeCity[]) {
  const lats = cities.map((c) => c.lat);
  const lngs = cities.map((c) => c.lng);
  const north = Math.max(...lats), south = Math.min(...lats), east = Math.max(...lngs), west = Math.min(...lngs);
  const center = { lat: (north + south) / 2, lng: (east + west) / 2 };
  return { bounds: { north, south, east, west }, center };
}

/** A numbered pin: ember when only yours, ink when shared or a rival's. */
function Pin({ city, rank, active }: { city: GlobeCity; rank: number; active: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full border-2 border-white font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-transform",
        city.territory === "yours" ? "bg-ember" : "bg-[#18181b]",
        active ? "size-9 scale-110 text-[13px] ring-4 ring-ember/35" : "size-7 text-[11.5px]",
      )}
      title={city.name}
    >
      {rank}
    </span>
  );
}

/** Keeps a failure inside Google Maps from taking the whole page down with it. */
class MapBoundary extends Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    reportError(error, { where: "places-map" });
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Moves the camera. Map: flat, framing every place (or zoomed to the picked one). 3D: tilted and
 * turned over the picked place (or the top one), close enough for Google's 3D buildings.
 */
function Camera({ view, target, bounds }: { view: View; target: GlobeCity | null; bounds: { north: number; south: number; east: number; west: number } }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (view === "3d") {
      if (target) map.moveCamera({ center: { lat: target.lat, lng: target.lng }, zoom: 16.5, tilt: 67.5, heading: 35 });
      return;
    }
    map.moveCamera({ tilt: 0, heading: 0 });
    if (target) map.moveCamera({ center: { lat: target.lat, lng: target.lng }, zoom: Math.max(map.getZoom() ?? 0, 11) });
    else map.fitBounds(bounds, 60);
  }, [map, view, target, bounds]);
  return null;
}

/** Lifts the loading state once the map has settled (or after a fair wait, so it never sticks). */
function WhenReady({ onReady }: { onReady: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const idle = map.addListener("idle", onReady);
    const fallback = setTimeout(onReady, 8_000);
    return () => {
      idle.remove();
      clearTimeout(fallback);
    };
  }, [map, onReady]);
  return null;
}

export function PlacesMapDialog({ open, onOpenChange, cities, sides, initialSide }: { open: boolean; onOpenChange: (open: boolean) => void; cities: GlobeCity[]; sides: Side[]; initialSide: string }) {
  const [side, setSide] = useState(initialSide);
  const [view, setView] = useState<View>("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const markLoaded = useCallback(() => setLoaded(true), []);
  const [error, setError] = useState<string | null>(null);

  const who = sides.find((s) => s.key === side) ?? sides[0]!;
  const ranked = useMemo(() => cities.filter((c) => c.ranks[side]).sort((a, b) => a.ranks[side]! - b.ranks[side]!), [cities, side]);
  const frame = useMemo(() => frameOf(ranked.length ? ranked : cities), [ranked, cities]);
  const selected = ranked.find((c) => c.id === selectedId) ?? null;

  // Google calls this global when it rejects the key (wrong referrer, API not enabled).
  useEffect(() => {
    const w = window as unknown as { gm_authFailure?: () => void };
    w.gm_authFailure = () => setError("Google Maps didn't accept this site's key. Check that the Maps JavaScript API is enabled and this address is allowed.");
    return () => {
      w.gm_authFailure = undefined;
    };
  }, []);

  function pick(city: GlobeCity) {
    setSelectedId(city.id);
  }

  const loading = !error && !loaded;
  // In 3D the camera needs a place to stand over: the picked one, else the top of the list.
  const target = selected ?? (view === "3d" ? ranked[0] ?? null : null);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px] duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-3 z-50 mx-auto flex max-w-[1400px] flex-col overflow-hidden rounded-[18px] border bg-card shadow-2xl outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98] data-closed:animate-out data-closed:fade-out-0 sm:inset-8">
          <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-5">
            <MapPinIcon className="size-4 text-ember" strokeWidth={1.75} aria-hidden />
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="truncate text-[15px] font-semibold">Where {possessive(who.name)} customers go</DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-[12.5px] text-muted-foreground">
                {ranked.length} places, numbered by how high they sit on {possessive(who.name)} list. Click one to zoom in.
              </DialogPrimitive.Description>
            </div>
            {sides.length > 1 && (
              <Segmented
                label="Whose places"
                value={side}
                onChange={(v) => {
                  setSide(v);
                  setSelectedId(null);
                }}
                options={sides.slice(0, 3).map((s) => ({ value: s.key, label: s.name }))}
                className="[&_button]:h-7 [&_button]:px-3 [&_button]:text-[12.5px]"
              />
            )}
            <Segmented label="View" value={view} onChange={setView} options={[{ value: "map", label: "Map" }, { value: "3d", label: "3D" }]} className="[&_button]:h-7 [&_button]:px-3 [&_button]:text-[12.5px]" />
            <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}>
              <XIcon />
            </DialogPrimitive.Close>
          </header>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
            <ol className="order-2 max-h-[34vh] overflow-y-auto border-t lg:order-1 lg:max-h-none lg:border-t-0 lg:border-r" aria-label={`${possessive(who.name)} places`}>
              {ranked.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => pick(c)}
                    aria-pressed={c.id === selectedId}
                    className={cn("grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted", c.id === selectedId && "bg-ember-soft hover:bg-ember-soft")}
                  >
                    <TerritoryGlyph kind={c.territory} />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium">{c.name}</span>
                      <span className="block truncate text-[12px] text-muted-foreground">{[c.region, standing(c)].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="text-[12px] text-muted-foreground">{shortRank(c, side)}</span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="relative order-1 min-h-[320px] lg:order-2">
              {MAPS_KEY && !error && (
                <MapBoundary onError={() => setError("Google Maps stopped unexpectedly. Close this and open it again.")}>
                <APIProvider apiKey={MAPS_KEY} onError={() => setError("Google Maps couldn't load. Check your connection, then try again.")}>
                    <Map
                      mapId={MAP_ID}
                      defaultBounds={{ ...frame.bounds, padding: 60 }}
                      renderingType={RenderingType.VECTOR}
                      gestureHandling="greedy"
                      // Always the familiar light street map, even in dark mode: it's what owners recognise.
                      colorScheme={ColorScheme.LIGHT}
                      mapTypeControl={false}
                      streetViewControl={false}
                      fullscreenControl={false}
                      className="absolute inset-0"
                    >
                      {ranked.map((c) => (
                        <AdvancedMarker key={c.id} position={{ lat: c.lat, lng: c.lng }} title={`${c.name}, ${shortRank(c, side)}`} onClick={() => pick(c)} zIndex={c.id === selectedId ? 1000 : 100 - (c.ranks[side] ?? 0)}>
                          <Pin city={c} rank={c.ranks[side]!} active={c.id === selectedId} />
                        </AdvancedMarker>
                      ))}
                      <Camera view={view} target={target} bounds={frame.bounds} />
                      <WhenReady onReady={markLoaded} />
                    </Map>
                </APIProvider>
                </MapBoundary>
              )}

              {loading && MAPS_KEY && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-card" role="status" aria-live="polite">
                  <span className="flex items-center gap-2 text-[13.5px] font-medium">
                    <Spinner className="size-4" />
                    Loading the map
                  </span>
                </div>
              )}

              {(error || !MAPS_KEY) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-card p-6" role="alert">
                  <p className="flex max-w-sm items-start gap-2.5 text-[13.5px] leading-relaxed">
                    <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                    {!MAPS_KEY
                      ? "Google Maps isn't set up yet. The globe and the list show every place."
                      : error}
                  </p>
                </div>
              )}

              {selected && !loading && !error && (
                <section aria-live="polite" className="absolute bottom-4 left-4 z-10 w-[min(300px,calc(100%-2rem))] rounded-[14px] border bg-card/95 p-4 shadow-lg backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[16px] font-semibold">{selected.name}</h3>
                      <p className="text-[12.5px] text-muted-foreground">{selected.region}</p>
                    </div>
                    <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={() => setSelectedId(null)}>
                      <XIcon />
                    </Button>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-[13px] font-medium">
                    <TerritoryGlyph kind={selected.territory} decorative />
                    {standing(selected)}
                  </p>
                  <ul className="mt-2 space-y-1 text-[13px]">
                    {sides.map((s) => (
                      <li key={s.key} className={selected.ranks[s.key] ? "" : "text-muted-foreground"}>
                        {rankWords(selected, s)}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
