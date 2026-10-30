"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDownIcon, ArrowLeftIcon, ArrowLeftRightIcon, ArrowUpIcon, CropIcon, DownloadIcon, FilmIcon, LoaderCircleIcon, PlusIcon, Redo2Icon, ScanSearchIcon, TextCursorInputIcon, Trash2Icon, Undo2Icon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { TerritoryGlyph } from "@/components/app/parts";
import { EditPlayer, type EditPlayerHandle } from "@/components/adcheck/edit-player";
import { ExportDialog } from "@/components/adcheck/export-dialog";
import { useFrames } from "@/components/adcheck/frames";
import { Segmented } from "@/components/forms/fields";
import { type Crumb, PageBody, TopBar } from "@/components/shell/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { type AdDetail, type AdShot, clock, seconds, shotName, videoUrl } from "@/lib/ads";
import { AppError } from "@/lib/errors";
import { type Cut, type Format, MIN_CLIP, playable, type Position, recutHref, versionHref, versionsApi } from "@/lib/recut";
import { cn } from "@/lib/utils";

type History = { past: Cut[]; now: Cut; next: Cut[] };
const GLYPH = { YOURS: "yours", CONTESTED: "contested", THEIRS: "theirs" } as const;
const LEAN = { YOURS: "Leans your way", CONTESTED: "Shared with a rival", THEIRS: "Leans to a rival" } as const;
const ASPECT: Record<Format, number> = { "9:16": 9 / 16, "16:9": 16 / 9, "1:1": 1 };

/**
 * R6 · Tweak (Figma 11): a focused editor for one version, not a full video editor. The preview plays
 * the draft by the edit list in the chosen shape; the shot strip picks, reorders and drops; the
 * inspector trims, captions and crops the selected shot. Undo and redo cover everything. "Check again"
 * saves it and reads where it now lands (R7); "Export versions" makes the files (R8).
 */
