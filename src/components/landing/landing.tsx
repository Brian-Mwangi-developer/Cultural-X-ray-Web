import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, PlayIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { FilmPlayer, HeroFilm, MobileMenu, ThemeSwitch } from "@/components/landing/controls";
import { cn } from "@/lib/utils";

/*
 * The landing page (Figma 26 · Landing revamp, L1–L4). Brand-led: a film of real owners, then real
 * small-business ads with X-Ray's notes on them, then the product over real businesses. Every
 * section after the film follows the light or dark theme (.landing tokens in globals.css).
 * Footage: Pexels, graded warm (public/landing/CREDITS.md).
 */

/** The launch film of the software. Set `src` once it's recorded into /public/landing. */
/** The launch film, streamed from Vercel Blob (source project: qloo/film). The cover is a local copy of its poster. */
const FILM_BLOB = "https://aljgcmbgqqymfiyc.public.blob.vercel-storage.com/landing/launch-film";
const FILM = {
  src: `${FILM_BLOB}/cultural-xray-launch-film.mp4` as string | null,
  poster: `${FILM_BLOB}/cultural-xray-launch-film-poster.jpg`,
  captions: `${FILM_BLOB}/cultural-xray-launch-film.vtt`,
  cover: "/landing/film-poster.webp",
  length: "3:43",
};

const LINKS = [
  { href: "#ad-check", label: "Ad check" },
  { href: "#briefs", label: "Briefs" },
  { href: "#agencies", label: "For agencies" },
  { href: "#film", label: "The film" },
  { href: "#questions", label: "Questions" },
];

const CULTURE = ["Podcasts", "TV", "Films", "Creators", "Music", "Places", "Brands", "Books"];

const wrap = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";
const display = "font-light tracking-[-0.045em] text-balance";

