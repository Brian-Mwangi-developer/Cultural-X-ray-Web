"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { put } from "@vercel/blob/client";
import { toast } from "sonner";
import { ArrowRightIcon, CheckIcon, CircleAlertIcon, LoaderCircleIcon, PlusIcon, RotateCwIcon, XIcon } from "lucide-react";
import { PageHeader } from "@/components/app/parts";
import { type Crumb, PageBody, TopBar } from "@/components/shell/top-bar";
import { Button } from "@/components/ui/button";
import { ChoiceChip } from "@/components/forms/fields";
import { useFrames } from "@/components/adcheck/frames";
import { Player } from "@/components/adcheck/player";
import type { Picked } from "@/components/adcheck/home";
import { ads, megabytes, PLACEMENTS, type Placement, seconds } from "@/lib/ads";
import { userMessage } from "@/lib/errors";
import { reportError } from "@/lib/report";
import { cn } from "@/lib/utils";

type Phase = { kind: "uploading"; loaded: number } | { kind: "uploaded"; pathname: string } | { kind: "failed"; message: string };

/**
 * R2: the file goes straight from the browser to storage while the person says where the ad will
 * run. "Check this ad" works at any point: before the upload finishes it waits, then starts.
 */
export function Upload({ orgId, base, trail = [], picked, rivals, onCancel }: { orgId: string; base: string; trail?: Crumb[]; picked: Picked; rivals: string[]; onCancel: () => void }) {
  const router = useRouter();
  const { file } = picked;
  const [phase, setPhase] = useState<Phase>({ kind: "uploading", loaded: 0 });
  const [attemptNo, setAttemptNo] = useState(0);
  const [placements, setPlacements] = useState<Placement[]>(["tiktok", "reels"]);
  const [wantsStart, setWantsStart] = useState(false);
  const [starting, setStarting] = useState(false);
  const adId = useRef<string | null>(null);
  const creating = useRef<ReturnType<typeof ads.create> | null>(null);
  const abort = useRef<AbortController | null>(null);

  const local = picked.url;
  const strip = useMemo(() => Array.from({ length: 8 }, (_, i) => ((i + 0.5) / 8) * picked.durationMs), [picked.durationMs]);
  const frames = useFrames(local, strip, 160);

  // Upload once per attempt. The ad row is made first; it holds the one path Blob will accept.
  useEffect(() => {
    const controller = new AbortController();
    abort.current = controller;
    void (async () => {
      try {
        // One ad per file, even when this runs again (a retry, or React re-running effects in development).
        creating.current ??= ads.create(orgId, { fileName: file.name, sizeBytes: file.size, contentType: file.type });
        const target = await creating.current;
        adId.current = target.adId;
        const blob = await put(target.pathname, file, {
          access: target.access,
          token: target.clientToken,
          contentType: file.type,
          multipart: file.size > 50_000_000,
          abortSignal: controller.signal,
          onUploadProgress: ({ loaded }) => setPhase({ kind: "uploading", loaded }),
        });
        setPhase({ kind: "uploaded", pathname: blob.pathname });
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!adId.current) creating.current = null; // creating failed: make it again on retry
        reportError(error, { where: "adcheck.upload" });
        setPhase({ kind: "failed", message: error instanceof Error && /network|fetch/i.test(error.message) ? "The connection dropped while uploading." : userMessage(error) });
      }
    })();
    return () => controller.abort();
  }, [orgId, file, attemptNo]);

  // Start as soon as both are true: the person asked, and the file has arrived.
  useEffect(() => {
    if (!wantsStart || phase.kind !== "uploaded" || starting || !adId.current) return;
    const id = adId.current;
    setStarting(true);
    ads
      .start(orgId, id, { pathname: phase.pathname, placements })
      .then(() => router.push(`${base}/ad-check/${id}`))
      .catch((error: unknown) => {
        reportError(error, { where: "adcheck.start" });
        toast.error(userMessage(error));
        setWantsStart(false);
        setStarting(false);
      });
  }, [wantsStart, phase, starting, orgId, placements, router, base]);

  async function cancel() {
    abort.current?.abort();
    const id = adId.current;
    onCancel();
    if (id) await ads.remove(orgId, id).catch(() => undefined);
  }

  const pct = phase.kind === "uploaded" ? 100 : phase.kind === "uploading" ? Math.min(99, (phase.loaded / file.size) * 100) : 0;
  const waiting = wantsStart && phase.kind === "uploading";

  return (
    <>
      <TopBar crumbs={[...trail, { label: "Ad check", href: `${base}/ad-check` }, { label: "New check" }]} />
      <PageBody>
        <div className="mx-auto max-w-[1100px]">
          <PageHeader title="Set up the check" description="While it uploads, say where the ad will run." />

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)]">
            <div className="min-w-0 space-y-7">
              {/* The file */}
              <section className="flex items-center gap-4 rounded-[14px] border bg-card p-4" aria-label="Upload">
                <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a frame drawn in the browser */}
                  {frames[0] && <img src={frames[0]} alt="" className="size-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[14.5px] font-medium">{file.name}</p>
                    <p className="shrink-0 text-[12.5px] text-muted-foreground tabular-nums">
                      {phase.kind === "uploading" ? `${megabytes(phase.loaded)} of ${megabytes(file.size)}` : megabytes(file.size)}
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft" role="progressbar" aria-label="Upload progress" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                    <div className={cn("h-full rounded-full transition-[width] duration-300 ease-out", phase.kind === "failed" ? "bg-destructive" : "bg-ember")} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                    {phase.kind === "uploading" && <LoaderCircleIcon className="size-3.5 animate-spin text-ember-ink" aria-hidden />}
                    {phase.kind === "uploaded" && <CheckIcon className="size-3.5 text-foreground" strokeWidth={2.5} aria-hidden />}
                    {phase.kind === "failed" && <CircleAlertIcon className="size-3.5 text-destructive" aria-hidden />}
                    <span className={cn(phase.kind === "failed" && "text-destructive")}>
                      {phase.kind === "uploading" ? "Uploading" : phase.kind === "uploaded" ? "Uploaded" : phase.message}
                      {phase.kind !== "failed" && ` · ${seconds(picked.durationMs)} · ${picked.width} × ${picked.height}`}
                    </span>
                  </p>
                </div>
                {phase.kind === "failed" ? (
                  <Button variant="outline" size="pill" 
                    onClick={() => {
                      setPhase({ kind: "uploading", loaded: 0 });
                      setAttemptNo((n) => n + 1);
                    }}
                  >
                    <RotateCwIcon data-icon="inline-start" />
                    Try again
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon-sm" onClick={cancel} aria-label="Cancel upload" className="text-muted-foreground">
                    <XIcon />
                  </Button>
                )}
              </section>

              {/* Compared with */}
              <section className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[14px] font-semibold">Compared with</h2>
                  <p className="text-[12.5px] text-muted-foreground">From your Culture Map</p>
                </div>
                {rivals.length ? (
                  rivals.map((name) => (
                    <div key={name} className="flex items-center gap-3 rounded-[12px] border border-ember bg-ember-soft px-3.5 py-3">
                      <span className="flex size-[18px] items-center justify-center rounded-[5px] bg-ember text-white">
                        <CheckIcon className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium">{name}</p>
                        <p className="text-[12.5px] text-muted-foreground">Rival · on your map</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-[12px] border bg-card px-3.5 py-3 text-[13.5px] text-muted-foreground">Your map has no rivals yet, so the ad is read against your customers alone.</p>
                )}
                <button
                  type="button"
                  onClick={() => toast("Comparing with brands outside your map is coming soon.", { description: "For now, an ad is compared with the rivals on your Culture Map." })}
                  className="flex h-10 w-full items-center gap-2 rounded-[12px] border border-dashed bg-card px-3.5 text-[13px] text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
                >
                  <PlusIcon className="size-3.5" aria-hidden />
                  Add another brand
                </button>
              </section>

              {/* Placements */}
              <section className="space-y-2.5">
                <h2 className="text-[14px] font-semibold">Where will it run?</h2>
                <div className="flex flex-wrap gap-2">
                  {PLACEMENTS.map((p) => (
                    <ChoiceChip key={p.id} selected={placements.includes(p.id)} onClick={() => setPlacements((list) => (list.includes(p.id) ? list.filter((x) => x !== p.id) : [...list, p.id]))}>
                      {p.label}
                    </ChoiceChip>
                  ))}
                </div>
                <p className="text-[12.5px] text-muted-foreground">Saved with the check, for the versions we suggest later.</p>
              </section>

              <div className="space-y-3">
                <Button size="cta" className="w-full" disabled={phase.kind === "failed" || starting || waiting} onClick={() => setWantsStart(true)}>
                  {starting ? (
                    <>
                      <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
                      Starting…
                    </>
                  ) : waiting ? (
                    <>
                      <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
                      Starts when the upload finishes
                    </>
                  ) : (
                    <>
                      Check this ad
                      <ArrowRightIcon data-icon="inline-end" />
                    </>
                  )}
                </Button>
                <p className="text-center text-[12.5px] text-faint">Usually takes about a minute. You can leave the page while it reads.</p>
              </div>
            </div>

            {/* Preview */}
            <aside className="min-w-0 space-y-3">
              <Player src={local} rounded="rounded-[14px]" />
              <div className="grid grid-cols-8 gap-1">
                {frames.map((f, i) => (
                  <div key={i} className="aspect-[16/10] overflow-hidden rounded-[6px] bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a frame drawn in the browser */}
                    {f && <img src={f} alt="" className="size-full animate-[rise_400ms_ease-out_both] object-cover" />}
                  </div>
                ))}
              </div>
              <p className="text-[12.5px] text-muted-foreground">
                First look: {seconds(picked.durationMs)}, {picked.width} × {picked.height}. The shots are found once it’s read.
              </p>
            </aside>
          </div>
        </div>
      </PageBody>
    </>
  );
}