export function TweakView({ orgId, base, trail = [], ad, brand, start, from, title }: { orgId: string; base: string; trail?: Crumb[]; ad: AdDetail; brand: string; start: Cut; from: string | null; title: string }) {
  const router = useRouter();
  const [h, setH] = useState<History>({ past: [], now: start, next: [] });
  const [sel, setSel] = useState(0);
  const [time, setTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const player = useRef<EditPlayerHandle>(null);
  const cut = h.now;
  const play = playable(cut, brand);
  const src = ad.hasVideo ? videoUrl(orgId, ad.id) : null;
  const clip = cut.clips[Math.min(sel, cut.clips.length - 1)]!;
  const shot = ad.shots.find((s) => s.index === clip.shot)!;
  const sourceAspect = ad.width && ad.height ? ad.width / ad.height : 16 / 9;
  // Which way the frame is cropped in this shape: a narrower shape crops the sides, a wider one the top and bottom.
  const cropAxis = Math.abs(ASPECT[cut.format] - sourceAspect) < 0.02 ? null : ASPECT[cut.format] < sourceAspect ? "x" : "y";

  const change = (next: Cut | ((c: Cut) => Cut)) => setH((x) => ({ past: [...x.past.slice(-49), x.now], now: typeof next === "function" ? next(x.now) : next, next: [] }));
  const editClip = (patch: Partial<Cut["clips"][number]>) => change((c) => ({ ...c, clips: c.clips.map((k, i) => (i === sel ? { ...k, ...patch } : k)) }));
  const undo = () => setH((x) => (x.past.length ? { past: x.past.slice(0, -1), now: x.past.at(-1)!, next: [x.now, ...x.next] } : x));
  const redo = () => setH((x) => (x.next.length ? { past: [...x.past, x.now], now: x.next[0]!, next: x.next.slice(1) } : x));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= cut.clips.length || from === to) return;
    change((c) => {
      const clips = c.clips.slice();
      const [k] = clips.splice(from, 1);
      clips.splice(to, 0, k!);
      return { ...c, clips };
    });
    setSel(to);
  };
  const remove = () => {
    if (cut.clips.length < 2) return toast("Keep at least one shot.");
    change((c) => ({ ...c, clips: c.clips.filter((_, i) => i !== sel) }));
    setSel((s) => Math.max(0, s - 1));
  };
  const add = (s: AdShot) => {
    change((c) => ({ ...c, clips: [...c.clips.slice(0, sel + 1), { shot: s.index, inMs: s.startMs, outMs: s.endMs }, ...c.clips.slice(sel + 1)] }));
    setSel(sel + 1);
  };
  const swap = (s: AdShot) => editClip({ shot: s.index, inMs: s.startMs, outMs: s.endMs, cropX: undefined, cropY: undefined });

  // ⌘Z / ⇧⌘Z, as anywhere else.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z" || (e.target as HTMLElement).closest("input, textarea")) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function checkAgain() {
    setSaving(true);
    try {
      const { version } = await versionsApi.save(orgId, ad.id, { ...cut, title, from });
      router.push(versionHref(base, ad.id, version.id) as never);
    } catch (error) {
      toast(error instanceof AppError ? error.message : "We couldn’t check this version. Try again.");
      setSaving(false);
    }
  }

  const unused = ad.shots.filter((s) => !cut.clips.some((c) => c.shot === s.index));
  const starts = cut.clips.reduce<number[]>((a, c, i) => [...a, i ? a[i - 1]! + (cut.clips[i - 1]!.outMs - cut.clips[i - 1]!.inMs) : 0], []);
  const lenMs = clip.outMs - clip.inMs;

  return (
    <>
      <TopBar
        crumbs={[...trail, { label: "Ad check", href: `${base}/ad-check` }, { label: ad.fileName ?? ad.title, href: `${base}/ad-check/${ad.id}` }, { label: "Re-cut", href: recutHref(base, ad.id) }, { label: "Tweak" }]}
        actions={
          <>
            <Button variant="ghost" size="icon-sm" aria-label="Undo" disabled={!h.past.length} onClick={undo}>
              <Undo2Icon />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Redo" disabled={!h.next.length} onClick={redo}>
              <Redo2Icon />
            </Button>
            <Button variant="outline" size="pill" onClick={() => void checkAgain()} disabled={saving}>
              {saving ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : <ScanSearchIcon data-icon="inline-start" />}
              Check again
            </Button>
            <Button size="pill" onClick={() => setExporting(true)} disabled={!src}>
              <DownloadIcon data-icon="inline-start" />
              <span className="hidden sm:inline">Export versions</span>
            </Button>
          </>
        }
      />
      <PageBody>
        <div className="mx-auto max-w-[1180px] space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link href={recutHref(base, ad.id)} className="mb-2 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
                <ArrowLeftIcon className="size-3.5" aria-hidden />
                Back to the suggestions
              </Link>
              <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.03em]">Tweak your version</h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground tabular-nums">
                From {ad.title} · {seconds(play.durationMs)} · {cut.clips.length} {cut.clips.length === 1 ? "shot" : "shots"} · Nothing new filmed
              </p>
            </div>
            <Segmented<Format>
              label="Shape"
              value={cut.format}
              onChange={(format) => change((c) => ({ ...c, format }))}
              options={[
                { value: "9:16", label: "9:16" },
                { value: "16:9", label: "16:9" },
                { value: "1:1", label: "1:1" },
              ]}
            />
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <section aria-label="Preview" className="flex min-w-0 flex-col items-center justify-center rounded-[16px] bg-[#18181b] p-4 dark:bg-black">
              {src ? (
                <EditPlayer
                  ref={player}
                  src={src}
                  clips={play.clips}
                  overlays={play.overlays}
                  durationMs={play.durationMs}
                  format={cut.format}
                  silent={cut.sound === "mute"}
                  onTime={(ms) => setTime(ms)}
                  className={cn("@container max-h-[520px] w-full", cut.format === "9:16" ? "max-w-[292px]" : cut.format === "1:1" ? "max-w-[460px]" : "max-w-[720px]")}
                />
              ) : (
                <p className="py-16 text-center text-[13.5px] text-white/70">The video was deleted, so this version can’t be previewed or exported.</p>
              )}
            </section>

            <section aria-label="The selected shot" className="min-w-0 overflow-hidden rounded-[14px] border bg-card">
              <header className="flex items-center justify-between gap-3 border-b bg-muted/50 px-4 py-3">
                <h2 className="truncate text-[13.5px] font-semibold">
                  Shot {shot.index + 1} · {shotName(shot)}
                </h2>
                <span className="shrink-0 font-mono text-[12.5px] text-muted-foreground tabular-nums">
                  {clock(clip.inMs)} – {clock(clip.outMs)}
                </span>
              </header>
              <div className="space-y-5 p-4">
                {shot.territory && (
                  <p className="flex items-center gap-2 rounded-[10px] border bg-muted/50 px-3 py-2.5 text-[13px]">
                    <TerritoryGlyph kind={GLYPH[shot.territory]} decorative />
                    {LEAN[shot.territory]}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-[12.5px] text-muted-foreground">
                    <span>Keep from this shot</span>
                    <span className="tabular-nums">{seconds(lenMs)} of {seconds(shot.endMs - shot.startMs)}</span>
                  </div>
                  <Range label="Start" min={shot.startMs} max={shot.endMs} value={clip.inMs} onChange={(v) => editClip({ inMs: Math.min(v, clip.outMs - MIN_CLIP) })} />
                  <Range label="End" min={shot.startMs} max={shot.endMs} value={clip.outMs} onChange={(v) => editClip({ outMs: Math.max(v, clip.inMs + MIN_CLIP) })} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="caption" className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                    <TextCursorInputIcon className="size-3.5" aria-hidden /> Caption on this shot
                  </label>
                  <Input
                    id="caption"
                    value={clip.caption?.text ?? ""}
                    maxLength={80}
                    placeholder="A few words, in your voice"
                    onChange={(e) => editClip({ caption: e.target.value ? { text: e.target.value, position: clip.caption?.position ?? "bottom" } : undefined })}
                  />
                  {clip.caption && (
                    <Segmented<Position>
                      label="Caption position"
                      value={clip.caption.position}
                      onChange={(position) => editClip({ caption: { ...clip.caption!, position } })}
                      options={[
                        { value: "top", label: "Top" },
                        { value: "middle", label: "Middle" },
                        { value: "bottom", label: "Bottom" },
                      ]}
                    />
                  )}
                </div>

                {cropAxis && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                      <CropIcon className="size-3.5" aria-hidden /> Frame for {cut.format}: {cropAxis === "x" ? "slide left or right" : "slide up or down"}
                    </p>
                    <Range
                      label={cropAxis === "x" ? "Left to right" : "Top to bottom"}
                      min={0}
                      max={100}
                      value={Math.round(((cropAxis === "x" ? clip.cropX : clip.cropY) ?? 0.5) * 100)}
                      onChange={(v) => editClip(cropAxis === "x" ? { cropX: v / 100 } : { cropY: v / 100 })}
                      words={(v) => (v < 35 ? (cropAxis === "x" ? "Left" : "Top") : v > 65 ? (cropAxis === "x" ? "Right" : "Bottom") : "Centre")}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2 border-t pt-4">
                  <Button variant="outline" size="pill" aria-label="Move earlier" disabled={sel === 0} onClick={() => move(sel, sel - 1)}>
                    <ArrowUpIcon data-icon="inline-start" />
                    Earlier
                  </Button>
                  <Button variant="outline" size="pill" aria-label="Move later" disabled={sel === cut.clips.length - 1} onClick={() => move(sel, sel + 1)}>
                    <ArrowDownIcon data-icon="inline-start" />
                    Later
                  </Button>
                  <ShotMenu label="Swap" icon={<ArrowLeftRightIcon data-icon="inline-start" />} shots={ad.shots.filter((s) => s.index !== clip.shot)} onPick={swap} />
                  <Button variant="outline" size="pill" onClick={remove}>
                    <Trash2Icon data-icon="inline-start" />
                    Remove
                  </Button>
                </div>
              </div>
            </section>
          </div>

          <Timeline
            src={src}
            shots={ad.shots}
            cut={cut}
            starts={starts}
            total={play.durationMs}
            time={time}
            sel={sel}
            onSelect={(i) => {
              setSel(i);
              player.current?.seek(starts[i]! + 1);
            }}
            onMove={move}
            extra={unused.length ? <ShotMenu label="Add a shot" icon={<PlusIcon data-icon="inline-start" />} shots={unused} onPick={add} /> : null}
          />

          <section aria-label="The whole ad" className="grid gap-4 rounded-[14px] border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-2">
              <label htmlFor="endcard" className="text-[12.5px] text-muted-foreground">
                End card · shown over the last 3 seconds with {brand}’s name
              </label>
              <Input id="endcard" value={cut.endCard ?? ""} maxLength={80} placeholder="e.g. Fresh every morning, from 7am" onChange={(e) => change((c) => ({ ...c, endCard: e.target.value || null }))} />
            </div>
            <div className="space-y-2">
              <p className="text-[12.5px] text-muted-foreground">Sound</p>
              <Segmented<"original" | "mute">
                label="Sound"
                value={cut.sound}
                onChange={(sound) => change((c) => ({ ...c, sound }))}
                options={[
                  { value: "original", label: "Original" },
                  { value: "mute", label: "Off" },
                ]}
              />
            </div>
          </section>
        </div>
      </PageBody>

      {src && <ExportDialog open={exporting} onOpenChange={setExporting} src={src} cut={cut} brand={brand} title={title} placements={ad.placements} />}
    </>
  );
}

function Range({ label, min, max, value, onChange, words }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void; words?: (v: number) => string }) {
  return (
    <label className="flex items-center gap-3 text-[12.5px]">
      <span className="w-[86px] shrink-0 text-muted-foreground">{label}</span>
      <input type="range" min={min} max={max} step={words ? 1 : 100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-1.5 flex-1 cursor-pointer accent-[var(--ember)]" />
      <span className="w-[52px] shrink-0 text-right font-mono tabular-nums">{words ? words(value) : clock(value)}</span>
    </label>
  );
}

function ShotMenu({ label, icon, shots, onPick }: { label: string; icon: React.ReactNode; shots: AdShot[]; onPick: (s: AdShot) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="pill" disabled={!shots.length} />}>
        {icon}
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[320px] w-[280px] overflow-y-auto">
        {shots.map((s) => (
          <DropdownMenuItem key={s.index} onClick={() => onPick(s)} className="items-start gap-2">
            {s.territory ? <TerritoryGlyph kind={GLYPH[s.territory]} decorative className="mt-1" /> : <FilmIcon className="mt-0.5 size-3.5 text-muted-foreground" />}
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium">
                Shot {s.index + 1} · {shotName(s)}
              </span>
              <span className="block text-[12px] text-muted-foreground tabular-nums">{seconds(s.endMs - s.startMs)}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The cut as a strip of shots (drag to reorder), its captions and sound underneath, and the playhead. */
function Timeline({ src, shots, cut, starts, total, time, sel, onSelect, onMove, extra }: { src: string | null; shots: AdShot[]; cut: Cut; starts: number[]; total: number; time: number; sel: number; onSelect: (i: number) => void; onMove: (from: number, to: number) => void; extra: React.ReactNode }) {
  const frames = useFrames(src, cut.clips.map((c) => c.inMs + Math.min(400, (c.outMs - c.inMs) / 2)), 200);
  const drag = useRef<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const pct = (ms: number) => `${(ms / Math.max(1, total)) * 100}%`;
  return (
    <section aria-label="Timeline" className="space-y-3 rounded-[14px] border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] text-muted-foreground">Click a shot to edit it · drag to reorder</p>
        {extra}
      </div>
      <Lane icon={<FilmIcon className="size-3.5" />} label="Shots">
        <div className="relative flex gap-[3px]">
          {cut.clips.map((c, i) => {
            const s = shots.find((x) => x.index === c.shot)!;
            return (
              <button
                key={`${c.shot}-${i}`}
                type="button"
                draggable
                onDragStart={() => (drag.current = i)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(i);
                }}
                onDragLeave={() => setOver(null)}
                onDrop={() => {
                  if (drag.current !== null) onMove(drag.current, i);
                  drag.current = null;
                  setOver(null);
                }}
                onClick={() => onSelect(i)}
                title={`Shot ${s.index + 1} · ${shotName(s)}`}
                aria-pressed={i === sel}
                className={cn("relative h-[54px] min-w-3 overflow-hidden rounded-[8px] bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50", i === sel && "ring-2 ring-ember", over === i && "opacity-60")}
                style={{ flexGrow: c.outMs - c.inMs, flexBasis: 0 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a frame drawn in the browser */}
                {frames[i] && <img src={frames[i]!} alt="" className="absolute inset-0 size-full object-cover" draggable={false} />}
                <span className="absolute top-1 left-1 rounded-full bg-black/60 px-1.5 text-[10.5px] text-white tabular-nums">{s.index + 1}</span>
              </button>
            );
          })}
          <span aria-hidden className="pointer-events-none absolute -top-1.5 -bottom-1.5 w-0.5 rounded-full bg-ember" style={{ left: pct(time) }} />
        </div>
      </Lane>
      <Lane icon={<TextCursorInputIcon className="size-3.5" />} label="Text">
        <div className="relative h-7">
          {cut.clips.map((c, i) =>
            c.caption?.text ? (
              <span key={i} className={cn("absolute top-0 flex h-7 items-center truncate rounded-[6px] border px-2 text-[11.5px]", i === sel ? "border-ember bg-ember-soft" : "bg-card")} style={{ left: pct(starts[i]!), width: pct(c.outMs - c.inMs) }}>
                {c.caption.text}
              </span>
            ) : null,
          )}
          {cut.endCard && (
            <span className="absolute top-0 flex h-7 items-center truncate rounded-[6px] border bg-muted px-2 text-[11.5px]" style={{ left: pct(Math.max(0, total - 3000)), width: pct(Math.min(3000, total)) }}>
              End card
            </span>
          )}
        </div>
      </Lane>
      <Lane icon={cut.sound === "mute" ? <VolumeXIcon className="size-3.5" /> : <Volume2Icon className="size-3.5" />} label="Sound">
        <div className={cn("flex h-7 items-center rounded-[6px] border bg-muted/60 px-2 text-[11.5px] text-muted-foreground", cut.sound === "mute" && "border-dashed")}>{cut.sound === "mute" ? "Off" : "The draft’s own sound, cut with the shots"}</div>
      </Lane>
    </section>
  );
}

function Lane({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3">
      <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}