export function Landing() {
  return (
    <div className="landing bg-(--l-bg) text-(--l-fg)">
      <Hero />
      <Ticker />
      <main>
        <AdWall />
        <Trio />
        <Film />
        <ForWho />
        <HowItWorks />
        <Questions />
      </main>
      <Closing />
      <Footer />
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

function Pill({ href, children, tone = "ember", className }: { href: string; children: React.ReactNode; tone?: "ember" | "white" | "ghost"; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ember/40",
        tone === "ember" && "bg-ember text-white hover:bg-[#f05a0e]",
        tone === "white" && "bg-white text-[#111113] hover:bg-white/90",
        tone === "ghost" && "border border-white/50 text-white hover:bg-white/10",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Two-tone statement: the claim, then the point in ember. */
function Statement({ first, rest, className, as: Tag = "h2" }: { first: string; rest: string; className?: string; as?: "h2" | "p" }) {
  return (
    // Line height last: tailwind-merge drops `leading-*` when a text size follows it.
    <Tag className={cn(display, className, "leading-[1.08]")}>
      {first} <span className="text-(--l-accent)">{rest}</span>
    </Tag>
  );
}

type Kind = "yours" | "fix" | "ok";
function Glyph({ kind }: { kind: Kind }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", kind === "yours" && "bg-ember", kind === "fix" && "border-2 border-ember", kind === "ok" && "bg-[#15803d]")} />;
}

/** X-Ray's note, as it sits over an ad. Always a white card, whatever the theme. */
function Note({ kind, title, children, className }: { kind: Kind; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-[226px] rounded-[14px] bg-white px-3.5 py-3 text-[#111113] shadow-[0_18px_44px_-10px_rgba(0,0,0,0.35)] ring-1 ring-black/5", className)}>
      <p className={cn("flex items-center gap-1.5 text-[12px] font-semibold", kind === "ok" ? "text-[#15803d]" : "text-[#c2410c]")}>
        <Glyph kind={kind} />
        {title}
      </p>
      <p className="mt-1 text-[13.5px] leading-[1.38]">{children}</p>
    </div>
  );
}

/** A small business's ad as it would run: tall creative, sponsor bar, its own line. */
function AdCard({ img, brand, line, className }: { img: string; brand: string; line: string; className?: string }) {
  return (
    <div className={cn("relative aspect-[9/16] overflow-hidden rounded-[18px] bg-black", className)}>
      <Image src={img} alt="" fill sizes="(max-width: 768px) 50vw, 240px" className="object-cover" />
      <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/75 to-transparent" />
      <div className="absolute top-3 left-3 flex items-center gap-2 text-white">
        <span className="flex size-[26px] items-center justify-center rounded-full bg-white text-[11.5px] font-bold text-[#111113]">{brand[0]}</span>
        <span className="leading-tight">
          <span className="block text-[12px] font-semibold">{brand}</span>
          <span className="block text-[10.5px] text-white/75">Sponsored</span>
        </span>
      </div>
      <div className="absolute inset-x-3.5 bottom-3.5">
        <p className="text-[17px] leading-[1.12] font-semibold tracking-[-0.01em] text-white sm:text-[19px]">{line}</p>
        <span className="mt-2.5 inline-block rounded-lg bg-white/92 px-3 py-1.5 text-[11.5px] font-semibold text-[#111113]">Order now</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- sections */

function Hero() {
  return (
    <header className="relative isolate flex min-h-[640px] flex-col overflow-hidden bg-black text-white sm:h-[min(920px,100svh)] sm:min-h-[720px]">
      <HeroFilm />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/78 via-black/25 to-transparent max-sm:bg-linear-to-b max-sm:from-black/35 max-sm:via-black/20 max-sm:to-black/85" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-b from-transparent to-black/60" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-b from-black/55 to-transparent" />

      <div className="relative z-10 flex items-center justify-between gap-6 px-5 py-5 sm:px-8 lg:px-[120px] lg:py-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-md text-[18px] font-semibold tracking-[-0.02em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
          <LogoMark className="size-7 text-white" />
          Cultural X-Ray
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[15px] text-white/88 transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-5">
          <ThemeSwitch />
          <Link href="/login" className="hidden text-[15px] md:inline">
            Log in
          </Link>
          <Pill href="/signup" tone="white" className="hidden h-10 px-5 text-[15px] md:inline-flex">
            Start free
          </Pill>
          <MobileMenu links={LINKS} />
        </div>
      </div>

      <div className="relative z-10 mt-auto mb-16 px-5 sm:mb-auto sm:px-8 sm:pt-24 lg:px-[120px] lg:pt-36">
        <h1 className={cn(display, "max-w-[720px] text-[46px] leading-[1] sm:text-[72px] lg:text-[92px] lg:leading-[0.98]")}>Most ads fail before anyone sees them.</h1>
        <p className="mt-6 max-w-[560px] text-[16.5px] leading-[1.48] text-white/86 sm:mt-8 sm:text-[21px]">
          Cultural X-Ray shows you what fills your customers&rsquo; lives, the shows, podcasts and places they love, and makes sure your ad speaks to it before you pay to run it.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3.5">
          <Pill href="/signup">Check an ad free</Pill>
          <Pill href="#how" tone="ghost" className="max-sm:hidden">
            See how it works
          </Pill>
          <a href="#film" className="flex items-center gap-2.5 text-[15px] font-medium sm:hidden">
            <span className="flex size-[26px] items-center justify-center rounded-full bg-ember">
              <PlayIcon className="size-3 translate-x-px" fill="currentColor" />
            </span>
            {FILM.src ? `Watch the film · ${FILM.length}` : "The film · coming soon"}
          </a>
        </div>
      </div>

      <a href="#film" className="group absolute right-8 bottom-24 z-10 hidden h-[156px] w-[260px] overflow-hidden rounded-[14px] ring-1 ring-white/35 lg:right-[120px] lg:block">
        <Image src={FILM.src ? FILM.cover : "/landing/f-tablet.webp"} alt="" fill sizes="260px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute inset-0 bg-black/35" />
        <span className="absolute bottom-3.5 left-3.5 flex items-center gap-2 text-[13.5px] font-medium">
          <span className="flex size-[22px] items-center justify-center rounded-full bg-ember">
            <PlayIcon className="size-2.5 translate-x-px" fill="currentColor" />
          </span>
          {FILM.src ? `Watch the film · ${FILM.length}` : "The film · coming soon"}
        </span>
      </a>
    </header>
  );
}

/**
 * What we read, moving on repeat. The strip is two identical halves sliding left by one half, so the
 * loop never jumps; each half repeats the list three times so it's wider than any screen.
 */
function Ticker() {
  const half = [...CULTURE, ...CULTURE, ...CULTURE];
  const items = [...half, ...half];
  return (
    <div className="overflow-hidden bg-ember py-4 text-white sm:py-[22px]" aria-label={`Read against ${CULTURE.join(", ")}`}>
      <ul aria-hidden className="flex w-max animate-marquee items-center [animation-duration:110s] hover:[animation-play-state:paused]">
        {items.map((w, i) => (
          <li key={i} className="flex items-center">
            <span className="px-5 text-[20px] font-light tracking-[-0.02em] sm:px-7 sm:text-[30px]">{w}</span>
            <svg viewBox="0 0 12 12" className="size-2.5 text-white/80 sm:size-3" aria-hidden>
              <path d="M6 0 7.2 4.8 12 6 7.2 7.2 6 12 4.8 7.2 0 6 4.8 4.8Z" fill="currentColor" />
            </svg>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ADS = [
  { img: "/landing/ad-pizza.webp", brand: "O'liery Pizza", line: "Wood-fired since 1998." },
  { img: "/landing/ad-gelato.webp", brand: "Jude's", line: "A scoop of summer." },
  { img: "/landing/ad-bakery.webp", brand: "GAIL's Bakery", line: "Baked this morning, round the corner." },
  { img: "/landing/ad-latte.webp", brand: "Bean & Bloom", line: "Your morning, slowed down." },
  { img: "/landing/ad-oven.webp", brand: "Dough & Co", line: "Stone-oven bread, every day." },
];

function AdWall() {
  return (
    <section id="ad-check" className="scroll-mt-6 pt-20 pb-24 sm:pt-24 sm:pb-[120px]">
      <div className={wrap}>
        <Statement first="People don't stop for ads." rest="They stop for things that feel like their own life." className="max-w-[1060px] text-[32px] sm:text-[44px] lg:text-[56px]" />
      </div>

      {/* Desktop: five ads in a staggered row, X-Ray's notes floating over them. */}
      <div className={cn(wrap, "relative mt-14 hidden lg:block")}>
        <div aria-hidden className="absolute inset-x-[20%] top-16 h-[360px] rounded-full bg-(--l-glow) blur-[120px]" />
        <div className="relative grid grid-cols-5 gap-2.5">
          {ADS.map((a, i) => (
            <AdCard key={a.brand} {...a} className={i % 2 ? "mt-12" : ""} />
          ))}
          <Note kind="fix" title="Fix before it runs" className="absolute top-[150px] left-[11%]">
            Your name first shows at 0:15. Put it in the first two seconds.
          </Note>
          <Note kind="yours" title="Feels like their life" className="absolute top-[150px] left-[31%]">
            Country walks and summer afternoons: your customers live this.
          </Note>
          <Note kind="fix" title="Could be anyone's" className="absolute top-[140px] left-[56.5%]">
            Latte art on its own feels generic. Show your regulars and your room.
          </Note>
          <Note kind="ok" title="Ready to run" className="absolute top-[120px] right-0">
            Name and bread in the first second. Ends on where to find you.
          </Note>
        </div>
      </div>

      {/* Phone and tablet: the ads scroll sideways, one note on the first. */}
      <div className="relative mt-10 lg:hidden">
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:px-8">
          {ADS.map((a) => (
            <AdCard key={a.brand} {...a} className="w-[62vw] max-w-[240px] shrink-0 snap-start" />
          ))}
        </div>
        <Note kind="fix" title="Fix before it runs" className="absolute top-[32%] left-[18vw] w-[200px] sm:left-[180px]">
          Your name first shows at 0:15.
        </Note>
      </div>

      <div className={cn(wrap, "mt-12 flex flex-col gap-6 sm:mt-16 sm:flex-row sm:items-center sm:justify-between")}>
        <p className="max-w-[620px] text-[16px] leading-[1.5] text-(--l-muted) sm:text-[17px]">
          Every ad is read against what its customers actually love: the podcasts, shows, creators and places in their lives, from Qloo&rsquo;s data on real tastes.
        </p>
        <Pill href="/signup" className="self-start sm:self-auto">
          Check an ad free
        </Pill>
      </div>
    </section>
  );
}

function Panel({ id, img, title, body, children, overlay }: { id?: string; img: string; title: string; body: string; children: React.ReactNode; overlay: string }) {
  return (
    <div id={id} className="scroll-mt-6">
      <div className="relative aspect-[386/470] overflow-hidden rounded-[22px]">
        <Image src={img} alt="" fill sizes="(max-width: 1024px) 100vw, 386px" className="object-cover" />
        <div className="absolute inset-0 bg-black/18" />
        <div className={cn("absolute", overlay)}>{children}</div>
      </div>
      <h3 className="mt-5 text-[21px] tracking-[-0.02em] sm:mt-6 sm:text-[22px]">{title}</h3>
      <p className="mt-2 max-w-[360px] text-[15.5px] leading-[1.5] text-(--l-muted)">{body}</p>
    </div>
  );
}

function Chip({ kind, children }: { kind: Kind; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f4f2] px-2.5 py-1 text-[12px] text-[#111113]">
      <Glyph kind={kind} />
      {children}
    </span>
  );
}

function Trio() {
  return (
    <section className="pb-24 sm:pb-[140px]">
      <div className={wrap}>
        <Statement first="One place to get every ad right." rest="Check it, fix it, then brief the next one." className="max-w-[900px] text-[30px] sm:text-[44px]" />
        <div className="mt-12 grid gap-12 sm:mt-14 lg:grid-cols-3 lg:gap-5">
          <Panel img="/landing/f-tablet.webp" title="Check an ad before it runs" body="Upload a draft. See what speaks to your customers, what feels generic, and what to fix first." overlay="inset-x-[8%] bottom-[8%]">
            <div className="rounded-2xl bg-white p-4 text-[#111113] shadow-[0_18px_44px_-10px_rgba(0,0,0,0.35)]">
              <p className="flex items-center gap-2.5 text-[13px] font-semibold">
                <span className="relative size-[34px] overflow-hidden rounded-lg">
                  <Image src="/landing/ad-bakery.webp" alt="" fill sizes="34px" className="object-cover" />
                </span>
                Morning bake · GAIL&rsquo;s
              </p>
              <p className="mt-3 text-[16px] leading-[1.25] font-semibold">Speaks to your regulars. One shot could be anyone&rsquo;s.</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip kind="yours">Weekend baking</Chip>
                <Chip kind="yours">Slow mornings</Chip>
                <Chip kind="fix">Generic wellness</Chip>
              </div>
            </div>
          </Panel>
          <Panel img="/landing/f-phone.webp" title="Fix it in one tap" body="Re-cuts for TikTok, Reels and the feed, with your changes, ready to download." overlay="top-[8%] right-[8%] w-[250px] max-w-[80%]">
            <div className="rounded-2xl bg-white p-3.5 text-[#111113] shadow-[0_18px_44px_-10px_rgba(0,0,0,0.35)]">
              <div className="inline-flex gap-1 rounded-full bg-[#f5f4f2] p-[3px] text-[12px]">
                <span className="rounded-full bg-white px-3 py-1 font-semibold shadow-sm">9:16</span>
                <span className="px-3 py-1 text-[#71717a]">1:1</span>
                <span className="px-3 py-1 text-[#71717a]">16:9</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-[13px]">
                {["Name in the first two seconds", "Square for the feed", "Ends on where to find you"].map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <CheckIcon className="size-3.5 text-[#15803d]" strokeWidth={3} />
                    {s}
                  </li>
                ))}
              </ul>
              <span className="mt-3 inline-block rounded-full bg-[#111113] px-3.5 py-2 text-[13px] font-medium text-white">Download all</span>
            </div>
          </Panel>
          <Panel id="briefs" img="/landing/f-laptop.webp" title="Brief the next one" body="A brief built from your customers' culture, for your designer or agency." overlay="inset-x-[8%] bottom-[8%]">
            <div className="rounded-2xl bg-white p-4 text-[#111113] shadow-[0_18px_44px_-10px_rgba(0,0,0,0.35)]">
              <p className="text-[10.5px] font-medium tracking-[0.06em] text-[#c2410c] uppercase">Creative brief · Autumn bake</p>
              <p className="mt-2 text-[15px] font-semibold">Where to show up</p>
              <p className="mt-1 text-[13px] leading-[1.42]">Market towns like Padstow and Rye, on crisp autumn mornings.</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip kind="yours">Padstow</Chip>
                <Chip kind="yours">Rye</Chip>
                <Chip kind="yours">Ravneet Gill</Chip>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

function Film() {
  return (
    <section id="film" className="scroll-mt-6 pb-24 sm:pb-[140px]">
      <div className={wrap}>
        <Statement first="See it work." rest="Under four minutes: one bakery, one ad, one brief." className="text-center text-[30px] sm:text-[44px]" />
        <div className="mt-10">
          <FilmPlayer src={FILM.src} poster={FILM.poster} captions={FILM.captions} length={FILM.length}>
            <Image src={FILM.cover} alt="" fill sizes="(max-width: 1200px) 100vw, 1200px" className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
          </FilmPlayer>
        </div>
      </div>
    </section>
  );
}

function ForWho() {
  const cards = [
    { id: undefined, img: "/landing/f-owner.webp", title: "Business owners", body: "You run the shop and the ads. No marketing team needed, and no dashboards of scores.", list: ["Check every ad before you boost it", "Re-cuts sized for every channel", "A brief to hand your designer"] },
    { id: "agencies", img: "/landing/f-agency.webp", title: "Agencies", body: "A workspace per client, with the brand's say over what you can do.", list: ["Make every client ad feel local, in minutes", "Briefs your creatives can trace back", "Share links and PDFs for sign-off"] },
  ];
  return (
    <section className="pb-24 sm:pb-[120px]">
      <div className={wrap}>
        <Statement first="Built for the people who run the shop." rest="And the agencies who make their ads." className="max-w-[1000px] text-[30px] sm:text-[44px] lg:text-[52px]" />
        <div className="mt-12 grid gap-12 sm:mt-14 md:grid-cols-2 md:gap-6">
          {cards.map((c) => (
            <div key={c.title} id={c.id} className="scroll-mt-6">
              <div className="relative aspect-[588/440] overflow-hidden rounded-[24px]">
                <Image src={c.img} alt="" fill sizes="(max-width: 768px) 100vw, 588px" className="object-cover" />
              </div>
              <h3 className="mt-6 text-[26px] tracking-[-0.03em] sm:text-[28px]">{c.title}</h3>
              <p className="mt-2 max-w-[540px] text-[16.5px] leading-[1.5] text-(--l-muted)">{c.body}</p>
              <ul className="mt-5 space-y-2.5 text-[16px]">
                {c.list.map((s) => (
                  <li key={s} className="flex items-center gap-2.5">
                    <ArrowRightIcon className="size-4 text-(--l-accent)" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["01", "Tell us your business", "Your name, your town, and up to three places you compete with."],
    ["02", "We read your customers' culture", "What people like them listen to, watch, follow and visit."],
    ["03", "Check your ads", "Plain words on what to fix, re-cuts ready to post, and a brief for the next one."],
  ];
  return (
    <section id="how" className="scroll-mt-6 bg-(--l-warm) py-20 sm:py-[110px]">
      <div className={wrap}>
        <Statement first="Ten minutes to your first read." rest="No setup calls." className="text-[30px] sm:text-[44px]" />
        <ol className="mt-12 grid gap-10 sm:mt-14 md:grid-cols-3 md:gap-8">
          {steps.map(([n, t, b]) => (
            <li key={n} className="border-t border-(--l-border) pt-7">
              <p className="text-[56px] leading-none font-light tracking-[-0.05em] text-ember sm:text-[64px]">{n}</p>
              <h3 className="mt-4 text-[21px] tracking-[-0.02em]">{t}</h3>
              <p className="mt-2 max-w-[340px] text-[16px] leading-[1.5] text-(--l-muted)">{b}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Questions() {
  const qa = [
    ["Do I need to know marketing?", "No. Everything is in plain words: what's working, what to change, and why."],
    ["Where does the culture data come from?", "From Qloo, which knows what millions of people like across podcasts, TV, film, music, places and brands."],
    ["Do you post the ads for me?", "No. You keep running ads where you do now. We tell you what to fix and give you the files."],
    ["What does it cost?", "Your first checks and brief are free. No card needed."],
  ];
  return (
    <section id="questions" className="scroll-mt-6 py-20 sm:py-[120px]">
      <div className={cn(wrap, "grid gap-10 lg:grid-cols-[380px_1fr] lg:gap-20")}>
        <h2 className={cn(display, "text-[30px] sm:text-[44px]", "leading-[1.08]")}>Questions, answered.</h2>
        <dl>
          {qa.map(([q, a], i) => (
            <div key={q} className={cn("py-6", i > 0 && "border-t border-(--l-border)")}>
              <dt className="text-[18px] sm:text-[19px]">{q}</dt>
              <dd className="mt-2 text-[16px] leading-[1.5] text-(--l-muted)">{a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="relative isolate overflow-hidden bg-black py-28 text-center text-white sm:py-40">
      <Image src="/landing/f-phone.webp" alt="" fill sizes="100vw" className="-z-10 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/45" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-transparent to-ember/55" />
      <div className={wrap}>
        <h2 className={cn(display, "mx-auto max-w-[900px] text-[40px] leading-[1.02] sm:text-[64px] lg:text-[80px] lg:leading-none")}>Check your next ad before it runs.</h2>
        <p className="mt-6 text-[16px] text-white/80 sm:text-[19px]">Two minutes to set up. Your first checks are free.</p>
        <Pill href="/signup" className="mt-8">
          Start free
        </Pill>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { h: "Product", items: [["Ad check", "#ad-check"], ["Re-cuts", "#ad-check"], ["Briefs", "#briefs"], ["Culture map", "#how"]] },
    { h: "For", items: [["Business owners", "#ad-check"], ["Agencies", "#agencies"]] },
    { h: "Company", items: [["The film", "#film"], ["Log in", "/login"], ["Create an account", "/signup"]] },
  ];
  return (
    <footer className="pt-16 pb-10 sm:pt-[72px] sm:pb-12">
      <div className={wrap}>
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          <div>
            <p className="flex items-center gap-2.5 text-[18px] font-semibold tracking-[-0.02em]">
              <LogoMark className="size-7" />
              Cultural X-Ray
            </p>
            <p className="mt-3 text-[15px] text-(--l-muted)">Ads and briefs that speak to your customers&rsquo; culture.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-[72px]">
            {cols.map((c) => (
              <div key={c.h}>
                <p className="text-[13.5px] text-(--l-muted)">{c.h}</p>
                <ul className="mt-3 space-y-2.5 text-[15px]">
                  {c.items.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="opacity-85 transition-opacity hover:opacity-100">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-2 border-t border-(--l-border) pt-6 text-[13px] text-(--l-muted) sm:flex-row">
          <p>© 2026 Cultural X-Ray</p>
          <p>Culture data from Qloo · Footage from Pexels</p>
        </div>
      </div>
    </footer>
  );
}
