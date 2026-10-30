"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CircleAlertIcon, RotateCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AppError } from "@/lib/errors";
import { inProgress, maps, type Rebuild } from "@/lib/maps";

const POLL_MS = 3000;

/**
 * While a rebuild runs (new rivals or read-through brands), the last ready map stays on show and this
 * says so, with how far the new one has got. When it's ready the page reloads onto it; if it stops,
 * anyone who can build tries again from here. Key it by the rebuild's id so a new one starts fresh.
 */
export function RebuildBanner({ orgId, initial, canBuild }: { orgId: string; initial: Rebuild | null | undefined; canBuild: boolean }) {
  const router = useRouter();
  const [rebuild, setRebuild] = useState(initial ?? null);
  const [retrying, setRetrying] = useState(false);
  const live = Boolean(rebuild && inProgress(rebuild.status));

  useEffect(() => {
    if (!live) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      if (document.visibilityState === "visible") {
        try {
          const { map } = await maps.latest(orgId, controller.signal);
          if (map && !map.rebuild) {
            toast("Your map is rebuilt.", { description: "Plays are being rewritten from it." });
            router.refresh();
            return;
          }
          if (map?.rebuild) setRebuild(map.rebuild);
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          // A missed poll is harmless; the next one catches up.
        }
      }
      timer = setTimeout(tick, POLL_MS);
    };
    timer = setTimeout(tick, POLL_MS);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [live, orgId, router]);

  if (!rebuild) return null;

  async function retry() {
    setRetrying(true);
    try {
      const { map } = await maps.build(orgId);
      setRebuild((r) => r && { ...r, status: map.status });
    } catch (error) {
      toast(error instanceof AppError ? error.message : "We couldn’t start it again. Try again in a minute.");
    } finally {
      setRetrying(false);
    }
  }

  const stopped = rebuild.status === "FAILED";
  return (
    <div role="status" className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[14px] border px-4 py-3 text-[13.5px] leading-relaxed ${stopped ? "border-destructive/40 bg-destructive/5" : "border-ember/50 bg-ember-soft"}`}>
      {stopped ? <CircleAlertIcon className="size-4 shrink-0 text-destructive" aria-hidden /> : <Spinner className="size-4 shrink-0 text-ember-ink" />}
      <p className="min-w-0 flex-1">
        {stopped ? (
          <>
            <span className="font-medium">The rebuild stopped.</span> This is the map from before your change; nothing on it is lost.
          </>
        ) : (
          <>
            <span className="font-medium">Your map is rebuilding:</span> {rebuild.categoriesDone} of {rebuild.categoriesTotal} parts done. Until then you’re looking at the map from before.
          </>
        )}
      </p>
      {stopped && canBuild && (
        <Button size="sm" variant="outline" className="rounded-full" onClick={retry} disabled={retrying}>
          {retrying ? <Spinner data-icon="inline-start" /> : <RotateCwIcon data-icon="inline-start" />}
          Try again
        </Button>
      )}
    </div>
  );
}
