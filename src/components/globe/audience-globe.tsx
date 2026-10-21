"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { HandIcon, LocateFixedIcon, XIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Panel, TerritoryGlyph } from "@/components/app/parts";
import { rankWords, shortRank } from "@/lib/audience";
import { possessive } from "@/lib/intent";
import { Segmented } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { GlobeCity } from "@/lib/globe-data";
import { cn } from "@/lib/utils";

// WebGL needs the browser; the canvas loads only on the client.
const GlobeCanvas = dynamic(() => import("./globe-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center gap-2 text-[13px] text-muted-foreground">
      <Spinner className="size-4" />
      Loading the globe
    </div>
  ),
});

/** "Only yours", "Shared with Ben & Jerry's", "Only Häagen-Dazs". */
const standing = (city: GlobeCity) => (city.territory === "yours" ? "Only yours" : city.territory === "contested" ? `Shared with ${city.rival ?? "a rival"}` : `Only ${city.rival ?? "your rivals"}`);

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-reduce-motion"] });
      mql.addEventListener("change", onChange);
      return () => {
        observer.disconnect();
        mql.removeEventListener("change", onChange);
      };
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.hasAttribute("data-reduce-motion"),
    () => false,
  );
}

/** Measures its box so the WebGL canvas always fills it exactly. */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/**
 * Where a brand's culture lives, on a globe you can turn, zoom and click.
 * Every city on the globe is also in the list beside it, for keyboards and screen readers.
 */
type Side = { key: string; name: string };

export function AudienceGlobe({ cities, sides, start, spread = 1.1 }: { cities: GlobeCity[]; sides: Side[]; start: { lat: number; lng: number; altitude: number }; spread?: number }) {
  const { resolvedTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [box, size] = useSize<HTMLDivElement>();
  const [side, setSide] = useState(sides[0]?.key ?? "you");
  const [selected, setSelected] = useState<GlobeCity | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const ranked = useMemo(() => cities.filter((c) => c.ranks[side]).sort((a, b) => a.ranks[side]! - b.ranks[side]!), [cities, side]);
  const who = sides.find((s) => s.key === side)?.name ?? "";
  const current = sides.find((s) => s.key === side) ?? sides[0]!;

  return (
    <Panel
      title="Where the culture lives"
      action={
        <span className="flex items-center gap-2">
          <Segmented
            label="Whose culture"
            value={side}
            onChange={setSide}
            options={sides.slice(0, 3).map((s) => ({ value: s.key, label: s.name }))}
            className="[&_button]:h-7 [&_button]:px-3 [&_button]:text-[12.5px]"
          />
        </span>
      }
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative h-[420px] overflow-hidden border-b md:h-[520px] lg:border-r lg:border-b-0">
          <div ref={box} className="absolute inset-0 cursor-grab active:cursor-grabbing" aria-hidden>
            {size.width > 0 && (
              <GlobeCanvas
                width={size.width}
                height={size.height}
                dark={resolvedTheme === "dark"}
                cities={cities}
                side={side}
                start={start}
                spread={spread}
                describe={(city) => rankWords(city, current)}
                selected={selected}
                reduceMotion={reduceMotion}
                onSelect={setSelected}
                resetKey={resetKey}
              />
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3">
            <p className="flex items-center gap-1.5 rounded-full border bg-card/85 px-3 py-1.5 text-[12px] text-muted-foreground backdrop-blur">
              <HandIcon className="size-3.5" strokeWidth={1.75} aria-hidden />
              Drag to turn · scroll to zoom · click a city
            </p>
            <Button
              variant="outline"
              size="pill"
              className="pointer-events-auto bg-card/85 backdrop-blur"
              onClick={() => {
                setSelected(null);
                setResetKey((k) => k + 1);
              }}
            >
              <LocateFixedIcon data-icon="inline-start" />
              Reset view
            </Button>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 w-52 rounded-[12px] border bg-card/85 px-3 py-2.5 backdrop-blur">
            <p className="text-[11.5px] text-muted-foreground">Where {possessive(who)} customers go</p>
            <div className="mt-2 h-1.5 rounded-full" style={{ background: "linear-gradient(90deg, #ffd6ba, #ff8c46, #ff6719, #d64208)" }} aria-hidden />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Lower on their list</span>
              <span>Top picks</span>
            </div>
          </div>

          {selected && (
            <section aria-live="polite" className="absolute right-4 bottom-4 w-[min(300px,calc(100%-2rem))] rounded-[14px] border bg-card/95 p-4 shadow-lg backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[16px] font-semibold tracking-[-0.01em]">{selected.name}</h3>
                  <p className="text-[12.5px] text-muted-foreground">{selected.region}</p>
                </div>
                <Button variant="ghost" size="icon-xs" aria-label="Close" onClick={() => setSelected(null)}>
                  <XIcon />
                </Button>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[13px] font-medium">
                <TerritoryGlyph kind={selected.territory} decorative />
                {standing(selected)}
              </p>
              <ul className="mt-2.5 space-y-1.5 text-[13px]">
                {sides.map((s) => (
                  <li key={s.key} className="flex items-center gap-2">
                    <span className={cn("size-1.5 shrink-0 rounded-full", s.key === "you" ? "bg-ember" : "bg-foreground/60")} aria-hidden />
                    <span className={selected.ranks[s.key] ? "" : "text-muted-foreground"}>{rankWords(selected, s)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto md:max-h-[520px]">
          <p className="sticky top-0 z-10 border-b bg-card px-5 py-2.5 text-[11.5px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
            {possessive(who)} top places
          </p>
          <ul className="divide-y divide-soft">
            {ranked.map((city) => (
              <li key={city.id}>
                <button
                  type="button"
                  onClick={() => setSelected(city)}
                  aria-pressed={selected?.id === city.id}
                  className={cn(
                    "grid w-full grid-cols-[1fr_auto] items-center gap-x-3 px-5 py-2.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                    selected?.id === city.id && "bg-ember-soft hover:bg-ember-soft",
                  )}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-[14px] font-medium">
                      <TerritoryGlyph kind={city.territory} />
                      <span className="truncate">{city.name}</span>
                    </span>
                    <span className="block truncate pl-[18px] text-[12px] text-muted-foreground">{[city.region, standing(city)].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="text-[12.5px] text-muted-foreground">{shortRank(city, side)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
