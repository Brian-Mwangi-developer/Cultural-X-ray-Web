"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowUpRightIcon, CirclePlayIcon, LockIcon, SendIcon, WandSparklesIcon } from "lucide-react";
import { Evidence, Panel, PanelRows } from "@/components/app/parts";
import { XRayRead } from "@/components/app/xray-read";
import { CopyButton, TikTokProfile, YouTubeEmbed } from "@/components/plays/embeds";
import { Face, Lean, Platform } from "@/components/plays/play-views";
import { type Crumb, PageBody, TopBar } from "@/components/shell/top-bar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { AppError } from "@/lib/errors";
import {
  ago, type Creator, creatorsHref, facebookSearch, forViewer, instagramProfile, leanWords, type Play, playHref, plays, subscriberWords, tiktokProfile, tiktokSearch, viewsWords, youtubeChannel, youtubeSearch, youtubeThumb, youtubeWatch,
} from "@/lib/plays";

/** P4: a creator's own content first (each platform's embed), why they fit, and a draft to reach out. */
export function CreatorView({ orgId, base, trail, creator: c, play, canWork, brand, viaAgency }: { orgId: string; base: string; trail: Crumb[]; creator: Creator; play: Play | null; canWork: boolean; brand: string; viaAgency: boolean }) {
  const who = viaAgency ? brand : undefined;
  const proof = forViewer(c.proof, brand, viaAgency);
  const [video, setVideo] = useState(c.videos[0] ?? null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [draft, setDraft] = useState<{ subject: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function write() {
    setBusy(true);
    try {
      setDraft((await plays.outreach(orgId, c.entityId, play?.id ?? null)).draft);
    } catch (error) {
      toast(error instanceof AppError ? error.message : "We couldn’t write the draft. Try again.");
    } finally {
      setBusy(false);
    }
  }
  const handle = c.youtube?.handle ?? c.tiktok?.handle ?? c.instagram;
  const facts = [handle && `@${handle}`, subscriberWords(c.youtube?.subscribers ?? null), c.description && c.description.charAt(0).toUpperCase() + c.description.slice(1)].filter(Boolean) as string[];

  return (
    <>
      <TopBar
        crumbs={[
          ...trail,
          { label: "Plays", href: `${base}/plays` },
          ...(play ? [{ label: play.title, href: playHref(base, play.id) }] : []),
          { label: "Creators", href: creatorsHref(base, play?.id) },
          { label: c.name },
        ]}
      />
      <PageBody>
        <div className="mx-auto max-w-[1180px] space-y-6">
          <header className="flex flex-wrap items-center gap-4">
            <Face creator={c} size={56} />
            <div className="min-w-0 flex-1">
              <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.03em]">{c.name}</h1>
              <p className="mt-1 text-[13px] text-muted-foreground">{facts.join(" · ")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {handle && <CopyButton text={`@${handle}`} label="Copy handle" done="Handle copied" />}
              {canWork && (
                <Button
                  size="pill"
                  onClick={() => {
                    setDraftOpen(true);
                    if (!draft && !busy) void write();
                  }}
                >
                  <SendIcon data-icon="inline-start" />
                  Draft outreach
                </Button>
              )}
            </div>
          </header>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-5">
              {video ? (
                <section className="overflow-hidden rounded-[14px] border bg-card">
                  <YouTubeEmbed key={video.id} id={video.id} title={video.title} />
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <Platform name="YouTube" />
                    <p className="min-w-0 flex-1 truncate text-[14px] font-medium">{video.title}</p>
                    <a href={youtubeWatch(video.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground">
                      Watch on YouTube
                      <ArrowUpRightIcon className="size-3.5" aria-hidden />
                    </a>
                  </div>
                </section>
              ) : (
                <section className="rounded-[14px] border border-dashed bg-muted/40 px-6 py-10 text-center">
                  <p className="text-[14px] font-medium">No YouTube channel we could confirm</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">We only show a channel when its name is theirs. Search for them yourself:</p>
                  <a href={youtubeSearch(c.name)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-ember-ink hover:underline">
                    Search YouTube for {c.name}
                    <ArrowUpRightIcon className="size-3.5" aria-hidden />
                  </a>
                </section>
              )}

              {c.videos.length > 1 && (
                <Panel title="Latest videos" action={c.youtube ? <a href={youtubeChannel(c.youtube)} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">From their public channel</a> : null}>
                  <PanelRows>
                    {c.videos.map((v) => (
                      <button key={v.id} type="button" onClick={() => setVideo(v)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50" aria-current={v.id === video?.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail */}
                        <img src={youtubeThumb(v.id)} alt="" className="aspect-video w-24 shrink-0 rounded-[6px] object-cover" loading="lazy" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium">{v.title}</span>
                          <span className="block text-[12px] text-muted-foreground">{[ago(v.published), viewsWords(v.views)].filter(Boolean).join(" · ")}</span>
                        </span>
                        <CirclePlayIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      </button>
                    ))}
                  </PanelRows>
                </Panel>
              )}
            </div>

            <aside className="min-w-0 space-y-4">
              <XRayRead compact aside={<Lean label={c.label} rival={c.rival} brand={who} />} basedOn={<Evidence always tip={proof}>{leanWords(c.label, c.rival, who)} · Creators</Evidence>}>
                <p>{proof}</p>
              </XRayRead>

              {c.tiktok && (
                <section className="space-y-2.5 rounded-[14px] border bg-card p-3.5">
                  <div className="flex items-center gap-2">
                    <Platform name="TikTok" href={tiktokProfile(c.tiktok.handle)} />
                    <span className="truncate text-[12.5px] text-foreground/80">@{c.tiktok.handle}</span>
                  </div>
                  {c.tiktok.match === "handle" && <p className="text-[12px] text-muted-foreground">Uses the same handle as their Instagram; check it’s them.</p>}
                  <TikTokProfile handle={c.tiktok.handle} />
                </section>
              )}

              <section className="overflow-hidden rounded-[14px] border bg-card">
                <Elsewhere name="YouTube" line={c.youtube ? `@${c.youtube.handle ?? c.youtube.title}` : "Not confirmed"} href={c.youtube ? youtubeChannel(c.youtube) : youtubeSearch(c.name)} action={c.youtube ? "Open" : "Search"} note={c.youtube?.match === "handle" ? "Same handle as their Instagram" : null} />
                {!c.tiktok && <Elsewhere name="TikTok" line="Not confirmed" href={tiktokSearch(c.name)} action="Search" />}
                <Elsewhere name="Instagram" line={c.instagram ? `@${c.instagram}` : "Not listed"} href={c.instagram ? instagramProfile(c.instagram) : null} action="Open" />
                <Elsewhere name="Facebook" line={c.facebook ? c.facebook : "Not listed"} href={c.facebook ? `https://www.facebook.com/${c.facebook}` : facebookSearch(c.name)} action={c.facebook ? "Open" : "Search"} />
              </section>
              <p className="text-[12px] leading-relaxed text-muted-foreground">Shown by each platform, in your browser. Nothing is copied or stored.</p>
            </aside>
          </div>
        </div>
      </PageBody>
      {canWork && <OutreachDialog open={draftOpen} onOpenChange={setDraftOpen} name={c.name} draft={draft} setDraft={setDraft} busy={busy} onRewrite={write} />}
    </>
  );
}

function Elsewhere({ name, line, href, action, note }: { name: "YouTube" | "TikTok" | "Instagram" | "Facebook"; line: string; href: string | null; action: string; note?: string | null }) {
  return (
    <div className="flex items-center gap-2.5 border-b px-3.5 py-2.5 last:border-b-0">
      <Platform name={name} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] text-foreground/80">{line}</span>
        {note && <span className="block truncate text-[11.5px] text-muted-foreground">{note}</span>}
      </span>
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-medium text-ember-ink hover:underline">
          {action}
        </a>
      )}
    </div>
  );
}

/** P5: a first message to copy and send yourself. X-Ray sends nothing. */
function OutreachDialog({ open, onOpenChange, name, draft, setDraft, busy, onRewrite }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  name: string;
  draft: { subject: string; message: string } | null;
  setDraft: (d: { subject: string; message: string }) => void;
  busy: boolean;
  onRewrite: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Draft outreach to {name}</DialogTitle>
          <DialogDescription>Written from this play and their latest videos. Edit it, copy it, and send it from your own email or DMs.</DialogDescription>
        </DialogHeader>
        {draft ? (
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-[12.5px] font-medium text-foreground/80">Subject</span>
              <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[12.5px] font-medium text-foreground/80">Message</span>
              <Textarea value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} className="min-h-[200px] text-[14px] leading-relaxed" />
            </label>
          </div>
        ) : (
          <p className="flex items-center gap-2 py-10 text-[14px] text-muted-foreground">
            <Spinner />
            Writing a first draft…
          </p>
        )}
        <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
          <LockIcon className="size-3.5" aria-hidden />
          Nothing is sent from X-Ray. Fees and availability are for you to agree.
        </p>
        <DialogFooter>
          <Button variant="outline" size="pill" onClick={onRewrite} disabled={busy}>
            {busy ? <Spinner data-icon="inline-start" /> : <WandSparklesIcon data-icon="inline-start" />}
            Rewrite
          </Button>
          {draft && <CopyButton text={`${draft.subject}\n\n${draft.message}`} label="Copy message" />}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
