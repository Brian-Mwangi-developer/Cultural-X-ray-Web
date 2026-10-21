"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AppError, userMessage } from "@/lib/errors";
import { maps } from "@/lib/maps";
import { reportError } from "@/lib/report";

/** Starts a build in the background, then re-renders the page, which now shows its progress. */
export function BuildMapButton({ orgId, label = "Build my map" }: { orgId: string; label?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      await maps.build(orgId);
      router.refresh();
    } catch (e) {
      if (!(e instanceof AppError && e.expected)) reportError(e, { where: "map.build" });
      setError(userMessage(e));
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button size="cta" onClick={start} disabled={pending}>
        {pending && <Spinner className="size-4" />}
        {label}
        {!pending && <ArrowRightIcon data-icon="inline-end" />}
      </Button>
      {error && <p className="text-[13.5px] text-destructive">{error}</p>}
    </div>
  );
}
