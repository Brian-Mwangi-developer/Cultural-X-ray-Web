import Image from "next/image";
import Link from "next/link";
import { AudioLinesIcon, CheckIcon, MapPinIcon, MicIcon, ScanSearchIcon, UserRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import climber from "../../../public/images/culture-climber.jpg";
import court from "../../../public/images/culture-court.jpg";
import street from "../../../public/images/culture-street.jpg";
import dusk from "../../../public/images/hero-dusk.jpg";
import { EmailCapture } from "./email-capture";
import { TerritoryColumns, TerritoryGlyph } from "./territory-card";

/* ------------------------------------------------------------------ shared */

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2 text-[12px] font-medium tracking-[0.12em] text-muted-foreground uppercase", className)}>
      <span className="size-1.5 rounded-full bg-ember" aria-hidden />
      {children}
    </p>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("font-heading font-semibold text-[2.5rem] leading-[1.02] tracking-[-0.03em] text-balance sm:text-[3.4rem]", className)}>
      {children}
    </h2>
  );
}

function Tile({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("overflow-hidden rounded-[22px] border bg-card", className)}>{children}</div>;
}

function TileHead({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="p-6 sm:p-7">
      <p className="font-mono text-[13px] text-muted-foreground tabular-nums">{index}</p>
      <h3 className="mt-2 text-[1.35rem] font-medium tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 max-w-[34rem] text-[15px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

/* ---------------------------------------------------------- signal marquee */

// Associations the labs returned (plan §2, §9). Category in small caps after each.
const SIGNALS: [string, string][] = [
  ["Free Solo", "Film"],
  ["Alex Honnold", "Person"],
  ["Rich Roll", "Podcast"],
  ["Virunga", "Film"],
  ["Moab", "Place"],
  ["10% Happier", "Podcast"],
  ["Lord Huron", "Artist"],
  ["Telluride", "Place"],
  ["Kai Cenat", "Creator"],
  ["A Life on Our Planet", "Film"],
  ["Gregory Alan Isakov", "Artist"],
  ["Louis Vuitton", "Brand"],
];

export function SignalStrip() {
  const row = [...SIGNALS, ...SIGNALS];
  return (
    <section aria-label="Signals a Culture Map reads" className="overflow-hidden border-b py-7">
      <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
        {row.map(([name, kind], i) => (
          <span key={i} aria-hidden={i >= SIGNALS.length} className="flex shrink-0 items-baseline gap-2.5 whitespace-nowrap">
            <span className="font-heading font-semibold text-[1.6rem] tracking-[-0.02em]">{name}</span>
            <span className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">{kind}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ the outputs */

const PLAYS = [
  { icon: UserRoundIcon, kind: "Creator", text: "A partner from the climbing world both brands share" },
  { icon: MicIcon, kind: "Podcast", text: "A host-read on 10% Happier, which only Patagonia owns" },
  { icon: MapPinIcon, kind: "Setting", text: "Shoot in Moab or Telluride, where the brand over-indexes" },
  { icon: AudioLinesIcon, kind: "Sound", text: "Warm acoustic folk, filled from a licensed library" },
];

export function Outputs() {
  return (
    <section id="product" className="mx-auto max-w-[84rem] scroll-mt-8 px-4 py-24 sm:px-6 sm:py-32">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end">
        <div>
          <Eyebrow>What you get</Eyebrow>
          <SectionTitle className="mt-5 max-w-[18ch]">
            One brand in. <br className="hidden sm:block" />
            A plan its culture will recognise.
          </SectionTitle>
        </div>
        <p className="text-[16px] leading-relaxed text-muted-foreground text-pretty">
          Meta and TikTok now pick the audience. The creative does the targeting, so it has to speak to the culture your buyers already live in.
        </p>
      </div>

      <div className="mt-14 grid gap-4 lg:grid-cols-12">
        {/* 01 Culture Map */}
        <Tile className="lg:col-span-7">
          <TileHead
            index="01"
            title="A Culture Map, split into territory"
            body="What your market listens to, watches and follows, labelled as yours, contested, or your competitor’s. With who each part reaches and where."
          />
          <div className="relative mx-6 mb-6 overflow-hidden rounded-2xl sm:mx-7 sm:mb-7">
            <Image src={climber} alt="" placeholder="blur" sizes="(min-width: 1024px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover object-[center_18%]" />
            <div className="relative p-4 pt-28 sm:p-6 sm:pt-40">
              <div className="overflow-hidden rounded-xl bg-card/95 ring-1 ring-black/5 backdrop-blur-sm dark:ring-white/10">
                <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-3">
                  <span className="text-[13px] font-medium">Films</span>
                  <span className="text-[12px] text-muted-foreground">Patagonia vs The North Face</span>
                </div>
                <TerritoryColumns
                  columns={{
                    yours: ["Virunga", "A Life on Our Planet"],
                    contested: ["Free Solo"],
                    theirs: ["Messner", "Last Breath"],
                  }}
                />
              </div>
            </div>
          </div>
        </Tile>

        {/* 02 Plays */}
        <Tile className="flex flex-col lg:col-span-5">
          <TileHead
            index="02"
            title="Plays that carry the message"
            body="Creators to partner with, podcasts to sponsor, places to film and a sound direction. Each one points to the query that produced it."
          />
          <ul className="mx-6 mb-6 divide-y rounded-2xl border sm:mx-7 sm:mb-7 lg:mt-auto">
            {PLAYS.map(({ icon: Icon, kind, text }) => (
              <li key={kind} className="flex items-start gap-3.5 px-4 py-3.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-muted-foreground">
                  <Icon className="size-4" strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">{kind}</p>
                  <p className="mt-0.5 text-[14.5px] leading-snug">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Tile>

        {/* 03 Ad check */}
        <Tile className="lg:col-span-5">
          <TileHead
            index="03"
            title="An ad check before it runs"
            body="Upload a draft or a competitor’s ad. We read its setting, styling, script and on-screen text, and show which territory it lands in."
          />
          <AdCheck />
        </Tile>

        {/* Who and where */}
        <Tile className="grid lg:col-span-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="flex flex-col">
            <TileHead
              index="04"
              title="Who it reaches, and where"
              body="Age, gender and lifestyle audiences, top cities and the places a brand over-indexes, side by side with each rival."
            />
            <dl className="mx-6 mb-6 divide-y border-y sm:mx-7 sm:mb-7 lg:mt-auto">
              {[
                ["Past 55", "Patagonia holds. The North Face falls away."],
                ["Places", "Moab and Telluride, for Patagonia."],
                ["Cities", "Nike reads as the Yankees in New York City and the Lakers in LA."],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 py-3 text-[14px]">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative min-h-64 lg:min-h-0">
            <Image src={court} alt="An empty caged basketball court under an overpass" placeholder="blur" fill sizes="(min-width: 1024px) 28vw, 100vw" className="object-cover" />
          </div>
        </Tile>
      </div>
    </section>
  );
}

function AdCheck() {
  // The worked example from plan §4.5: a draft with survival-show styling.
  const mix = [
    { kind: "theirs" as const, label: "Theirs", value: 80 },
    { kind: "contested" as const, label: "Contested", value: 12 },
    { kind: "yours" as const, label: "Yours", value: 8 },
  ];
  return (
    <div className="mx-6 mb-6 rounded-2xl border sm:mx-7 sm:mb-7">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-full border text-muted-foreground">
          <ScanSearchIcon className="size-4" strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium">draft_v3_trailhead.mp4</p>
          <p className="text-[12px] text-muted-foreground">Checked against Patagonia&rsquo;s map · example</p>
        </div>
      </div>
      <div className="px-4 py-4">
        <p className="text-[14.5px] leading-snug">
          <span className="font-heading font-semibold text-[1.9rem] leading-none tracking-[-0.02em] tabular-nums">80%</span>{" "}
          of its cultural signals sit in The North Face&rsquo;s territory.
        </p>
        <div className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full" role="img" aria-label="80% theirs, 12% contested, 8% yours">
          {mix.map((m) => (
            <span
              key={m.kind}
              style={{ width: `${m.value}%` }}
              className={cn(m.kind === "theirs" && "bg-ember", m.kind === "contested" && "bg-foreground/45", m.kind === "yours" && "bg-foreground/15")}
            />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted-foreground">
          {mix.map((m) => (
            <li key={m.kind} className="inline-flex items-center gap-1.5 tabular-nums">
              <TerritoryGlyph kind={m.kind} />
              {m.label} {m.value}%
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-start gap-2.5 border-t px-4 py-3 text-[13.5px] leading-snug">
        <CheckIcon className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        <span>
          <span className="font-medium">Fix:</span> swap the survival-show styling for a setting from your own territory.
        </span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- how */

const STEPS = [
  {
    title: "Name the brand and its rivals",
    body: "Up to three competitors, in the US or the UK. We suggest rivals from the brand’s own record.",
  },
  {
    title: "We read the taste graph",
    body: "About 150 to 250 Qloo queries per brand, run in parallel and cached, across podcasts, people, film, TV, artists, places and brands.",
  },
  {
    title: "Every claim carries evidence",
    body: "A strategist agent writes the plays. A critic rejects anything without a source, and anything that targets sensitive traits.",
  },
  {
    title: "Check the creative",
    body: "Run a draft through the ad check, see where it lands, and move it back into your territory before it ships.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-8 border-y bg-secondary/50">
      <div className="mx-auto grid max-w-[84rem] gap-12 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
        <div className="lg:sticky lg:top-12 lg:self-start">
          <Eyebrow>How it works</Eyebrow>
          <SectionTitle className="mt-5 max-w-[14ch]">From a brand name to a brief.</SectionTitle>
          <div className="relative mt-10 hidden aspect-[4/5] max-w-[26rem] overflow-hidden rounded-[22px] lg:block">
            <Image src={street} alt="A woman with a film camera sitting in a concrete stairwell" placeholder="blur" fill sizes="26rem" className="object-cover" />
          </div>
        </div>
        <ol className="divide-y border-y">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 py-8 sm:py-10">
              <span className="font-heading font-semibold text-[2.4rem] leading-none text-muted-foreground/70 tabular-nums">{i + 1}</span>
              <div>
                <h3 className="text-[1.3rem] font-medium tracking-[-0.02em]">{s.title}</h3>
                <p className="mt-2 max-w-[36rem] text-[15.5px] leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- music */

export function SoundNote() {
  return (
    <section className="mx-auto max-w-[84rem] px-4 py-24 sm:px-6 sm:py-32">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
        <blockquote className="font-heading font-semibold text-[2.1rem] leading-[1.12] tracking-[-0.025em] text-balance sm:text-[2.8rem]">
          &ldquo;Patagonia&rsquo;s buyers over-index on Lord Huron and Gregory Alan Isakov.&rdquo;
          <footer className="mt-6 font-sans text-[14px] tracking-normal text-muted-foreground">
            That tells you the mood and the world: acoustic, folk, outdoors. It isn&rsquo;t a track you can license.
          </footer>
        </blockquote>
        <div>
          <Eyebrow>On music</Eyebrow>
          <h2 className="mt-5 text-[1.9rem] font-medium leading-tight tracking-[-0.025em]">Artists are signals, not soundtracks.</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
            Brands can&rsquo;t run commercial music in ads without a licence. So the map turns an audience&rsquo;s music taste into a direction your team can fill from licensed libraries.
          </p>
          <ul className="mt-6 divide-y border-y text-[15px]">
            {[
              "A sound direction for TikTok’s Commercial Music Library or Meta’s Sound Collection",
              "A licensing flag when an ad uses a recognised commercial track",
              "Artists the audience loves, as collaboration leads with their own budget",
            ].map((t) => (
              <li key={t} className="flex gap-3 py-3.5">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- modes */

const MODES = [
  {
    name: "Business owner",
    line: "Guided. Type the brand, read the plays.",
    rows: [
      ["You bring", "Your brand, up to two competitors, your market"],
      ["You get", "A plain-English map, three concrete plays and an ad check"],
    ],
  },
  {
    name: "Agency strategist",
    line: "A workspace per client, with the agent on hand.",
    rows: [
      ["You bring", "Client brands, competitor sets and batches of ads"],
      ["You get", "Territory views by segment and city, competitor ad scans, exportable briefs"],
    ],
  },
];

export function Modes() {
  return (
    <section id="modes" className="mx-auto max-w-[84rem] scroll-mt-8 px-4 pb-24 sm:px-6 sm:pb-32">
      <Eyebrow>Two ways in</Eyebrow>
      <SectionTitle className="mt-5 max-w-[18ch]">One engine, for owners and agencies.</SectionTitle>
      <div className="mt-12 grid overflow-hidden rounded-[22px] border bg-card md:grid-cols-2 md:divide-x max-md:divide-y">
        {MODES.map((m) => (
          <div key={m.name} className="p-6 sm:p-9">
            <h3 className="font-heading font-semibold text-[2rem] tracking-[-0.02em]">{m.name}</h3>
            <p className="mt-1.5 text-[15px] text-muted-foreground">{m.line}</p>
            <dl className="mt-7 divide-y border-y">
              {m.rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 py-3.5 text-[14.5px]">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- closing */

export function ClosingCta() {
  return (
    <section className="p-2 sm:p-3">
      <div className="relative isolate overflow-hidden rounded-[22px] bg-neutral-900 px-5 py-24 text-center text-white sm:rounded-[28px] sm:py-32">
        <Image src={dusk} alt="" placeholder="blur" fill sizes="100vw" className="-z-10 object-cover object-[center_30%]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-black/45" />
        <h2 className="mx-auto max-w-[16ch] font-heading font-semibold text-[2.8rem] leading-[1.02] tracking-[-0.03em] text-balance sm:text-[4.2rem]">
          Know the culture before you brief the creative.
        </h2>
        <EmailCapture id="closing-email" className="mx-auto mt-10" />
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-[84rem] flex-col gap-6 px-4 py-10 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-center gap-4">
        <Logo className="text-foreground" />
        <span className="hidden sm:inline">Culture data from Qloo&rsquo;s taste graph.</span>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
        <Link href="/login" className="hover:text-foreground">Log in</Link>
        <Link href="/signup" className="hover:text-foreground">Create an account</Link>
        <a href="https://unsplash.com/license" className="hover:text-foreground">Photos: Unsplash</a>
      </nav>
    </footer>
  );
}
