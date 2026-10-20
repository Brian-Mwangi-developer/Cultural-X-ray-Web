import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CircleCheckIcon, DownloadIcon, FileTextIcon, MicIcon, Share2Icon, UploadIcon, UserIcon } from "lucide-react";
import { Evidence, PageHeader, SampleBadge, TerritoryGlyph, TextLink, type Territory } from "@/components/app/parts";
import { SoonButton } from "@/components/app/soon-button";
import { PageBody, TopBar } from "@/components/shell/top-bar";
import { buttonVariants } from "@/components/ui/button";
import { PHOTOS, PLAYS } from "@/lib/sample-data";

const ICONS = { user: UserIcon, mic: MicIcon, file: FileTextIcon } as const;

type Column = { title: string; image: keyof typeof PHOTOS; items: [string, Territory][] };

const COLUMNS: Column[] = [
  { title: "They listen to", image: "mic", items: [["10% Happier", "yours"], ["Rich Roll", "contested"], ["Finding Mastery", "yours"]] },
  { title: "They watch", image: "forest", items: [["A Life on Our Planet", "yours"], ["Free Solo", "contested"], ["The Dawn Wall", "yours"]] },
  { title: "They follow", image: "host", items: [["Climbing creators", "contested"], ["Slow-travel writers", "yours"], ["Ultra runners", "theirs"]] },
  { title: "They go to", image: "lakes", items: [["Lake District", "yours"], ["Snowdonia", "yours"], ["Chamonix", "contested"]] },
];

/** o3: the owner's home once the map is built. */
export function OwnerOverview({ slug, brand, seeds, rivals, market }: { slug: string; brand: string; seeds: string[]; rivals: string[]; market: string }) {
  const rival = rivals[0] ?? "your closest rival";
  const through = seeds.length ? `read through ${seeds.join(" and ")}` : `read for ${brand}`;
  return (
    <>
      <TopBar
        crumbs={[{ label: "Overview" }]}
        actions={
          <>
            <SampleBadge className="hidden sm:inline-flex" />
            <SoonButton variant="outline" size="pill" message="Sharing arrives with the Culture Map engine.">
              <Share2Icon data-icon="inline-start" />
              Share
            </SoonButton>
            <SoonButton variant="outline" size="pill" className="hidden md:inline-flex" message="PDF export arrives with the Culture Map engine.">
              <DownloadIcon data-icon="inline-start" />
              Export PDF
            </SoonButton>
          </>
        }
      />
      <PageBody className="space-y-10">
        <div>
          <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <CircleCheckIcon className="size-4" strokeWidth={1.75} aria-hidden />
            Built today · {market} · {through}
            {rivals.length > 0 && `, against ${rivals.join(", ")}`}
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="max-w-[26ch] text-[30px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance lg:text-[38px]">
              Your customers live in a quiet outdoors: wellbeing podcasts, conservation films and slow weekends in the Lake District.
            </h1>
            <Evidence>from 124 associations</Evidence>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <section key={col.title} className="overflow-hidden rounded-[14px] border bg-card">
              <div className="relative h-32">
                <Image src={PHOTOS[col.image]} alt="" fill sizes="(min-width:1280px) 25vw, 50vw" className="object-cover" placeholder="blur" />
              </div>
              <div className="px-4 pt-4 pb-5">
                <h2 className="text-[18px] font-medium tracking-[-0.01em]">{col.title}</h2>
                <ul className="mt-2.5 space-y-2">
                  {col.items.map(([name, territory]) => (
                    <li key={name} className="flex items-center gap-2.5 text-[14px]">
                      <TerritoryGlyph kind={territory} />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[24px] font-semibold tracking-[-0.025em]">Three plays for this month</h2>
            <TextLink href={`/${slug}/plays`}>See all 12 plays</TextLink>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {PLAYS.map((play) => {
              const Icon = ICONS[play.icon];
              return (
                <article key={play.id} className="flex flex-col rounded-[14px] border bg-card p-5">
                  <p className="flex items-center gap-2.5 text-[11.5px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
                    <span className="flex size-8 items-center justify-center rounded-full border">
                      <Icon className="size-4 text-foreground" strokeWidth={1.75} aria-hidden />
                    </span>
                    {play.kind}
                  </p>
                  <h3 className="mt-4 text-[17px] leading-snug font-medium">{play.title}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-muted-foreground">{play.body(rival)}</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Evidence>{play.evidence}</Evidence>
                    <Link href={play.id === "creators" ? `/${slug}/plays/creators` : `/${slug}/plays`} className={buttonVariants({ variant: "outline", size: "pill" })}>
                      {play.action}
                      <ArrowRightIcon data-icon="inline-end" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-4 rounded-[14px] border bg-card px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-full border">
            <UploadIcon className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium">Check a draft before you spend</p>
            <p className="text-[13.5px] text-muted-foreground">Drop a video up to 60 seconds. We&rsquo;ll show where it lands and what to change.</p>
          </div>
          <Link href={`/${slug}/ad-check`} className={buttonVariants({ size: "pill" })}>
            <UploadIcon data-icon="inline-start" />
            Upload video
          </Link>
        </section>
      </PageBody>
    </>
  );
}
