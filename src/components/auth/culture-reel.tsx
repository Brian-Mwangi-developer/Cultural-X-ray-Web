"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import climber from "../../../public/images/culture-climber.jpg";
import court from "../../../public/images/culture-court.jpg";
import street from "../../../public/images/culture-street.jpg";

type Reading = {
  image: typeof climber;
  alt: string;
  eyebrow: string;
  title: string;
  facts: { label: string; value: string }[];
  note: string;
};

// Findings from the Qloo labs (plan.md §2 and §9), not invented examples.
const READINGS: Reading[] = [
  {
    image: climber,
    alt: "A climber pulling up a sandstone boulder",
    eyebrow: "Podcasts · Patagonia vs The North Face",
    title: "Wellbeing, not survival",
    facts: [
      { label: "Yours", value: "10% Happier" },
      { label: "Contested", value: "Rich Roll" },
      { label: "Theirs", value: "Jocko" },
    ],
    note: "Territory split · US market",
  },
  {
    image: court,
    alt: "An empty caged basketball court under an overpass",
    eyebrow: "Cities · Nike",
    title: "One brand, two home teams",
    facts: [
      { label: "New York City", value: "Yankees" },
      { label: "Los Angeles", value: "Lakers" },
    ],
    note: "Read by city · same brand seed",
  },
  {
    image: street,
    alt: "A woman with a film camera sitting in a concrete stairwell",
    eyebrow: "Price position · Gucci",
    title: "Who sits either side of you",
    facts: [
      { label: "Step down", value: "Bershka, H&M" },
      { label: "Step up", value: "Louis Vuitton, Dior" },
    ],
    note: "Income tiers · brand associations",
  },
];

const DURATION = 7000;

export function CultureReel({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reading = READINGS[index];

  const go = useCallback((step: number) => {
    setIndex((i) => (i + step + READINGS.length) % READINGS.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => go(1), DURATION);
    return () => window.clearTimeout(id);
  }, [index, paused, go]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="What a Culture Map shows"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={cn("relative isolate overflow-hidden rounded-[22px] bg-neutral-900", className)}
    >
      {READINGS.map((r, i) => (
        <Image
          key={r.title}
          src={r.image}
          alt={i === index ? r.alt : ""}
          aria-hidden={i !== index}
          fill
          priority={i === 0}
          placeholder="blur"
          sizes="(min-width: 1024px) 45vw, 0px"
          className={cn(
            "object-cover transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            i === index ? "scale-100 opacity-100" : "scale-[1.04] opacity-0",
          )}
        />
      ))}

      {/* Scrim so the reading card stays legible over bright skies. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/55 via-black/15 to-transparent" />

      <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
        <div className="relative overflow-hidden rounded-2xl bg-[oklch(0.22_0.02_55/0.42)] p-6 text-white ring-1 ring-white/20 ring-inset backdrop-blur-xl backdrop-saturate-150 sm:p-7">
          <div className="flex items-start justify-between gap-6">
            <div key={reading.title} className="min-w-0 animate-rise">
              <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-white/80 uppercase">
                <span className="size-1.5 shrink-0 rounded-full bg-ember" aria-hidden />
                {reading.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-[2rem] leading-[1.05] tracking-[-0.02em] text-balance">
                {reading.title}
              </h2>
            </div>
            <div className="flex shrink-0 gap-2">
              <ReelButton label="Previous reading" onClick={() => go(-1)}>
                <ChevronLeftIcon className="size-4" strokeWidth={1.75} />
              </ReelButton>
              <ReelButton label="Next reading" onClick={() => go(1)}>
                <ChevronRightIcon className="size-4" strokeWidth={1.75} />
              </ReelButton>
            </div>
          </div>

          <dl key={`${reading.title}-facts`} className="mt-5 flex flex-wrap gap-x-6 gap-y-3 animate-rise [animation-delay:80ms]">
            {reading.facts.map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="text-[11px] tracking-wide text-white/60">{f.label}</dt>
                <dd className="mt-0.5 text-[15px] font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 font-serif text-[15px] text-white/70 italic">{reading.note}</p>

          <div className="absolute inset-x-0 bottom-0 flex gap-1 px-6 sm:px-7" aria-hidden>
            {READINGS.map((r, i) => (
              <span key={r.title} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/15">
                <span
                  key={i === index ? `active-${index}` : r.title}
                  className={cn(
                    "block h-full origin-left rounded-full bg-ember",
                    i < index && "scale-x-100",
                    i > index && "scale-x-0",
                    i === index && "animate-[fill_linear_both] motion-reduce:animate-none motion-reduce:scale-x-100",
                  )}
                  style={i === index ? { animationDuration: `${DURATION}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
                />
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Reading {index + 1} of {READINGS.length}: {reading.title}
      </p>
    </section>
  );
}

function ReelButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-full text-white ring-1 ring-white/45 transition-[background-color,transform] duration-150 ring-inset hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-95"
    >
      {children}
    </button>
  );
}
