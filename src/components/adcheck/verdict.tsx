"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowRightIcon, LoaderCircleIcon, ClapperboardIcon, InfoIcon, QuoteIcon, VideoOffIcon } from "lucide-react";
import { Panel, PanelRows, TerritoryGlyph, type Territory, WideOnly } from "@/components/app/parts";
import { XRayRead } from "@/components/app/xray-read";
import { buttonVariants, Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFrames } from "@/components/adcheck/frames";
import { OverlayChip, Player, type PlayerHandle } from "@/components/adcheck/player";
import { recutHref } from "@/lib/recut";
import { type AdDetail, type AdElement, type AdShot, ago, clock, leanWord, seconds, sentence, shotName, shotWords, territoryOfLabel, type Verdict, videoUrl } from "@/lib/ads";
import { cn } from "@/lib/utils";

const TERRITORY_WORD: Record<Territory, string> = { yours: "Leans your way", contested: "Shared", theirs: "Leans to a rival" };

/** R4: what the ad is, shot by shot, and X-Ray's read of it, with the reasons beside it. */
export function VerdictView({ orgId, base, ad, rivals, onRecut }: { orgId: string; base: string; ad: AdDetail; rivals: string[]; onRecut?: () => void }) {
  const recutState: RecutState = {
    href: ad.check?.recuts.length ? recutHref(base, ad.id) : null,
    writing: ad.stage === "writing re-cuts",
    onWrite: onRecut,
  };
  const player = useRef<PlayerHandle>(null);
  const [time, setTime] = useState(0);
  const duration = ad.durationMs ?? ad.shots.at(-1)?.endMs ?? 1;
  const src = ad.hasVideo ? videoUrl(orgId, ad.id) : null;
  const seek = (ms: number) => player.current?.seek(ms);
  const shotAt = (ms: number) => ad.shots.find((s) => ms >= s.startMs && ms < s.endMs) ?? ad.shots.at(-1);
  const current = shotAt(time);
  const verdict = ad.check?.verdict ?? null;

  const meta = [
    seconds(ad.durationMs),
    ad.shots.length ? `${ad.shots.length} shots` : null,
    rivals.length ? `Compared with ${rivals.length > 1 ? `${rivals.slice(0, -1).join(", ")} and ${rivals.at(-1)}` : rivals[0]}` : null,
    ad.readAt ? `Read ${ago(ad.readAt)}` : null,
  ].filter(Boolean);

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-5">
        <header>
          <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.03em] text-balance">{ad.title}</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground tabular-nums">{meta.join(" · ")}</p>
        </header>

        {/* Narrower than two columns, the read comes first: it's the answer. The reasons stay below. */}
        <div className="xl:hidden">
          <ReadCard verdict={verdict} base={base} recut={recutState} />
        </div>

        {src ? (
          <Player
            ref={player}
            src={src}
            onTime={setTime}
            label={() =>
              current ? (
                <OverlayChip>
                  Shot {current.index + 1} · {shotName(current)}
                </OverlayChip>
              ) : null
            }
          />
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed bg-muted/50 text-center">
            <VideoOffIcon className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            <p className="text-[14px] font-medium">The video was deleted</p>
            <p className="max-w-xs text-[13px] text-muted-foreground">Everything read from it is still here.</p>
          </div>
        )}

        {ad.shots.length > 0 && <ShotStrip shots={ad.shots} duration={duration} src={src} current={src ? current?.index : undefined} onSeek={seek} />}

        <WideOnly what="The ad timeline">
          <Timeline elements={ad.elements} duration={duration} time={src ? time : null} onSeek={src ? seek : undefined} />
        </WideOnly>
      </div>

      <aside className="min-w-0 space-y-4">
        <div className="hidden xl:block">
          <ReadCard verdict={verdict} base={base} recut={recutState} />
        </div>
        {verdict && <Reasons verdict={verdict} shots={ad.shots} onSeek={src ? seek : undefined} />}
      </aside>
    </div>
  );
}

/* --------------------------------------------------------- read card */

type RecutState = { href: string | null; writing: boolean; onWrite?: () => void };

function ReadCard({ verdict, base, recut }: { verdict: Verdict | null; base: string; recut: RecutState }) {
  const noMap = !verdict || verdict.headline.startsWith("Build your Culture Map");
  const lean = leanWord(verdict?.lean ?? null, verdict?.rival ?? null);
  return (
    <XRayRead
      compact
      aside={
        !noMap && (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-[12.5px] font-medium">
            {lean.glyph && <TerritoryGlyph kind={lean.glyph} decorative />}
            <span className="truncate">{lean.word}</span>
          </span>
        )
      }
      footer={
        noMap ? (
          <Link href={`${base}/map`} className={cn(buttonVariants({ size: "pill" }), "h-10 w-full")}>
            Go to Culture Map
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        ) : (
          recut.href ? (
            <Link href={recut.href} className={cn(buttonVariants(), "h-10 w-full rounded-full text-[14px] font-semibold")}>
              See the suggested re-cut
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          ) : recut.writing ? (
            <Button disabled className="h-10 w-full rounded-full text-[14px] font-semibold">
              <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
              Writing the re-cuts…
            </Button>
          ) : recut.onWrite ? (
            <Button onClick={recut.onWrite} className="h-10 w-full rounded-full text-[14px] font-semibold">
              Write a suggested re-cut
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          ) : null
        )
      }
    >
      <p>{noMap ? "Build your Culture Map to see whose culture this ad speaks to. The shots and words are already read." : verdict.headline}</p>
    </XRayRead>
  );
}

