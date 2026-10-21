"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRightIcon, BellIcon, CircleAlertIcon, CircleCheckIcon, CircleDashedIcon, LoaderCircleIcon, RotateCwIcon } from "lucide-react";
import { TerritoryGlyph } from "@/components/app/parts";
import { PageBody, TopBar } from "@/components/shell/top-bar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AppError, userMessage } from "@/lib/errors";
import { type CultureMap, type MapCategory, inProgress, maps, ownedIn, standingOf, territoryOf } from "@/lib/maps";
import { reportError } from "@/lib/report";
import { cn } from "@/lib/utils";

const POLL_MS = 2000;

/**
 * o2: the first build, category by category. The build runs in the backend's worker; this page
 * only reads its progress, so leaving or reloading never stops it. Polling pauses while the tab
 * is hidden and picks up again when it's back.
 */
export function MapBuilding({ orgId, initial, reading, market, rivals }: { orgId: string; initial: CultureMap; reading: string; market: string; rivals: string[] }) {
  const router = useRouter();
  const [map, setMap] = useState(initial);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const live = inProgress(map.status);

  useEffect(() => {
    if (!live) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      if (document.visibilityState === "visible") {
        try {
          const { map: next } = await maps.latest(orgId, controller.signal);
          if (next) setMap(next);
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          // A missed poll is harmless; the next one catches up.
        }
      }
      timer = setTimeout(tick, POLL_MS);
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      void tick();
    };
    timer = setTimeout(tick, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [live, orgId]);

  async function retry() {
    setRetrying(true);
    setError(null);
    try {
      const { map: started } = await maps.build(orgId);
      setMap((m) => ({ ...m, status: started.status }));
    } catch (e) {
      if (!(e instanceof AppError && e.expected)) reportError(e, { where: "map.retry" });
      setError(userMessage(e));
    } finally {
      setRetrying(false);
    }
  }

  const done = map.categories.filter((c) => c.done).length;
  const total = map.categories.length;
  const ready = map.status === "READY";
  const failed = map.status === "FAILED";
  const arrived = map.categories.filter((c) => c.done);

  return (
    <>
      <TopBar crumbs={[{ label: "Overview" }]} />
      <PageBody>
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-live="polite">
            <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
              {ready ? "Your map is ready" : failed ? "Your map stopped" : "Building your map"}
            </p>
            <p className="mt-4 flex items-baseline gap-4">
              <span className="text-[88px] leading-none font-semibold tracking-[-0.05em] tabular-nums">{done}</span>
              <span className="text-[26px] font-semibold tracking-[-0.02em] text-muted-foreground">of {total} categories</span>
            </p>
            <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-foreground/85">
              Reading the culture around {reading} in the {market}
              {rivals.length ? `, against ${rivals.join(", ")}` : ""}. {ready ? "Done." : failed ? `The ${done} finished ${done === 1 ? "category is" : "categories are"} saved.` : timeLeft(map)}
            </p>
            <div className="mt-5 h-1 max-w-lg overflow-hidden rounded-full bg-soft" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label="Categories read">
              <div className={cn("h-full rounded-full transition-[width] duration-700", failed ? "bg-foreground/40" : "bg-ember")} style={{ width: `${(done / total) * 100}%` }} />
            </div>

            <ul className="mt-7 max-w-lg divide-y rounded-[14px] border bg-card">
              {map.categories.map((c) => (
                <CategoryRow key={c.kind} category={c} state={c.done ? "done" : failed ? "stopped" : map.status === "QUEUED" ? "queued" : "running"} />
              ))}
            </ul>

            {ready && (
              <Button size="cta" className="mt-6" onClick={() => router.refresh()}>
                See your overview
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            )}
            {failed && (
              <div className="mt-6 max-w-lg space-y-3">
                <p className="flex items-start gap-2.5 text-[14px] leading-relaxed">
                  <CircleAlertIcon className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  Qloo didn&rsquo;t answer for the rest. Try again and we&rsquo;ll pick up where it stopped.
                </p>
                {error && <p className="text-[13.5px] text-destructive">{error}</p>}
                <Button size="cta" onClick={retry} disabled={retrying}>
                  {retrying ? <Spinner className="size-4" /> : <RotateCwIcon data-icon="inline-start" />}
                  Try again
                </Button>
              </div>
            )}
            {live && (
              <p className="mt-5 flex items-center gap-2 text-[13.5px] text-muted-foreground">
                <BellIcon className="size-4" strokeWidth={1.75} aria-hidden />
                You can leave. It keeps building, and we&rsquo;ll email you when it&rsquo;s ready.
              </p>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-[13.5px] text-muted-foreground">{arrived.length ? "Already in" : "First readings arrive here"}</h2>
            {arrived.map((c) => (
              <Reading key={c.kind} category={c} />
            ))}
            {live && map.categories.filter((c) => !c.done).slice(0, arrived.length ? 1 : 2).map((c) => <Placeholder key={c.kind} label={`${c.label} · arriving`} />)}
          </section>
        </div>
      </PageBody>
    </>
  );
}

/** "About a minute left", from how fast the finished categories went. */
function timeLeft(map: CultureMap) {
  const done = map.categories.filter((c) => c.done).length;
  if (map.status === "QUEUED" || !done) return "Usually about a minute.";
  const elapsed = (Date.now() - new Date(map.createdAt).getTime()) / 1000;
  const left = (elapsed / done) * (map.categories.length - done);
  return left < 20 ? "Almost there." : left < 75 ? "About a minute left." : `About ${Math.round(left / 60)} minutes left.`;
}

function CategoryRow({ category: c, state }: { category: MapCategory; state: "done" | "running" | "queued" | "stopped" }) {
  const found = c.counts.yours + c.counts.contested;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {state === "done" && <CircleCheckIcon className="size-[18px]" strokeWidth={1.75} aria-hidden />}
      {state === "running" && <LoaderCircleIcon className="size-[18px] animate-spin text-ember" strokeWidth={2} aria-hidden />}
      {(state === "queued" || state === "stopped") && <CircleDashedIcon className="size-[18px] text-faint" strokeWidth={1.75} aria-hidden />}
      <span className={cn("flex-1 text-[14.5px]", state === "done" ? "font-medium" : "text-muted-foreground")}>{c.label}</span>
      <span className="text-[13px] text-muted-foreground tabular-nums">
        {state === "done" ? `${found} for your customers` : state === "running" ? "Reading" : state === "stopped" ? "Not read yet" : "Queued"}
      </span>
    </li>
  );
}

function Reading({ category: c }: { category: MapCategory }) {
  const top = ownedIn(c).slice(0, 3);
  const image = top.find((i) => i.image)?.image;
  return (
    <article className="flex gap-5 rounded-[14px] border bg-card p-4">
      {image && (
        <div className="relative hidden size-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:block">
          <Image src={image} alt="" fill sizes="96px" className="object-cover" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[11.5px] font-medium tracking-[0.1em] text-muted-foreground uppercase">{c.label}</p>
        <p className="mt-1.5 text-[17px] leading-snug font-medium tracking-[-0.01em]">{c.reading}</p>
        {top.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {top.map((i) => (
              <span key={i.id} title={standingOf(i)} className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border px-2.5 text-[12.5px]">
                <TerritoryGlyph kind={territoryOf(i.label)} decorative />
                <span className="truncate">{i.name}</span>
                <span className="sr-only">, {standingOf(i)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex gap-5 rounded-[14px] border bg-card p-4" aria-hidden>
      <div className="hidden size-24 shrink-0 rounded-xl bg-muted sm:block" />
      <div className="flex-1 space-y-2.5 pt-1">
        <p className="text-[11.5px] font-medium tracking-[0.1em] text-faint uppercase">{label}</p>
        <div className="h-2 w-11/12 rounded-full bg-soft" />
        <div className="h-2 w-2/3 rounded-full bg-soft" />
      </div>
    </div>
  );
}
