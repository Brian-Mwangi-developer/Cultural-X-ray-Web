"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { HandIcon, LocateFixedIcon, XIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { LeanBar, Panel, TerritoryGlyph } from "@/components/app/parts";
import { possessive } from "@/lib/intent";
import { Segmented } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { GLOBE_CITIES, territoryOf, type GlobeCity } from "@/lib/globe-data";
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

const TERRITORY_WORD = { yours: "Yours", contested: "Contested", theirs: "Theirs" } as const;

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
export function AudienceGlobe({ brand, rival }: { brand: string; rival: string }) {
  const { resolvedTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [box, size] = useSize<HTMLDivElement>();
  const [side, setSide] = useState<"brand" | "rival">("brand");
  const [selected, setSelected] = useState<GlobeCity | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const ranked = useMemo(() => [...GLOBE_CITIES].sort((a, b) => b[side] - a[side]), [side]);
  const who = side === "brand" ? brand : rival;

  return (
    <Panel
      title="Where the culture lives"
      action={
        <span className="flex items-center gap-2">
          <Segmented
            label="Whose culture"
            value={side}
            onChange={setSide}
            options={[
              { value: "brand", label: brand },
              { value: "rival", label: rival },
            ]}
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
                side={side}
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
            <p className="text-[11.5px] text-muted-foreground">{possessive(who)} culture, by place</p>
            <div className="mt-2 h-1.5 rounded-full" style={{ background: "linear-gradient(90deg, #ffd6ba, #ff8c46, #ff6719, #d64208)" }} aria-hidden />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Weaker</span>
              <span>Stronger</span>
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
              <p className="mt-3 flex items-center gap-1.5 text-[13px]">
                <TerritoryGlyph kind={territoryOf(selected)} decorative />
                {TERRITORY_WORD[territoryOf(selected)]}
                <span className="text-muted-foreground">· {selected.note}</span>
              </p>
              <dl className="mt-3 space-y-2 text-[13px]">
                {(
                  [
                    [brand, selected.brand],
                    [rival, selected.rival],
                  ] as const
                ).map(([name, score]) => (
                  <div key={name} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                    <dt className="truncate text-muted-foreground">{name}</dt>
                    <dd className="font-mono text-[12.5px] tabular-nums">{score.toFixed(2)}</dd>
                    <span className="col-span-2 h-1.5 rounded-full bg-soft">
                      <span className={cn("block h-full rounded-full", name === brand ? "bg-ember" : "bg-foreground/70")} style={{ width: `${score * 100}%` }} />
                    </span>
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
                Lean
                <LeanBar left={Math.round((selected.brand / (selected.brand + selected.rival)) * 100)} />
                <span className="tabular-nums">{Math.round((selected.brand / (selected.brand + selected.rival)) * 100)} / {100 - Math.round((selected.brand / (selected.brand + selected.rival)) * 100)}</span>
              </div>
            </section>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto md:max-h-[520px]">
          <p className="sticky top-0 z-10 border-b bg-card px-5 py-2.5 text-[11.5px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
            Cities by {possessive(who)} index
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
                      <TerritoryGlyph kind={territoryOf(city)} />
                      <span className="truncate">{city.name}</span>
                    </span>
                    <span className="block truncate pl-[18px] text-[12px] text-muted-foreground">{city.region}</span>
                  </span>
                  <span className="font-mono text-[12.5px] tabular-nums">{city[side].toFixed(2)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
