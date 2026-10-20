import Link from "next/link";
import { ArrowRightIcon, FileTextIcon, InfoIcon, MessageSquareIcon, MicIcon, PlusIcon, UserIcon, XIcon } from "lucide-react";
import { Evidence, PageHeader, SampleBadge, TerritoryGlyph, WideOnly } from "@/components/app/parts";
import { PageBody, TopBar } from "@/components/shell/top-bar";
import { buttonVariants } from "@/components/ui/button";
import { CREATORS, PLAYS } from "@/lib/sample-data";

const ICONS = { user: UserIcon, mic: MicIcon, file: FileTextIcon } as const;

/** Owner's list of plays: each one a move with its source. */
export function PlaysList({ slug, rival }: { slug: string; rival: string }) {
  return (
    <>
      <TopBar crumbs={[{ label: "Plays" }]} actions={<SampleBadge />} />
      <PageBody className="space-y-8">
        <PageHeader eyebrow="This month" title="Plays" description="Moves your map suggests, each tied to the evidence behind it. New ones arrive as your map refreshes." />
        <ul className="divide-y rounded-[14px] border bg-card">
          {PLAYS.map((play) => {
            const Icon = ICONS[play.icon];
            return (
              <li key={play.id} className="flex flex-wrap items-center gap-4 px-5 py-[calc(var(--row-y)+0.25rem)]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border">
                  <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-medium tracking-[0.1em] text-muted-foreground uppercase">{play.kind}</p>
                  <p className="text-[16px] font-medium">{play.title}</p>
                  <p className="text-[13.5px] text-muted-foreground">{play.body(rival)}</p>
                </div>
                <Evidence className="hidden md:inline-flex">{play.evidence}</Evidence>
                <Link href={play.id === "creators" ? `/${slug}/plays/creators` : `/${slug}/plays`} className={buttonVariants({ variant: "outline", size: "pill" })}>
                  {play.action}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </li>
            );
          })}
        </ul>
      </PageBody>
    </>
  );
}

/** o4: the creators behind a creator play, ranked by fit. */
export function CreatorsPlay({ slug, market }: { slug: string; market: string }) {
  return (
    <>
      <TopBar
        crumbs={[{ label: "Plays", href: `/${slug}/plays` }, { label: "Partner with a climbing creator" }]}
        actions={
          <>
            <SampleBadge className="hidden sm:inline-flex" />
            <Link href={`/${slug}/ask`} className={buttonVariants({ variant: "outline", size: "pill" })}>
              <MessageSquareIcon data-icon="inline-start" />
              Ask X-Ray
            </Link>
          </>
        }
      />
      <PageBody className="space-y-6">
        <PageHeader
          eyebrow="Creator play"
          title="Partner with a mid-size climbing creator"
          description={`Six ${market} creators from the shared climbing world, ranked by how close their audience sits to yours. Mid-size first: cheaper, and closer to your customers.`}
        />
        <div className="flex flex-wrap gap-2">
          {[
            ["Market", market],
            ["Tier", "Mid and niche"],
            ["Platform", "Any platform"],
          ].map(([k, v]) => (
            <span key={k} className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px]">
              <span className="text-muted-foreground">{k}</span> {v}
              <XIcon className="size-3 text-muted-foreground" strokeWidth={2} aria-hidden />
            </span>
          ))}
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] text-muted-foreground">
            <PlusIcon className="size-3.5" strokeWidth={2} aria-hidden />
            Filter
          </span>
        </div>

        <WideOnly what="The creator table">
          <section className="overflow-hidden rounded-[14px] border bg-card">
            <header className="flex items-center justify-between border-b bg-muted/60 px-5 py-3">
              <h2 className="text-[14px] font-medium">6 creators</h2>
              <span className="text-[13px] text-muted-foreground">Sorted by fit</span>
            </header>
            <table className="w-full text-left text-[14px]">
              <thead className="text-[12.5px] text-muted-foreground">
                <tr className="border-b">
                  <th className="px-5 py-2.5 font-normal">Creator</th>
                  <th className="px-3 py-2.5 font-normal">Platform</th>
                  <th className="hidden px-3 py-2.5 font-normal lg:table-cell">Tier</th>
                  <th className="px-3 py-2.5 font-normal">Territory</th>
                  <th className="px-3 py-2.5 font-normal">Fit</th>
                  <th className="hidden px-5 py-2.5 font-normal xl:table-cell">Reaches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft">
                {CREATORS.map((c, i) => (
                  <tr key={c.name} className={i === 0 ? "bg-ember-soft/50" : undefined}>
                    <td className="px-5 py-[var(--row-y)]">
                      <span className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-full border bg-muted text-[11px] font-medium">{c.initials}</span>
                        <span className="font-medium">{c.name}</span>
                      </span>
                    </td>
                    <td className="px-3 text-foreground/85">{c.platform}</td>
                    <td className="hidden px-3 lg:table-cell">{c.tier}</td>
                    <td className="px-3">
                      <span className="flex items-center gap-2">
                        <TerritoryGlyph kind={c.territory} decorative />
                        {c.territory[0]!.toUpperCase() + c.territory.slice(1)}
                      </span>
                    </td>
                    <td className="px-3">
                      <span className="flex items-center gap-2.5">
                        <span className="h-1.5 w-20 rounded-full bg-soft">
                          <span className="block h-full rounded-full bg-ember" style={{ width: `${c.fit * 100}%` }} />
                        </span>
                        <span className="font-mono text-[12.5px] text-muted-foreground tabular-nums">{c.fit.toFixed(2)}</span>
                      </span>
                    </td>
                    <td className="hidden px-5 text-foreground/85 xl:table-cell">{c.reaches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </WideOnly>

        <p className="flex items-start gap-2.5 rounded-[14px] border bg-muted/60 px-4 py-3 text-[13.5px]">
          <InfoIcon className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          Creators are matched from public handles and Qloo&rsquo;s graph, never from faces. Fees and availability are not known yet; outreach is a draft you send yourself.
        </p>
      </PageBody>
    </>
  );
}
