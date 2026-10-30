"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon, DownloadIcon, ScissorsIcon } from "lucide-react";
import { TerritoryGlyph } from "@/components/app/parts";
import { XRayRead } from "@/components/app/xray-read";
import { EditPlayer } from "@/components/adcheck/edit-player";
import { ExportDialog } from "@/components/adcheck/export-dialog";
import { Player } from "@/components/adcheck/player";
import { type Crumb, PageBody, TopBar } from "@/components/shell/top-bar";
import { Button, buttonVariants } from "@/components/ui/button";
import { type AdDetail, ago, leanWord, seconds, type Verdict, videoUrl } from "@/lib/ads";
import { cutOf, playable, recutHref, type SavedVersion, tweakHref } from "@/lib/recut";
import { cn } from "@/lib/utils";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The few things that decide where a cut lands, in words: what's yours, shared and a rival's. */
function reasons(v: Verdict) {
  return [
    ...v.theirs.slice(0, 2).map((t) => ({ glyph: "theirs" as const, text: `${cap(t.cue)} · leans to ${t.rival}` })),
    ...v.yours.slice(0, 3).map((y) => ({ glyph: "yours" as const, text: `${cap(y.cue)} · yours` })),
    ...v.shared.slice(0, 2).map((s) => ({ glyph: "contested" as const, text: `${cap(s.cue)} · shared with ${s.rival}` })),
  ].slice(0, 5);
}

/** What moved between the draft's read and this version's: gained, lost, still a rival's. */
function difference(before: Verdict, after: Verdict) {
  const has = (list: { cue: string }[], cue: string) => list.some((x) => x.cue.toLowerCase() === cue.toLowerCase());
  const lostTheirs = before.theirs.filter((t) => !has(after.theirs, t.cue));
  const stillTheirs = after.theirs;
  const newYours = after.yours.filter((y) => !has(before.yours, y.cue));
  const lostYours = before.yours.filter((y) => !has(after.yours, y.cue));
  return { lostTheirs, stillTheirs, newYours, lostYours };
}

/**
 * R7 · Check again (Figma 11): a saved version next to the draft. Where each lands comes from the same
 * Qloo evidence as the read (each kept shot's cues, plus any new caption words placed on the map), so
 * nothing here is guessed. The next step is X-Ray's read; tweaking or exporting is one click away.
 */