/* ------------------------------------------------------------ reasons */

function Reasons({ verdict, shots, onSeek }: { verdict: Verdict; shots: AdShot[]; onSeek?: (ms: number) => void }) {
  const pulls = [...verdict.theirs.map((i) => ({ ...i, kind: "theirs" as const })), ...verdict.shared.map((i) => ({ ...i, kind: "contested" as const }))];
  const rival = verdict.rival ?? verdict.theirs[0]?.rival ?? verdict.shared[0]?.rival ?? null;
  const go = (indexes: number[]) => {
    const first = shots.find((s) => s.index === Math.min(...indexes));
    if (first && onSeek) onSeek(first.startMs);
  };
  const Row = ({ kind, title, sub, at }: { kind: Territory; title: string; sub: string; at: number[] }) => {
    const body = (
      <>
        <TerritoryGlyph kind={kind} className="mt-[5px]" />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium">{sentence(title)}</span>
          <span className="mt-0.5 block text-[12.5px] text-muted-foreground">{sub}</span>
        </span>
      </>
    );
    const cls = "flex w-full items-start gap-3 px-4 py-3 text-left";
    return at.length && onSeek ? (
      <button type="button" onClick={() => go(at)} className={cn(cls, "transition-colors hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none")}>
        {body}
      </button>
    ) : (
      <div className={cls}>{body}</div>
    );
  };

  return (
    <>
      {pulls.length > 0 && (
        <Panel title={rival ? `What pulls it toward ${rival}` : "What pulls it away from you"}>
          <PanelRows>
            {pulls.map((p) => (
              <Row key={p.cue} kind={p.kind} title={p.cue} at={p.shots} sub={`${shotWords(p.shots)} · ${p.kind === "theirs" ? `leans toward ${p.rival}` : `shared with ${p.rival}`}`} />
            ))}
          </PanelRows>
        </Panel>
      )}
      {verdict.yours.length > 0 && (
        <Panel title="Already yours">
          <PanelRows>
            {verdict.yours.map((p) => (
              <Row key={p.cue} kind="yours" title={p.cue} at={p.shots} sub={`${shotWords(p.shots)} · leans your way`} />
            ))}
          </PanelRows>
        </Panel>
      )}
      {verdict.references.length > 0 && (
        <Panel title="Named in the ad">
          <PanelRows>
            {verdict.references.map((r) => (
              <div key={r.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="flex min-w-0 items-center gap-2 text-[13.5px]">
                  <QuoteIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{r.name}</span>
                </span>
                <span className="shrink-0 text-[12.5px] text-muted-foreground">{sentence(r.says)}</span>
              </div>
            ))}
          </PanelRows>
        </Panel>
      )}
      {verdict.reshoot.length > 0 && (
        <section className="flex gap-3 rounded-[14px] border bg-muted/60 p-4">
          <ClapperboardIcon className="mt-0.5 size-4 shrink-0 text-foreground/80" aria-hidden />
          <div className="min-w-0">
            <h3 className="text-[13.5px] font-semibold">What to change</h3>
            <ul className="mt-1.5 space-y-1 text-[13px] leading-relaxed text-muted-foreground">
              {verdict.reshoot.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
      {verdict.notes.length > 0 && (
        <ul className="space-y-1.5 px-1">
          {verdict.notes.map((n) => (
            <li key={n} className="flex gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
              <InfoIcon className="mt-[3px] size-3.5 shrink-0" aria-hidden />
              {n}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ---------------------------------------------------------- shot strip */

function ShotStrip({ shots, duration, src, current, onSeek }: { shots: AdShot[]; duration: number; src: string | null; current?: number; onSeek: (ms: number) => void }) {
  const times = useMemo(() => shots.map((s) => s.startMs + Math.min(400, (s.endMs - s.startMs) / 2)), [shots]);
  const frames = useFrames(src, times, 200);
  return (
    <div className="space-y-2.5">
      <div className="flex gap-[3px]" role="list" aria-label="Shots">
        {shots.map((s, i) => {
          const kind = territoryOfLabel(s.territory);
          return (
            <Tooltip key={s.index}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    role="listitem"
                    onClick={() => onSeek(s.startMs)}
                    disabled={!src}
                    aria-label={`Shot ${s.index + 1}: ${shotName(s)}${kind ? `, ${TERRITORY_WORD[kind].toLowerCase()}` : ""}`}
                    className={cn(
                      "relative h-[52px] min-w-2 overflow-hidden rounded-[8px] bg-muted outline-none transition-[box-shadow,opacity] focus-visible:ring-3 focus-visible:ring-ring/50",
                      current === s.index ? "ring-2 ring-ember ring-offset-1 ring-offset-background" : "hover:opacity-85",
                    )}
                    style={{ flexGrow: (s.endMs - s.startMs) / duration, flexBasis: 0 }}
                  />
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a frame drawn in the browser */}
                {frames[i] && <img src={frames[i]!} alt="" className="absolute inset-0 size-full animate-[rise_400ms_ease-out_both] object-cover" />}
                {kind && (s.endMs - s.startMs) / duration > 0.04 && (
                  <span className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                    <TerritoryGlyph kind={kind} decorative className="size-[9px]" />
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent>
                Shot {s.index + 1} · {shotName(s)}
                {kind ? ` · ${TERRITORY_WORD[kind]}` : ""}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-[18px] gap-y-1 text-[12.5px]">
        {(["theirs", "contested", "yours"] as const).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-foreground/80">
            <TerritoryGlyph kind={k} decorative />
            {TERRITORY_WORD[k]}
          </span>
        ))}
        <span className="ml-auto text-faint tabular-nums">
          {shots.length} shots · {seconds(duration)}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ timeline */

const TRACKS = [
  { label: "Text", kinds: ["ONSCREEN_TEXT"] },
  { label: "Script", kinds: ["SCRIPT"] },
  { label: "Sound", kinds: ["SOUND"] },
] as const;

/**
 * Where each block sits: short or instant events get a readable minimum length, blocks stay inside
 * the track, and overlapping ones go on separate lanes so nothing hides behind anything else.
 */
function lanes(items: AdElement[], duration: number) {
  const min = Math.max(600, duration * 0.14);
  const ends: number[] = [];
  return items
    .toSorted((a, b) => a.startMs - b.startMs)
    .map((el) => {
      const length = Math.min(duration, Math.max(el.endMs - el.startMs, min));
      const start = Math.min(el.startMs, duration - length);
      let lane = ends.findIndex((end) => end <= start);
      if (lane < 0) lane = ends.push(0) - 1;
      ends[lane] = start + length;
      return { el, lane, start, length };
    });
}

function Timeline({ elements, duration, time, onSeek }: { elements: AdElement[]; duration: number; time: number | null; onSeek?: (ms: number) => void }) {
  const step = duration > 40_000 ? 10_000 : 5_000;
  const ticks = Array.from({ length: Math.floor(duration / step) + 1 }, (_, i) => i * step);
  const pct = (ms: number) => `${Math.min(100, Math.max(0, (ms / duration) * 100))}%`;

  return (
    <section className="rounded-[14px] border bg-card px-4 py-4" aria-label="What the ad shows and says, over time">
      <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-2.5">
        <span />
        <div className="relative h-4 font-mono text-[10.5px] text-faint">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2 first:translate-x-0" style={{ left: pct(t) }}>
              {clock(t)}
            </span>
          ))}
        </div>

        {TRACKS.map((track) => {
          const placed = lanes(elements.filter((e) => (track.kinds as readonly string[]).includes(e.kind)), duration);
          const count = Math.max(1, ...placed.map((p) => p.lane + 1));
          return (
            <div key={track.label} className="contents">
              <span className="pt-[5px] text-[12.5px] text-muted-foreground">{track.label}</span>
              <div className="relative" style={{ height: count * 30 - 4 }}>
                {placed.length === 0 && <span className="absolute inset-y-0 left-0 flex items-center text-[12px] text-faint">Nothing {track.label === "Sound" ? "heard" : "found"}</span>}
                {placed.map(({ el, lane, start, length }) => {
                  const text = el.kind === "SCRIPT" ? `“${el.raw}”` : el.kind === "SOUND" && el.detail?.music ? `${sentence(el.raw)}${el.detail.mood ? ` · ${el.detail.mood}` : ""}` : el.raw;
                  return (
                    <Tooltip key={el.id}>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            onClick={() => onSeek?.(el.startMs)}
                            disabled={!onSeek}
                            className="absolute flex h-[26px] min-w-[26px] items-center overflow-hidden rounded-[7px] border bg-card px-2 text-left text-[11.5px] text-foreground/80 transition-colors outline-none hover:border-foreground/30 hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
                            style={{ left: pct(start), width: `calc(${pct(length)} - 2px)`, top: lane * 30 }}
                          />
                        }
                      >
                        <span className="truncate">{text}</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        {clock(el.startMs)}
                        {el.endMs > el.startMs + 999 ? `–${clock(el.endMs)}` : ""} · {text}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {time !== null && <span className="pointer-events-none absolute -inset-y-1.5 w-px bg-ember" style={{ left: pct(time) }} aria-hidden />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
