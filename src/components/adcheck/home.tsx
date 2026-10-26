"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRightIcon, CheckIcon, ChevronRightIcon, CircleAlertIcon, LoaderCircleIcon, LockIcon, MapIcon, UploadIcon } from "lucide-react";
import { PageHeader, Panel, PanelRows, Status, TerritoryGlyph } from "@/components/app/parts";
import { PageBody, TopBar } from "@/components/shell/top-bar";
import { Button, buttonVariants } from "@/components/ui/button";
import { probeFile } from "@/components/adcheck/frames";
import { Upload } from "@/components/adcheck/upload";
import { type AdSummary, ago, leanWord, MAX_BYTES, MAX_SECONDS, megabytes, reading, seconds, VIDEO_TYPES } from "@/lib/ads";
import { cn } from "@/lib/utils";
import cows from "../../../public/images/adcheck-cows.jpg";
import friends from "../../../public/images/adcheck-friends.jpg";
import promenade from "../../../public/images/adcheck-promenade.jpg";

/** A chosen file, with a local URL for previews (made once here, revoked when the person cancels). */
export type Picked = { file: File; url: string; durationMs: number; width: number; height: number };

/**
 * R1: the ad check's home. Empty, it shows what the page works on and what you get; with checks,
 * the drop target shrinks above the list. Picking a video moves straight to R2 (set up the check
 * while it uploads).
 */
export function AdCheckHome({ orgId, slug, initial, rivals, canCreate, hasMap }: { orgId: string; slug: string; initial: AdSummary[]; rivals: string[]; canCreate: boolean; hasMap: boolean }) {
  const [picked, setPicked] = useState<Picked | null>(null);

  if (picked)
    return (
      <Upload
        orgId={orgId}
        slug={slug}
        picked={picked}
        rivals={rivals}
        onCancel={() => {
          URL.revokeObjectURL(picked.url);
          setPicked(null);
        }}
      />
    );

  const empty = initial.length === 0;
  return (
    <>
      <TopBar crumbs={[{ label: "Ad check" }]} actions={!empty && canCreate && hasMap ? <PickButton onPick={setPicked} size="pill" label="Check an ad" /> : undefined} />
      <PageBody>
        <div className="mx-auto max-w-[1100px] space-y-7">
          <PageHeader
            eyebrow="Ad check"
            title="Check an ad before you spend on it"
            description="Upload a draft or a finished ad. We watch it the way your customers would and tell you, in plain words, whose culture it speaks to."
          />

          {!hasMap ? (
            <NeedsMap slug={slug} />
          ) : canCreate ? (
            <DropZone onPick={setPicked} compact={!empty} />
          ) : empty ? (
            <p className="rounded-[14px] border border-dashed bg-muted/40 px-6 py-8 text-center text-[14px] text-muted-foreground">No ads have been checked yet. Owners, admins and strategists can upload one.</p>
          ) : null}

          {!empty && <AdList ads={initial} slug={slug} />}
          {empty && <WhatYouGet rivals={rivals} />}

          <p className="flex items-center gap-2 text-[12.5px] text-faint">
            <LockIcon className="size-3.5 shrink-0" aria-hidden />
            Your videos stay private to this workspace and are deleted after 14 days. We never identify people from their faces.
          </p>
        </div>
      </PageBody>
    </>
  );
}

/* ------------------------------------------------------------ picking */

