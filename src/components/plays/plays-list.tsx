"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRightIcon, BookOpenIcon, CheckIcon, MapPinIcon, MicIcon, MusicIcon, RefreshCwIcon, ShoppingBagIcon, SparklesIcon, TvIcon, UserRoundIcon, type LucideIcon } from "lucide-react";
import { Evidence, PageHeader, TerritoryGlyph } from "@/components/app/parts";
import { XRayRead } from "@/components/app/xray-read";
import { type Crumb, PageBody, TopBar } from "@/components/shell/top-bar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AppError } from "@/lib/errors";
import { StandInNote } from "@/components/app/stand-in-note";
import { type Basis, inWords, wordsFor } from "@/lib/basis";
import { GROUPS, KIND_WORD, type Play, type PlayKind, playHref, plays as playsApi, type PlaysList as Data, territoryOf } from "@/lib/plays";
import { guideDid } from "@/lib/guide";
import { cn } from "@/lib/utils";

const ICON: Record<PlayKind, LucideIcon> = { CREATOR: UserRoundIcon, PODCAST: MicIcon, SHOW: TvIcon, PLACE: MapPinIcon, SOUND: MusicIcon, ARTIST: MusicIcon, PARTNER: ShoppingBagIcon, AESTHETIC: SparklesIcon, PRICE: BookOpenIcon };

