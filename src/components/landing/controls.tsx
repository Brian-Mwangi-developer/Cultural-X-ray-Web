"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MenuIcon, MoonIcon, PauseIcon, PlayIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Sun and moon in a glass pill over the film. The lit side follows the theme class, so the server and
 * the browser render the same thing; next-themes remembers the choice, and a first visit follows the device.
 */
export function ThemeSwitch({ className }: { className?: string }) {
  const { setTheme } = useTheme();
  const side = "flex size-[30px] items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
  return (
    <div role="group" aria-label="Theme" className={cn("flex gap-0.5 rounded-full border border-white/25 bg-white/12 p-[3px] backdrop-blur-md", className)}>
      <button type="button" aria-label="Light theme" onClick={() => setTheme("light")} className={cn(side, "bg-white text-[#111113] dark:bg-transparent dark:text-white dark:hover:bg-white/15")}>
        <SunIcon className="size-4" strokeWidth={2} />
      </button>
      <button type="button" aria-label="Dark theme" onClick={() => setTheme("dark")} className={cn(side, "text-white hover:bg-white/15 dark:bg-white dark:text-[#111113] dark:hover:bg-white")}>
        <MoonIcon className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}

/**
 * The hero's background film: a silent 22-second loop of owners at work. It starts only when the
 * device allows motion, and the corner button pauses it (anything that moves for more than five
 * seconds needs a way to stop it).
 */
export function HeroFilm() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) void video.current?.play().catch(() => undefined);
  }, []);

  return (
    <>
      <video
        ref={video}
        muted
        loop
        playsInline
        preload="metadata"
        poster="/landing/hero-poster.jpg"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover"
      >
        <source src="/landing/hero-loop-mobile.mp4" type="video/mp4" media="(max-width: 767px)" />
        <source src="/landing/hero-loop.mp4" type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={() => (playing ? video.current?.pause() : void video.current?.play())}
        aria-label={playing ? "Pause the background film" : "Play the background film"}
        className="absolute right-5 bottom-6 z-10 flex sm:right-auto sm:left-8 size-9 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        {playing ? <PauseIcon className="size-3.5" fill="currentColor" /> : <PlayIcon className="size-3.5" fill="currentColor" />}
      </button>
    </>
  );
}

/** The phone's menu: the same links, the theme switch, and the two ways in. */
export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button type="button" aria-label="Menu" className="flex size-10 items-center justify-center rounded-full bg-white/14 text-white backdrop-blur-md md:hidden" />}>
        <MenuIcon className="size-[18px]" />
      </SheetTrigger>
      <SheetContent side="right" className="landing w-[300px] bg-(--l-bg) text-(--l-fg)">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <nav className="flex flex-col gap-1 px-6 pt-16">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg py-2.5 text-[20px] font-light tracking-[-0.02em]">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="mt-8 flex flex-col gap-3 px-6">
          <Link href="/signup" className="rounded-full bg-ember py-3 text-center text-[15px] font-medium text-white">
            Check an ad free
          </Link>
          <Link href="/login" className="rounded-full border border-(--l-border) py-3 text-center text-[15px] font-medium">
            Log in
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * The launch film's player. Until the film is recorded (`src` is null) it says so instead of
 * pretending to play; once it's in /public/landing, set `src` and the same frame plays it inline.
 */
export function FilmPlayer({ src, poster, length, children }: { src: string | null; poster: string; length: string; children: React.ReactNode }) {
  const [playing, setPlaying] = useState(false);
  if (playing && src) {
    return <video src={src} poster={poster} controls autoPlay playsInline className="aspect-video w-full rounded-[28px] bg-black object-cover" />;
  }
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[20px] sm:rounded-[28px]">
      {children}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-9">
        <div className="text-white">
          <p className="text-[15px] font-medium sm:text-[17px]">The launch film</p>
          <p className="text-[13px] text-white/70 sm:text-[14px]">{src ? `${length} · captions on` : "Coming soon"}</p>
        </div>
        {src && (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Play the launch film"
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-ember text-white shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/70 sm:size-24"
          >
            <PlayIcon className="size-6 translate-x-0.5 sm:size-8" fill="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
}
