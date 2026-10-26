"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeftIcon, ClapperboardIcon, DownloadIcon, PlayIcon, ScissorsIcon, XIcon } from "lucide-react";
import { Evidence, Panel, PanelRows, TerritoryGlyph } from "@/components/app/parts";
import { XRayRead } from "@/components/app/xray-read";
import { EditPlayer, type EditPlayerHandle } from "@/components/adcheck/edit-player";
import { useFrames } from "@/components/adcheck/frames";
import { Player, type PlayerHandle } from "@/components/adcheck/player";
import { Segmented } from "@/components/forms/fields";
import { type Crumb, PageBody, TopBar } from "@/components/shell/top-bar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { type AdDetail, type AdShot, leanWord, seconds, shotName, videoUrl } from "@/lib/ads";
import { applyChanges, type Clip, type EditChange, KIND_LABEL, proofWords, type RecutKind } from "@/lib/recut";
import { cn } from "@/lib/utils";

/**
 * R5: the suggested re-cut beside the draft. Same footage, reordered, trimmed and captioned; every
 * change has its reason and evidence and can be switched off, and the preview follows at once.
 */
export function RecutView({ orgId, base, trail = [], ad, brand, rivals }: { orgId: string; base: string; trail?: Crumb[]; ad: AdDetail; brand: string; rivals: string[] }) {
  const recuts = ad.check?.recuts ?? [];
  const [kind, setKind] = useState<RecutKind>(recuts[0]?.kind ?? "RECOMMENDED");
  const recut = recuts.find((r) => r.kind === kind) ?? recuts[0]!;
  // Switches are kept per kind, so moving between tabs doesn't lose them.
  const [switches, setSwitches] = useState<Record<string, Record<string, boolean>>>({});
  const changes: EditChange[] = recut.editList.changes.map((c) => ({ ...c, on: switches[recut.kind]?.[c.id] ?? c.on }));
  const edit = applyChanges(ad.shots, changes, brand);
  const offCount = changes.filter((c) => !c.on).length;
  const draftPlayer = useRef<PlayerHandle>(null);
  const recutPlayer = useRef<EditPlayerHandle>(null);
  const src = ad.hasVideo ? videoUrl(orgId, ad.id) : null;
  const draftLean = leanWord(ad.check?.verdict.lean ?? null, ad.check?.verdict.rival ?? null);
  const cutLean = leanWord(recut.verdict.lean, recut.verdict.rival);
  const dropped = new Set(ad.shots.filter((s) => !edit.clips.some((c) => c.shot === s.index)).map((s) => s.index));
  const moved = edit.clips.filter((c) => c.moved).length;
  const duration = ad.durationMs ?? 1;

  return (
    <>
      <TopBar
        crumbs={[...trail, { label: "Ad check", href: `${base}/ad-check` }, { label: ad.fileName ?? ad.title, href: `${base}/ad-check/${ad.id}` }, { label: "Re-cut" }]}
        actions={
          <>
            <Button variant="outline" size="pill" className="hidden sm:inline-flex" onClick={() => toast("Tweaking a re-cut is coming next.", { description: "For now, switch changes on and off; the preview follows." })}>
              <ScissorsIcon data-icon="inline-start" />
              Tweak it
            </Button>
            <Button size="pill" onClick={() => toast("Exporting versions is coming next.", { description: "You’ll get each size your placements need, made on your computer." })}>
              <DownloadIcon data-icon="inline-start" />
              Export versions
            </Button>
          </>
        }
      />
      <PageBody>
        <div className="mx-auto max-w-[1180px] space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <Link href={`${base}/ad-check/${ad.id}`} className="mb-2 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
                <ArrowLeftIcon className="size-3.5" aria-hidden />
                Back to the read
              </Link>
              <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.03em]">Suggested re-cut</h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground tabular-nums">
                From {ad.title} · {seconds(edit.durationMs)} · {edit.clips.length} {edit.clips.length === 1 ? "shot" : "shots"} · Nothing new filmed
              </p>
            </div>
            {recuts.length > 1 && (
              <Segmented label="Which re-cut" value={recut.kind} onChange={setKind} options={recuts.map((r) => ({ value: r.kind, label: KIND_LABEL[r.kind] }))} className="max-w-full overflow-x-auto [&_button]:whitespace-nowrap" />
            )}
          </header>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-5">
              {src ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Side label={`Your draft · ${seconds(duration)}`} lean={draftLean}>
                      <Player ref={draftPlayer} src={src} rounded="rounded-[14px]" />
                    </Side>
                    <Side label={`${recut.editList.title} · ${seconds(edit.durationMs)}`} lean={cutLean}>
                      <EditPlayer ref={recutPlayer} src={src} clips={edit.clips} overlays={edit.overlays} durationMs={edit.durationMs} className="@container" />
                    </Side>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      className="size-11 rounded-full"
                      aria-label="Play both together"
                      onClick={() => {
                        draftPlayer.current?.seek(0, true);
                        recutPlayer.current?.play(0);
                      }}
                    >
                      <PlayIcon className="fill-current" />
                    </Button>
                    <p className="text-[13.5px] font-medium">Play both together</p>
                  </div>
                </>
              ) : (
                <p className="rounded-[14px] border border-dashed bg-muted/50 px-5 py-8 text-center text-[13.5px] text-muted-foreground">The video was deleted, so the re-cut can’t be played. Its changes are still listed.</p>
              )}

              <Strip
                title={`Your draft · ${ad.shots.length} shots`}
                note={dropped.size ? `${dropped.size} cut` : "Nothing cut"}
                shots={ad.shots}
                pieces={ad.shots.map((s) => ({ shot: s, ms: s.endMs - s.startMs, cut: dropped.has(s.index), moved: false }))}
                total={duration}
                src={src}
              />
              <Strip
                title={`Re-cut · ${edit.clips.length} shots`}
                note={moved ? `${moved} moved, nothing new filmed` : "Nothing new filmed"}
                shots={ad.shots}
                pieces={edit.clips.map((c: Clip) => ({ shot: ad.shots.find((s) => s.index === c.shot)!, ms: c.outMs - c.inMs, cut: false, moved: c.moved }))}
                total={duration}
                src={src}
              />

              {recut.editList.newFootage && (
                <section className="flex gap-3 rounded-[14px] border bg-muted/60 p-4">
                  <ClapperboardIcon className="mt-0.5 size-4 shrink-0 text-foreground/80" aria-hidden />
                  <div>
                    <h2 className="text-[13.5px] font-semibold">One fix needs new footage</h2>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{recut.editList.newFootage}</p>
                  </div>
                </section>
              )}
            </div>

            <aside className="min-w-0 space-y-4">
              <XRayRead
                compact
                aside={
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-[12.5px] font-medium">
                    {cutLean.glyph && <TerritoryGlyph kind={cutLean.glyph} decorative />}
                    <span className="truncate">{cutLean.word}</span>
                  </span>
                }
              >
                <p>{recut.editList.summary}</p>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  {offCount
                    ? `You’ve switched off ${offCount} ${offCount === 1 ? "change" : "changes"}. Where this version lands is updated when “Check again” arrives.`
                    : "Switch off any change below; the preview updates straight away."}
                </p>
              </XRayRead>

              <Panel title="What changed" action={`${changes.length} ${changes.length === 1 ? "change" : "changes"}`}>
                <PanelRows>
                  {changes.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-start gap-3 px-4 py-3.5">
                      <Switch
                        checked={c.on}
                        onCheckedChange={(on) => setSwitches((s) => ({ ...s, [recut.kind]: { ...s[recut.kind], [c.id]: on } }))}
                        className="mt-0.5"
                        aria-label={c.what}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-[14px] font-medium", !c.on && "text-muted-foreground")}>
                          {c.what}
                          {c.text && c.op === "caption" ? <span className="font-normal text-muted-foreground"> · “{c.text}”</span> : null}
                        </span>
                        <span className="mt-1 block text-[12.5px] leading-relaxed text-muted-foreground">{c.on ? c.why : `Off: ${c.why.charAt(0).toLowerCase()}${c.why.slice(1)}`}</span>
                        {c.evidence && (
                          // Reading the evidence shouldn't flip the change: the row is a label for its switch.
                          <span className="mt-2 flex" onClick={(e) => e.preventDefault()}>
                            <Evidence always tip={proofWords(c, brand, rivals)}>
                              {c.evidence}
                            </Evidence>
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </PanelRows>
              </Panel>
            </aside>
          </div>
        </div>
      </PageBody>
    </>
  );
}

function Side({ label, lean, children }: { label: string; lean: ReturnType<typeof leanWord>; children: React.ReactNode }) {
  return (
    <section className="min-w-0 space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="truncate text-[13.5px] font-semibold">{label}</h2>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[12.5px]">
          {lean.glyph && <TerritoryGlyph kind={lean.glyph} decorative />}
          {lean.word}
        </span>
      </div>
      {children}
    </section>
  );
}

/** A row of shot stills, each as wide as it is long, measured against the draft. */
function Strip({ title, note, pieces, total, src }: { title: string; note: string; shots: AdShot[]; pieces: { shot: AdShot; ms: number; cut: boolean; moved: boolean }[]; total: number; src: string | null }) {
  const frames = useFrames(src, pieces.map((p) => p.shot.startMs + Math.min(400, (p.shot.endMs - p.shot.startMs) / 2)), 200);
  const used = pieces.reduce((n, p) => n + p.ms, 0);
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-3 text-[12.5px] text-muted-foreground">
        <span>{title}</span>
        <span>{note}</span>
      </div>
      <div className="flex gap-[3px]" style={{ width: `${Math.min(100, (used / total) * 100)}%` }}>
        {pieces.map((p, i) => (
          <div
            key={`${p.shot.index}-${i}`}
            title={`Shot ${p.shot.index + 1} · ${shotName(p.shot)}`}
            className={cn("relative h-[52px] min-w-2 overflow-hidden rounded-[8px] bg-muted", p.cut && "opacity-45")}
            style={{ flexGrow: p.ms, flexBasis: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a frame drawn in the browser */}
            {frames[i] && <img src={frames[i]!} alt="" className="absolute inset-0 size-full object-cover" />}
            {p.cut && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
                <XIcon className="size-4" strokeWidth={2.5} aria-label="Cut" />
              </span>
            )}
            {p.moved && <span className="absolute top-1.5 left-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10.5px] text-white">moved</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
