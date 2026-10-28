import Link from "next/link";
import { ArrowRightIcon, CheckIcon, CircleHelpIcon, EyeIcon, SendIcon, SparklesIcon } from "lucide-react";
import { Evidence, PageHeader, Panel, PanelRows, TerritoryGlyph, initialsOf } from "@/components/app/parts";
import { XRayRead } from "@/components/app/xray-read";
import { CopyButton } from "@/components/plays/embeds";
import { type Crumb, PageBody, TopBar } from "@/components/shell/top-bar";
import { buttonVariants } from "@/components/ui/button";
import { StandInNote } from "@/components/app/stand-in-note";
import { type Basis, inWords, wordsFor } from "@/lib/basis";
import { type Creator, creatorHref, creatorsHref, KIND_WORD, type Play, playHref, subscriberWords, territoryOf, youtubeThumb } from "@/lib/plays";
import { cn } from "@/lib/utils";

/* =============================================================== P2 · a play */

export function PlayView({ base, trail, play, creators, brand, viaAgency, basis }: { base: string; trail: Crumb[]; play: Play; creators: Creator[]; brand: string; viaAgency: boolean; basis: Basis | null }) {
  const items = play.items ?? [];
  const words = wordsFor(basis, brand, viaAgency);
  const say = (t: string) => inWords(t, basis, brand, viaAgency);
  const isCreator = play.kind === "CREATOR";
  const whose = viaAgency ? `${brand}’s` : "your";
  return (
    <>
      <TopBar
        crumbs={[...trail, { label: "Plays", href: `${base}/plays` }, { label: play.title }]}
        actions={
          isCreator ? (
            <Link href={creatorsHref(base, play.id)} className={buttonVariants({ size: "pill" })}>
              See creators
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          ) : null
        }
      />
      <PageBody>
        <div className="mx-auto max-w-[1180px] space-y-7">
          <PageHeader eyebrow={`${KIND_WORD[play.kind]} play`} title={play.title} description={say(play.rationale)} />
          <StandInNote basis={basis} brand={brand} />
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
              <Panel title="Why this play" action={`From ${whose} Culture Map`}>
                <PanelRows>
                  {items.map((i) => (
                    <div key={i.entityId} className="flex gap-3 px-[18px] py-3.5">
                      <TerritoryGlyph kind={territoryOf(i.label)} decorative className="mt-[5px] shrink-0" />
                      <div className="min-w-0 space-y-2">
                        <p className="text-[14px] leading-relaxed">{say(i.proof)}</p>
                        <Evidence always tip={`From Qloo: what ${words.who} rank, compared with rivals’ customers.`}>
                          {i.label === "YOURS" ? words.ownChip : `Shared with ${i.rival ?? "a rival"}`} · {i.name}
                        </Evidence>
                      </div>
                    </div>
                  ))}
                </PanelRows>
              </Panel>

              {!!play.brief?.length && (
                <Panel title="What to brief them" action={<CopyButton text={play.brief.map((b) => `• ${b}`).join("\n")} label="Copy brief" className="h-7 px-2.5 text-[12.5px]" />}>
                  <ul className="space-y-2.5 px-[18px] py-4">
                    {play.brief.map((b) => (
                      <li key={b} className="flex gap-2.5 text-[14px] leading-relaxed">
                        <CheckIcon className="mt-1 size-4 shrink-0 text-ember" strokeWidth={2.25} aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}

              {isCreator && creators.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-[14px] font-semibold">Creators who fit</h2>
                    <Link href={creatorsHref(base, play.id)} className="text-[13px] text-muted-foreground hover:text-foreground">
                      See all {creators.length}
                    </Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {creators.slice(0, 3).map((c) => (
                      <Link key={c.entityId} href={creatorHref(base, c.entityId, play.id)} className="group rounded-[12px] border bg-card p-3 transition-colors hover:border-foreground/25">
                        <Thumb creator={c} className="aspect-video w-full rounded-[8px]" />
                        <span className="mt-2.5 flex items-center gap-2.5">
                          <Face creator={c} size={28} />
                          <span className="min-w-0">
                            <span className="block truncate text-[13.5px] font-medium">{c.name}</span>
                            <span className="block truncate text-[12px] text-muted-foreground">{subscriberWords(c.youtube?.subscribers ?? null) ?? c.description ?? (c.label === "YOURS" ? words.ownChip : `Shared with ${c.rival ?? "a rival"}`)}</span>
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="min-w-0 space-y-4">
              <XRayRead compact aside={items[0] ? <Lean label={items[0].label} rival={items[0].rival} own={words.ownChip} /> : null}>
                <p>{say(play.why ?? play.rationale)}</p>
              </XRayRead>
              {isCreator && (
                <section className="rounded-[14px] border bg-muted/50 p-4">
                  <h2 className="text-[13.5px] font-semibold">Before you reach out</h2>
                  <ul className="mt-2.5 space-y-2 text-[12.5px] leading-relaxed text-foreground/80">
                    {[
                      [EyeIcon, "Watch their latest videos first; we link straight to them."],
                      [SendIcon, "Outreach is a draft you send yourself."],
                      [CircleHelpIcon, "Fees and availability aren’t known yet."],
                    ].map(([Icon, s]) => {
                      const I = Icon as typeof EyeIcon;
                      return (
                        <li key={s as string} className="flex gap-2">
                          <I className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          {s as string}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </aside>
          </div>
        </div>
      </PageBody>
    </>
  );
}

/* =============================================================== P3 · creators */

export function CreatorsView({ base, trail, play, creators, checking, brand, viaAgency, basis }: { base: string; trail: Crumb[]; play: Play | null; creators: Creator[]; checking: boolean; brand: string; viaAgency: boolean; basis: Basis | null }) {
  const whose = viaAgency ? `${brand}’s` : "your";
  const words = wordsFor(basis, brand, viaAgency);
  return (
    <>
      <TopBar crumbs={[...trail, { label: "Plays", href: `${base}/plays` }, ...(play ? [{ label: play.title, href: playHref(base, play.id) }] : []), { label: "Creators" }]} />
      <PageBody>
        <div className="mx-auto max-w-[1180px] space-y-6">
          <PageHeader
            eyebrow={play?.title ?? "Creators"}
            title={play ? "Creators for this play" : "Creators"}
            description={`People ${words.who} follow, from the Culture Map: ${words.ownChip.toLowerCase()} first. Their latest videos come straight from their public channels.`}
          />
          <StandInNote basis={basis} brand={brand} />
          {checking && (
            <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <SparklesIcon className="size-3.5" aria-hidden />
              Still finding some creators’ channels; refresh in a minute.
            </p>
          )}
          {creators.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {creators.map((c, i) => (
                <CreatorCard key={c.entityId} creator={c} href={creatorHref(base, c.entityId, play?.id)} lead={i === 0} own={words.ownChip} />
              ))}
            </div>
          ) : (
            <p className="rounded-[14px] border border-dashed bg-muted/40 px-6 py-12 text-center text-[14px] text-muted-foreground">No creators on {whose} map yet. They arrive with the Culture Map.</p>
          )}
          <p className="text-[12.5px] text-muted-foreground">Channels are matched from the handles Qloo lists for each person and checked by name. Content is shown by each platform; nothing is copied or stored.</p>
        </div>
      </PageBody>
    </>
  );
}

function CreatorCard({ creator: c, href, lead, own }: { creator: Creator; href: string; lead: boolean; own: string }) {
  const handle = c.youtube?.handle ?? c.tiktok?.handle ?? c.instagram;
  return (
    <article className={cn("flex flex-col gap-3 rounded-[14px] border bg-card p-4", lead && "border-ember/60")}>
      <div className="flex items-center gap-3">
        <Face creator={c} size={40} />
        <div className="min-w-0 flex-1">
          <Link href={href} className="block truncate text-[15px] font-semibold hover:underline">
            {c.name}
          </Link>
          <p className="truncate text-[12.5px] text-muted-foreground">{handle ? `@${handle}` : c.description ?? "Channels not found yet"}</p>
        </div>
        {handle && <CopyButton text={`@${handle}`} label="Copy handle" done="Handle copied" iconOnly />}
      </div>
      <div className="flex items-center justify-between gap-3 text-[12.5px]">
        <Lean label={c.label} rival={c.rival} own={own} />
        <span className="truncate text-muted-foreground">{subscriberWords(c.youtube?.subscribers ?? null) ?? ""}</span>
      </div>
      {c.videos.length ? (
        <div className="grid grid-cols-3 gap-1.5">
          {c.videos.slice(0, 3).map((v) => (
            <Link key={v.id} href={href} title={v.title} className="overflow-hidden rounded-[6px] bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail */}
              <img src={youtubeThumb(v.id)} alt="" className="aspect-video w-full object-cover" loading="lazy" />
            </Link>
          ))}
        </div>
      ) : (
        <p className="flex aspect-[16/3] items-center justify-center rounded-[6px] bg-muted/60 text-[12px] text-muted-foreground">No YouTube channel confirmed</p>
      )}
      {c.description && <p className="text-[13px] text-foreground/85">{c.description.charAt(0).toUpperCase() + c.description.slice(1)}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        {c.youtube && <Platform name="YouTube" />}
        {c.tiktok && <Platform name="TikTok" />}
        {c.instagram && <Platform name="Instagram" />}
        <Link href={href} className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-medium text-foreground/80 hover:text-foreground">
          Open
          <ArrowRightIcon className="size-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

/* --------------------------------------------------------------- pieces */

const DOT: Record<string, string> = { YouTube: "#FF0033", TikTok: "currentColor", Instagram: "#D62976", Facebook: "#1877F2" };

export function Platform({ name, href }: { name: "YouTube" | "TikTok" | "Instagram" | "Facebook"; href?: string }) {
  const body = (
    <>
      <span className="size-[7px] rounded-full" style={{ background: DOT[name] }} aria-hidden />
      {name}
    </>
  );
  const cls = "inline-flex h-6 items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 text-[11.5px] font-medium text-foreground/80";
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn(cls, "hover:text-foreground")}>
      {body}
    </a>
  ) : (
    <span className={cls}>{body}</span>
  );
}

/** Where a person or item sits: `own` is what this side’s ground is called ("Only yours", "Open to you"). */
export function Lean({ label, rival, own = "Only yours" }: { label: Creator["label"]; rival: string | null; own?: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[12.5px] font-medium">
      <TerritoryGlyph kind={territoryOf(label)} decorative />
      <span className="truncate">{label === "YOURS" ? own : label === "CONTESTED" ? `Shared with ${rival ?? "a rival"}` : `${rival ?? "A rival"}’s`}</span>
    </span>
  );
}

export function Face({ creator: c, size }: { creator: Creator; size: number }) {
  return c.image ? (
    // eslint-disable-next-line @next/next/no-img-element -- Qloo's own image of the person
    <img src={c.image} alt="" width={size} height={size} className="shrink-0 rounded-full border object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-full border bg-ember-soft font-semibold text-ember-ink" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initialsOf(c.name)}
    </span>
  );
}

function Thumb({ creator: c, className }: { creator: Creator; className?: string }) {
  const v = c.videos[0];
  if (!v) return <span className={cn("flex items-center justify-center bg-muted text-[12px] text-muted-foreground", className)}>No video yet</span>;
  // eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail
  return <img src={youtubeThumb(v.id)} alt="" className={cn("object-cover", className)} loading="lazy" />;
}