const written = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** P1: the plays the map backs, grouped by what to do. Each has its why, its sources and one action. */
export function PlaysList({ orgId, base, trail, initial, canWork, brand, viaAgency }: { orgId: string; base: string; trail: Crumb[]; initial: Data; canWork: boolean; brand: string; viaAgency: boolean }) {
  const [data, setData] = useState(initial);
  const [asked, setAsked] = useState(false);
  const busy = data.writing || asked;

  // While the worker writes, check back every few seconds; the list swaps in when it's done.
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(async () => {
      try {
        const next = await playsApi.list(orgId);
        if (!next.writing) {
          setData(next);
          setAsked(false);
        }
      } catch {
        /* the next tick tries again */
      }
    }, 4000);
    return () => clearInterval(t);
  }, [busy, orgId]);

  async function refresh() {
    setAsked(true);
    try {
      await playsApi.refresh(orgId);
    } catch (error) {
      setAsked(false);
      toast(error instanceof AppError ? error.message : "We couldn’t start writing plays. Try again.");
    }
  }

  const refreshButton = canWork && data.mapReady && (
    <Button variant="outline" size="pill" onClick={refresh} disabled={busy}>
      {busy ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
      {busy ? "Writing plays…" : data.plays.length ? "Refresh plays" : "Write plays"}
    </Button>
  );
  const whose = viaAgency ? `${brand}’s` : "your";

  return (
    <>
      <TopBar crumbs={[...trail, { label: "Plays" }]} actions={refreshButton || null} />
      <PageBody>
        <div className="mx-auto max-w-[1180px] space-y-7">
          <PageHeader eyebrow="This month" title="Plays" description={`Moves ${whose} Culture Map backs. Each one says why, and what it rests on.`} />
          <StandInNote basis={data.basis} brand={brand} />

          {!data.mapReady ? (
            <Empty title="Plays come from the Culture Map" body={`Build ${whose} Culture Map first; plays are written from it.`} action={<Link href={base} className={buttonVariants({ size: "pill" })}>Go to the overview</Link>} />
          ) : !data.plays.length ? (
            <Empty
              title={busy ? "Writing plays from the map…" : "No plays yet"}
              body={busy ? "This takes about a minute. You can leave; they’ll be here." : "Plays are written each time the map is built."}
              action={busy ? <Spinner className="size-5" /> : canWork ? <Button size="pill" onClick={refresh}>Write plays</Button> : null}
            />
          ) : (
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-6">
                {GROUPS.map((g) => {
                  const here = data.plays.filter((p) => g.kinds.includes(p.kind));
                  if (!here.length) return null;
                  return (
                    <section key={g.label} className="space-y-2.5">
                      <h2 className="text-[13px] font-semibold text-foreground/80">{g.label}</h2>
                      <ul className="divide-y divide-soft overflow-hidden rounded-[14px] border bg-card">
                        {here.map((p) => (
                          <PlayRow key={p.id} play={p} base={base} lead={p.rank === 0} brand={brand} viaAgency={viaAgency} basis={data.basis} />
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
              <aside className="min-w-0 space-y-4">
                <XRayRead
                  compact
                  aside={<Evidence tip={`Written from ${data.queryCount} Qloo lookups behind ${whose} Culture Map.`}>from {data.queryCount} Qloo lookups</Evidence>}
                  footer={data.writtenAt ? <span className="text-[12.5px] text-muted-foreground">Written {written(data.writtenAt)}</span> : null}
                >
                  <p>{inWords(data.plays[0]!.why ?? data.plays[0]!.rationale, data.basis, brand, viaAgency)}</p>
                  <p className="mt-2 text-[14px] text-muted-foreground">Start with {data.plays[0]!.title.charAt(0).toLowerCase() + data.plays[0]!.title.slice(1)}.</p>
                </XRayRead>
                <section className="rounded-[14px] border bg-muted/50 p-4">
                  <h2 className="text-[13.5px] font-semibold">How plays are written</h2>
                  <ul className="mt-2.5 space-y-2 text-[12.5px] leading-relaxed text-foreground/80">
                    {[`Each play rests on items on ${whose} Culture Map; nothing is made up.`, "They’re rewritten when the map is rebuilt.", "Hover a source to see what it rests on."].map((s) => (
                      <li key={s} className="flex gap-2">
                        <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        {s}
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>
            </div>
          )}
        </div>
      </PageBody>
    </>
  );
}

function PlayRow({ play, base, lead, brand, viaAgency, basis }: { play: Play; base: string; lead: boolean; brand: string; viaAgency: boolean; basis: Basis | null }) {
  const Icon = ICON[play.kind];
  const first = play.items?.[0];
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:px-5" data-guide={lead ? "plays.first" : undefined} data-guide-say={lead && play.why ? `${play.title}: ${inWords(play.why, basis, brand, viaAgency)}` : undefined}>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full border", lead && "bg-ember-soft")}>
        <Icon className={cn("size-[17px]", lead ? "text-ember-ink" : "text-foreground/75")} strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 basis-[260px]">
        <p className="text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">{KIND_WORD[play.kind]}</p>
        <Link href={playHref(base, play.id)} onClick={() => guideDid("play.open")} className="mt-0.5 block text-[16px] font-medium hover:underline">
          {play.title}
        </Link>
        {play.why && (
          <p className="mt-1 flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
            {first && <TerritoryGlyph kind={territoryOf(first.label)} decorative className="mt-[5px] shrink-0" />}
            {inWords(play.why, basis, brand, viaAgency)}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {first && (
          <span data-guide={lead ? "plays.source" : undefined} data-guide-say={lead ? inWords(first.proof, basis, brand, viaAgency) : undefined} className="hidden md:inline-flex">
            <Evidence always tip={inWords(first.proof, basis, brand, viaAgency)} className="max-w-[260px]">
              {first.label === "YOURS" ? wordsFor(basis, brand, viaAgency).ownChip : `Shared with ${first.rival ?? "a rival"}`} · {first.name}
            </Evidence>
          </span>
        )}
        <Link href={playHref(base, play.id)} onClick={() => guideDid("play.open")} className={buttonVariants({ variant: lead ? "default" : "outline", size: "pill" })}>
          Open play
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </div>
    </li>
  );
}

function Empty({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-[16px] border border-dashed bg-muted/40 px-6 py-14 text-center">
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <p className="max-w-md text-[14px] text-muted-foreground">{body}</p>
      {action}
    </section>
  );
}
