"use client";

import { useSyncExternalStore } from "react";
import { CheckIcon, LoaderCircleIcon, ScanIcon } from "lucide-react";
import { PageHeader } from "@/components/app/parts";
import { useFrames } from "@/components/adcheck/frames";
import { OverlayChip } from "@/components/adcheck/player";
import { type AdDetail, ago, shotName, STEPS, stepOf, videoUrl } from "@/lib/ads";
import { cn } from "@/lib/utils";

/** A clock that ticks every few seconds on the client only (the server renders nothing time-based). */
function useNow(everyMs = 5000) {
  return useSyncExternalStore(
    (notify) => {
      const id = setInterval(notify, everyMs);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / everyMs) * everyMs,
    () => null,
  );
}

/**
 * R3: the ad being read. The big frame is the shot being described, with an ember scan across it;
 * steps fill in as the worker moves. Leaving the page doesn't stop anything.
 */
export function Reading({ orgId, ad }: { orgId: string; ad: AdDetail }) {
  const now = useNow();
  const step = stepOf(ad.status, ad.stage);
  const described = ad.shots.filter((s) => s.description);
  const describing = ad.stage === "describing shots";
  const current = describing ? (ad.shots.find((s) => !s.description) ?? ad.shots.at(-1)) : (described.at(-1) ?? ad.shots[0]);
  const src = ad.hasVideo ? videoUrl(orgId, ad.id) : null;
  const shotTimes = ad.shots.map((s) => s.startMs + Math.min(400, (s.endMs - s.startMs) / 2));
  const [big] = useFrames(src, [current ? current.startMs + Math.min(400, (current.endMs - current.startMs) / 2) : 500], 960);
  const thumbs = useFrames(src, shotTimes.slice(0, 12), 160);

  // Overall progress: whole steps, plus how far through the shots the describing step is.
  const within = describing && ad.shots.length ? described.length / ad.shots.length : 0;
  const pct = Math.min(96, ((step + within) / STEPS.length) * 100 + 4);

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader title="Reading your ad" description="Usually about a minute. You can leave this page; it keeps going without you." />

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-14">
        <div className="min-w-0 space-y-3.5">
          <div className="relative aspect-video overflow-hidden rounded-[16px] bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element -- a frame drawn in the browser */}
            {big && <img src={big} alt="" className="size-full animate-[rise_500ms_ease-out_both] object-cover" key={big.length} />}
            <div className="ad-scan pointer-events-none absolute inset-0" aria-hidden />
            <div className="absolute top-4 left-4">
              <OverlayChip>
                <ScanIcon className="size-3.5" aria-hidden />
                {current && ad.shots.length
                  ? describing
                    ? `Shot ${current.index + 1} of ${ad.shots.length}`
                    : `${ad.shots.length} shots found`
                  : "Getting the video ready"}
              </OverlayChip>
            </div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-soft" role="progressbar" aria-label="Reading progress" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-ember transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[12.5px] text-muted-foreground tabular-nums">
            <span>
              Step {Math.min(step + 1, STEPS.length)} of {STEPS.length}
            </span>
            {now !== null && <span>Started {ago(ad.createdAt, now)}</span>}
          </div>
        </div>

        <ol className="space-y-6" aria-label="Steps">
          {STEPS.map((s, i) => {
            const state = i < step ? "done" : i === step ? "now" : "next";
            return (
              <li key={s.id} className="flex gap-3.5" aria-current={state === "now" ? "step" : undefined}>
                <StepMark state={state} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className={cn("text-[15px]", state === "next" ? "text-muted-foreground" : "font-medium")}>
                    {i === 0 && ad.shots.length ? `Found ${ad.shots.length} ${ad.shots.length === 1 ? "shot" : "shots"}` : s.title}
                  </p>
                  {i === 0 && ad.shots.length > 0 && (
                    <div className="mt-2.5 flex gap-1">
                      {thumbs.map((t, j) => (
                        <div key={j} className="aspect-[16/10] w-11 overflow-hidden rounded-[5px] bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element -- a frame drawn in the browser */}
                          {t && <img src={t} alt="" className="size-full animate-[rise_400ms_ease-out_both] object-cover" />}
                        </div>
                      ))}
                      {ad.shots.length > thumbs.length && <span className="self-center pl-1 text-[12px] text-muted-foreground">+{ad.shots.length - thumbs.length}</span>}
                    </div>
                  )}
                  {i === 2 && state !== "next" && ad.shots.length > 0 && (
                    <p className="mt-1.5 text-[13px] text-muted-foreground tabular-nums">
                      {described.length} of {ad.shots.length} described
                      {described.at(-1) ? <span className="text-foreground/80"> · “{shotName(described.at(-1)!)}”</span> : null}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function StepMark({ state }: { state: "done" | "now" | "next" }) {
  if (state === "done")
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted">
        <CheckIcon className="size-3.5 text-foreground/80" strokeWidth={2.5} aria-hidden />
      </span>
    );
  if (state === "now")
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-ember bg-ember-soft">
        <LoaderCircleIcon className="size-3.5 animate-spin text-ember-ink" strokeWidth={2.5} aria-hidden />
      </span>
    );
  return <span className="size-6 shrink-0 rounded-full border bg-card" aria-hidden />;
}
