"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CircleAlertIcon, EllipsisIcon, LoaderCircleIcon, RotateCwIcon, Trash2Icon, VideoOffIcon } from "lucide-react";
import { type Crumb, PageBody, TopBar } from "@/components/shell/top-bar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Reading } from "@/components/adcheck/reading";
import { VerdictView } from "@/components/adcheck/verdict";
import { type AdDetail, ads, reading } from "@/lib/ads";
import { attempt } from "@/lib/feedback";

const POLL_MS = 2000;

/**
 * One ad check: R3 while it's read (polling, paused while the tab is hidden), R4 when it's ready,
 * or what went wrong with a way forward. Delete video and Delete check live in the "…" menu.
 */
export function AdPage({ orgId, base, trail = [], initial, rivals, canEdit, brand }: { orgId: string; base: string; trail?: Crumb[]; initial: AdDetail; rivals: string[]; canEdit: boolean; brand: string }) {
  const router = useRouter();
  const [ad, setAd] = useState(initial);
  const [confirm, setConfirm] = useState<"video" | "check" | null>(null);
  const [busy, setBusy] = useState(false);
  const live = reading(ad.status) || ad.stage === "writing re-cuts";

  useEffect(() => {
    if (!live) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      if (document.visibilityState === "visible") {
        try {
          setAd((await ads.get(orgId, ad.id, controller.signal)).ad);
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          // A missed poll is harmless; the next one catches up.
        }
      }
      timer = setTimeout(tick, POLL_MS);
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      void tick();
    };
    timer = setTimeout(tick, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [live, orgId, ad.id]);

  async function retry() {
    setBusy(true);
    const done = await attempt(() => ads.retry(orgId, ad.id), { where: "adcheck.retry" });
    if (done.ok) setAd((a) => ({ ...a, status: done.data.ad.status, stage: "queued", failureReason: null }));
    setBusy(false);
  }

  async function writeRecuts() {
    const done = await attempt(() => ads.recut(orgId, ad.id), { where: "adcheck.recut" });
    if (done.ok) setAd((a) => ({ ...a, stage: "writing re-cuts" }));
  }

  async function remove(what: "video" | "check") {
    setBusy(true);
    if (what === "check") {
      const done = await attempt(() => ads.remove(orgId, ad.id), { where: "adcheck.delete", success: "Ad check deleted" });
      if (done.ok) return router.push(`${base}/ad-check`);
    } else {
      const done = await attempt(() => ads.deleteVideo(orgId, ad.id), { where: "adcheck.deleteVideo", success: "Video deleted. The reading stays." });
      if (done.ok) setAd((a) => ({ ...a, hasVideo: false }));
    }
    setBusy(false);
    setConfirm(null);
  }

  return (
    <>
      <TopBar
        crumbs={[...trail, { label: "Ad check", href: `${base}/ad-check` }, { label: ad.fileName ?? ad.title }]}
        actions={
          canEdit && !reading(ad.status) ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" className="rounded-full" aria-label="More actions" />}>
                <EllipsisIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-[12px] p-1.5">
                {ad.hasVideo && (
                  <DropdownMenuItem onClick={() => setConfirm("video")} className="h-9 gap-2.5 rounded-[8px] px-2 text-[13.5px]">
                    <VideoOffIcon className="size-4" aria-hidden />
                    Delete video
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem variant="destructive" onClick={() => setConfirm("check")} className="h-9 gap-2.5 rounded-[8px] px-2 text-[13.5px]">
                  <Trash2Icon className="size-4" aria-hidden />
                  Delete check
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : undefined
        }
      />
      <PageBody>
        {reading(ad.status) ? (
          <Reading orgId={orgId} ad={ad} />
        ) : ad.status === "FAILED" ? (
          <Failed ad={ad} canEdit={canEdit} busy={busy} onRetry={retry} onDelete={() => setConfirm("check")} />
        ) : (
          <div className="mx-auto max-w-[1180px]">
            <VerdictView orgId={orgId} base={base} ad={ad} rivals={rivals} onRecut={canEdit ? writeRecuts : undefined} brand={brand} />
          </div>
        )}
      </PageBody>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && !busy && setConfirm(null)}>
        <AlertDialogContent className="rounded-[18px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "video" ? "Delete the video?" : "Delete this ad check?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "video"
                ? "The file is removed from storage now. The shots, words and X-Ray’s read stay, without playback."
                : "The video and everything read from it are removed for everyone in this workspace. This can’t be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive-solid" disabled={busy} onClick={() => confirm && void remove(confirm)}>
              {busy && <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />}
              {busy ? "Deleting…" : confirm === "video" ? "Delete video" : "Delete check"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Failed({ ad, canEdit, busy, onRetry, onDelete }: { ad: AdDetail; canEdit: boolean; busy: boolean; onRetry: () => void; onDelete: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <CircleAlertIcon className="size-5 text-foreground/80" strokeWidth={1.75} aria-hidden />
      </span>
      <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.025em]">We couldn’t finish reading this ad</h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{ad.failureReason ?? "Something went wrong on our side."}</p>
      {canEdit && (
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          {ad.hasVideo && (
            <Button size="cta" onClick={onRetry} disabled={busy}>
              <RotateCwIcon data-icon="inline-start" />
              Try again
            </Button>
          )}
          <Button variant="outline-destructive" size="cta" onClick={onDelete} disabled={busy}>
            Delete check
          </Button>
        </div>
      )}
    </div>
  );
}
