import { DownloadIcon, FlagIcon, MapPinIcon, MicIcon, Music2Icon, Share2Icon, UserIcon } from "lucide-react";
import { Evidence, SampleBadge } from "@/components/app/parts";
import { SoonButton } from "@/components/app/soon-button";
import { TopBar, type Crumb } from "@/components/shell/top-bar";
import { BRIEF } from "@/lib/sample-data";
import { AskHeader, AskThread } from "./ask";

const CARRIER_ICON = { Creator: UserIcon, Podcast: MicIcon, Setting: MapPinIcon, Sound: Music2Icon } as const;

/** a3: a brief, its angle and carriers, with Ask X-Ray beside it on wide screens. */
export function BriefView({ crumbs, brand, rival, market }: { crumbs: Crumb[]; brand: string; rival: string; market: string }) {
  return (
    <>
      <TopBar
        crumbs={crumbs}
        actions={
          <>
            <SampleBadge className="hidden sm:inline-flex" />
            <SoonButton variant="outline" size="pill" className="hidden md:inline-flex" message="PDF export arrives with briefs.">
              <DownloadIcon data-icon="inline-start" />
              Export PDF
            </SoonButton>
            <SoonButton size="pill" message="Sharing with clients arrives with briefs.">
              <Share2Icon data-icon="inline-start" />
              Share with client
            </SoonButton>
          </>
        }
      />
      <div className="grid min-h-[calc(100svh-52px)] xl:grid-cols-[minmax(0,1fr)_400px]">
        <article className="mx-auto w-full max-w-[760px] px-4 py-8 md:px-8 lg:py-10">
          <div className="flex flex-wrap items-center gap-2">
            {[
              ["Age", "25–34"],
              ["City", "New York City"],
              ["City", "Los Angeles"],
              ["Market", market],
            ].map(([k, v]) => (
              <span key={`${k}-${v}`} className="inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[12.5px]">
                <span className="text-muted-foreground">{k}</span> {v}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-[13px] text-ember-ink">
              <FlagIcon className="size-3.5" strokeWidth={2} aria-hidden />
              Draft · 2 critic notes
            </span>
          </div>
          <h1 className="mt-6 text-[40px] leading-[1.05] font-semibold tracking-[-0.035em] lg:text-[48px]">{BRIEF.title}</h1>
          <p className="mt-3 text-[18px] leading-relaxed text-muted-foreground">{BRIEF.subtitle(brand)}</p>

          <p className="mt-8 text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">The angle</p>
          <p className="mt-2 text-[16.5px] leading-[1.6]">{BRIEF.angle(brand, rival)}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["10% Happier · yours", "Virunga · yours", "Bear Grylls shows · theirs", "Rich Roll · lean 54/46"].map((e) => (
              <Evidence key={e} always>
                {e}
              </Evidence>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-between">
            <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Carriers</p>
            <p className="text-[13px] text-muted-foreground">4 picks · all cited</p>
          </div>
          <ul className="mt-2 divide-y">
            {BRIEF.carriers.map((c) => {
              const Icon = CARRIER_ICON[c.kind as keyof typeof CARRIER_ICON];
              return (
                <li key={c.title} className="grid grid-cols-[110px_1fr_auto] gap-4 py-4">
                  <span className="flex items-center gap-2 self-start text-[13.5px] text-muted-foreground">
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                    {c.kind}
                  </span>
                  <span>
                    <span className="block text-[15.5px] font-medium">{c.title}</span>
                    <span className="block text-[13.5px] text-muted-foreground">{c.note}</span>
                  </span>
                  <Evidence className="self-start" always>
                    {c.evidence}
                  </Evidence>
                </li>
              );
            })}
          </ul>
        </article>
        <aside className="hidden border-l xl:flex xl:flex-col" aria-label="Ask X-Ray">
          <div className="flex h-14 items-center border-b px-5">
            <AskHeader />
          </div>
          <AskThread brand={brand} compact className="h-[calc(100svh-52px-56px)]" />
        </aside>
      </div>
    </>
  );
}