function usePicker(onPick: (p: Picked) => void) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function take(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!VIDEO_TYPES.includes(file.type)) return setError("That isn’t a video we can read. Use an MP4, MOV or WebM file.");
    if (file.size > MAX_BYTES) return setError(`That file is ${megabytes(file.size)}. Videos can be up to 1 GB.`);
    setChecking(true);
    const probe = await probeFile(file);
    setChecking(false);
    if (!probe) return setError("We couldn’t open that video. Try exporting it again as MP4.");
    if (probe.durationMs > MAX_SECONDS * 1000 + 500) return setError(`This ad is ${seconds(probe.durationMs)}. Ads can be up to ${MAX_SECONDS} seconds; trim it and try again.`);
    onPick({ file, url: URL.createObjectURL(file), ...probe });
  }

  const field = (
    <input
      ref={input}
      type="file"
      accept={VIDEO_TYPES.join(",")}
      className="sr-only"
      tabIndex={-1}
      aria-hidden
      onChange={(e) => {
        void take(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );
  return { open: () => input.current?.click(), take, field, error, checking };
}

function PickButton({ onPick, size = "cta", label = "Choose a video" }: { onPick: (p: Picked) => void; size?: "cta" | "pill"; label?: string }) {
  const picker = usePicker(onPick);
  return (
    <>
      {picker.field}
      <Button size={size} onClick={picker.open} disabled={picker.checking}>
        {picker.checking ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : <UploadIcon data-icon="inline-start" />}
        {label}
      </Button>
    </>
  );
}

function DropZone({ onPick, compact }: { onPick: (p: Picked) => void; compact: boolean }) {
  const picker = usePicker(onPick);
  const [over, setOver] = useState(false);
  const depth = useRef(0);

  return (
    <section
      aria-label="Upload an ad"
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current++;
        setOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        void picker.take(e.dataTransfer.files[0]);
      }}
      className={cn(
        "@container relative rounded-[22px] border-[1.5px] border-dashed transition-colors duration-200",
        over ? "border-ember bg-ember-soft" : "bg-muted/60 hover:border-foreground/20",
        compact ? "px-6 py-5" : "px-6 py-8 md:px-12 md:py-11",
      )}
    >
      {picker.field}
      {compact ? (
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ember text-white">
            <UploadIcon className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold tracking-[-0.01em]">{over ? "Drop it to start" : "Drop another ad here"}</p>
            <p className="text-[13px] text-muted-foreground">MP4, MOV or WebM · up to {MAX_SECONDS} seconds · up to 1 GB</p>
          </div>
          <Button variant="outline" size="pill" onClick={picker.open} disabled={picker.checking}>
            {picker.checking ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : <UploadIcon data-icon="inline-start" />}
            Choose a video
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-10 @3xl:flex-row @3xl:gap-12">
          <Fan over={over} />
          <div className="max-w-[440px] text-center @3xl:text-left">
            <h2 className="text-[24px] leading-tight font-semibold tracking-[-0.025em]">{over ? "Drop it to start" : "Drop your ad here"}</h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
              We’ll show which culture it speaks to, shot by shot, and what to change so it leans your way. Nothing is posted anywhere.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5 @3xl:justify-start">
              <Button size="cta" onClick={picker.open} disabled={picker.checking}>
                {picker.checking ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : <UploadIcon data-icon="inline-start" />}
                {picker.checking ? "Opening…" : "Choose a video"}
              </Button>
            </div>
            <ul className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[12.5px] text-muted-foreground @3xl:justify-start">
              {["MP4, MOV or WebM", `Up to ${MAX_SECONDS} seconds`, "Up to 1 GB"].map((s) => (
                <li key={s} className="inline-flex items-center gap-1.5">
                  <CheckIcon className="size-3.5" strokeWidth={2} aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {picker.error && (
        <p role="alert" className="mt-4 flex items-start justify-center gap-2 text-[13.5px] text-destructive @3xl:justify-start">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {picker.error}
        </p>
      )}
    </section>
  );
}

/** Frames from a real ad, fanned behind the upload disc: what the page works on, before anything is uploaded. */
function Fan({ over }: { over: boolean }) {
  const frames = [
    { src: friends, alt: "", className: "left-[2%] top-[30%] w-[42%] -rotate-[9deg]" },
    { src: promenade, alt: "", className: "right-[0%] top-[22%] w-[47%] rotate-[4deg]" },
    { src: cows, alt: "", className: "left-[27%] top-[4%] w-[44%] -rotate-[3deg]" },
  ];
  return (
    <div className={cn("relative aspect-[52/30] w-full max-w-[460px] shrink-0 transition-transform duration-300 ease-out", over && "scale-[1.03]")} aria-hidden>
      {frames.map((f, i) => (
        <div key={i} className={cn("absolute aspect-[22/15] overflow-hidden rounded-[12px] border-4 border-white dark:border-zinc-700", f.className)}>
          <Image src={f.src} alt={f.alt} fill sizes="220px" className="object-cover" placeholder="blur" />
        </div>
      ))}
      <span className="absolute bottom-[2%] left-1/2 flex size-16 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-ember text-white dark:border-background">
        <UploadIcon className="size-6" strokeWidth={2} />
      </span>
    </div>
  );
}

function NeedsMap({ slug }: { slug: string }) {
  return (
    <section className="flex flex-wrap items-center gap-5 rounded-[18px] border bg-card px-6 py-6">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted">
        <MapIcon className="size-5 text-foreground/80" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">Build your Culture Map first</p>
        <p className="mt-0.5 text-[13.5px] text-muted-foreground">An ad is checked against your customers’ culture and your rivals’. It takes about a minute.</p>
      </div>
      <Link href={`/${slug}/map`} className={buttonVariants({ size: "pill" })}>
        Go to Culture Map
        <ArrowRightIcon data-icon="inline-end" />
      </Link>
    </section>
  );
}

/* --------------------------------------------------------------- list */

function AdList({ ads, slug }: { ads: AdSummary[]; slug: string }) {
  return (
    <Panel title="Your ad checks" action={`${ads.length} ${ads.length === 1 ? "ad" : "ads"}`}>
      <PanelRows>
        {ads.map((ad) => {
          const lean = leanWord(ad.lean, ad.rival);
          return (
            <Link key={ad.id} href={`/${slug}/ad-check/${ad.id}`} className="group flex items-center gap-4 px-[18px] py-[var(--row-y)] transition-colors hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-medium">{ad.title}</p>
                <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground tabular-nums">
                  {[seconds(ad.durationMs), ad.shotCount ? `${ad.shotCount} shots` : null, ad.uploadedBy?.name, ago(ad.createdAt)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="hidden shrink-0 sm:block">
                {reading(ad.status) ? (
                  <Status icon={LoaderCircleIcon} attention className="[&_svg]:animate-spin">
                    Reading{ad.stage ? ` · ${ad.stage}` : ""}
                  </Status>
                ) : ad.status === "FAILED" ? (
                  <Status icon={CircleAlertIcon} attention>
                    Couldn’t read it
                  </Status>
                ) : ad.lean ? (
                  <span className="inline-flex items-center gap-1.5 text-[13px]">
                    {lean.glyph && <TerritoryGlyph kind={lean.glyph} decorative />}
                    {lean.word}
                  </span>
                ) : (
                  <span className="text-[13px] text-muted-foreground">Read</span>
                )}
              </div>
              <ChevronRightIcon className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          );
        })}
      </PanelRows>
    </Panel>
  );
}

/* ------------------------------------------------------- what you get */

function WhatYouGet({ rivals }: { rivals: string[] }) {
  const rival = rivals[0] ?? "a rival";
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Value n="1" title="Where it lands" body="Which moments speak to your customers, and which to a rival’s.">
        <div className="w-full max-w-[260px] space-y-2">
          {(
            [
              ["theirs", `Skateboarding · ${rival}`],
              ["contested", "Family dinner · shared"],
              ["yours", "Cozy nights in · yours"],
            ] as const
          ).map(([k, s]) => (
            <div key={k} className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-[12px] text-foreground/80">
              <TerritoryGlyph kind={k} decorative />
              <span className="truncate">{s}</span>
            </div>
          ))}
        </div>
      </Value>
      <Value n="2" title="Shot by shot" body="Every shot described and placed, with the words and music that pull it one way or the other.">
        <div className="flex items-center gap-1" aria-hidden>
          {(
            [
              [friends, "contested", 1.2],
              [cows, "yours", 1],
              [promenade, "theirs", 0.8],
              [cows, "yours", 1.1],
              [friends, "contested", 0.9],
            ] as const
          ).map(([src, kind, w], i) => (
            <span key={i} className={cn("relative h-12 overflow-hidden rounded-[6px]", i === 1 && "ring-2 ring-ember ring-offset-1 ring-offset-muted")} style={{ width: `${w * 44}px` }}>
              <Image src={src} alt="" fill sizes="60px" className="object-cover" />
              <span className="absolute top-1 left-1 flex size-4 items-center justify-center rounded-full bg-black/60 text-white">
                <TerritoryGlyph kind={kind} decorative className="size-2" />
              </span>
            </span>
          ))}
        </div>
      </Value>
      <Value n="3" title="What to change" body="Reshoot notes for the moments that pull toward a rival. Suggested re-cuts are coming next.">
        <div className="w-full max-w-[250px] rounded-lg border bg-card px-3 py-2.5 text-[12px] leading-snug text-foreground/80">
          <p className="font-medium text-foreground">Shot 2</p>
          <p className="mt-0.5">“Skateboarding” pulls toward {rival}.</p>
        </div>
      </Value>
    </div>
  );
}

function Value({ n, title, body, children }: { n: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[16px] border bg-card p-5">
      <div className="flex h-28 items-center justify-center rounded-[10px] bg-muted/70 px-4">{children}</div>
      <h3 className="mt-4 text-[15px] font-semibold">
        <span className="mr-2 text-muted-foreground tabular-nums">{n}</span> {title}
      </h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
    </section>
  );
}