export function CheckView({ orgId, base, trail = [], ad, brand, version }: { orgId: string; base: string; trail?: Crumb[]; ad: AdDetail; brand: string; version: SavedVersion }) {
  const [exporting, setExporting] = useState(false);
  const draft = ad.check!.verdict;
  const after = version.verdict;
  const cut = cutOf(version.editList.clips, version.editList.overlays, version.editList, version.editList.format ?? "9:16");
  const play = playable(cut, brand);
  const src = ad.hasVideo ? videoUrl(orgId, ad.id) : null;
  const was = leanWord(draft.lean, draft.rival);
  const now = leanWord(after.lean, after.rival);
  const d = difference(draft, after);

  const read = (() => {
    const parts: string[] = [];
    if (d.lostTheirs.length) parts.push(`${d.lostTheirs.length === 1 ? "One thing" : `${d.lostTheirs.length} things`} that pulled your draft toward ${d.lostTheirs[0]!.rival} ${d.lostTheirs.length === 1 ? "is" : "are"} gone (${d.lostTheirs.map((t) => t.cue).slice(0, 3).join(", ")}).`);
    if (d.newYours.length) parts.push(`New in this version and yours: ${d.newYours.map((y) => y.cue).slice(0, 3).join(", ")}.`);
    if (d.stillTheirs.length) parts.push(`${cap(d.stillTheirs[0]!.cue)} still leans to ${d.stillTheirs[0]!.rival}: cut it or swap it if you can.`);
    else parts.push("Nothing left in it belongs only to a rival.");
    if (d.lostYours.length) parts.push(`You dropped ${d.lostYours.map((y) => y.cue).slice(0, 2).join(" and ")}, which was yours; bring it back if it fits.`);
    return parts.join(" ");
  })();

  return (
    <>
      <TopBar
        crumbs={[...trail, { label: "Ad check", href: `${base}/ad-check` }, { label: ad.fileName ?? ad.title, href: `${base}/ad-check/${ad.id}` }, { label: "Re-cut", href: recutHref(base, ad.id) }, { label: "Checked again" }]}
        actions={
          <>
            <Link href={tweakHref(base, ad.id, version.id) as never} className={buttonVariants({ variant: "outline", size: "pill" })}>
              <ScissorsIcon data-icon="inline-start" />
              Back to tweaking
            </Link>
            <Button size="pill" onClick={() => setExporting(true)} disabled={!src}>
              <DownloadIcon data-icon="inline-start" />
              Export versions
            </Button>
          </>
        }
      />
      <PageBody>
        <div className="mx-auto max-w-[1180px] space-y-6">
          <header>
            <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.03em]">{version.editList.title}, checked again</h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground tabular-nums">
              {seconds(play.durationMs)} · {cut.format} · {play.clips.length} {play.clips.length === 1 ? "shot" : "shots"} · Saved {ago(version.createdAt)}
              {version.createdBy?.name ? ` by ${version.createdBy.name}` : ""}
            </p>
          </header>

          <XRayRead
            aside={
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium">
                {now.glyph && <TerritoryGlyph kind={now.glyph} decorative />}
                {now.word}
              </span>
            }
          >
            <p>{read}</p>
          </XRayRead>

          <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <Side title="Your draft" length={seconds(ad.durationMs)} lean={was} items={reasons(draft)}>
              {src ? <Player src={src} rounded="rounded-[12px]" /> : <Gone />}
            </Side>
            <span className="mx-auto flex size-10 items-center justify-center rounded-full border bg-card text-muted-foreground" aria-hidden>
              <ArrowRightIcon className="size-4 max-lg:rotate-90" />
            </span>
            <Side title={version.editList.title} length={seconds(play.durationMs)} lean={now} items={reasons(after)} highlight>
              {src ? (
                <div className="flex justify-center rounded-[12px] bg-black">
                  <EditPlayer src={src} clips={play.clips} overlays={play.overlays} durationMs={play.durationMs} format={cut.format} silent={cut.sound === "mute"} className={cn("@container w-full", cut.format === "9:16" ? "max-w-[190px]" : cut.format === "1:1" ? "max-w-[300px]" : "")} />
                </div>
              ) : (
                <Gone />
              )}
            </Side>
          </div>
          <p className="text-[12.5px] text-muted-foreground">Where each lands comes from the same Qloo lists as your read: each kept shot’s cues, and any new words placed on your Culture Map.</p>
        </div>
      </PageBody>
      {src && <ExportDialog open={exporting} onOpenChange={setExporting} src={src} cut={cut} brand={brand} title={version.editList.title} placements={ad.placements} />}
    </>
  );
}

function Side({ title, length, lean, items, highlight, children }: { title: string; length: string; lean: ReturnType<typeof leanWord>; items: ReturnType<typeof reasons>; highlight?: boolean; children: React.ReactNode }) {
  return (
    <section className={cn("min-w-0 space-y-4 rounded-[16px] border p-5", highlight ? "border-ember bg-ember-soft" : "bg-card")}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="truncate text-[13.5px] font-semibold">{title}</h2>
        <span className="text-[12.5px] text-muted-foreground tabular-nums">{length}</span>
      </div>
      {children}
      <p className="flex items-center gap-2 text-[15px] font-semibold">
        {lean.glyph && <TerritoryGlyph kind={lean.glyph} decorative />}
        {lean.word}
      </p>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.text} className="flex items-center gap-2 text-[13px] text-foreground/85">
            <TerritoryGlyph kind={it.glyph} decorative className="shrink-0" />
            {it.text}
          </li>
        ))}
        {!items.length && <li className="text-[13px] text-muted-foreground">Nothing Qloo can place.</li>}
      </ul>
    </section>
  );
}

const Gone = () => <p className="rounded-[12px] border border-dashed px-4 py-10 text-center text-[13px] text-muted-foreground">The video was deleted.</p>;
