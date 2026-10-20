"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcwIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { reportError } from "@/lib/report";
import { cn } from "@/lib/utils";

type Props = {
  error: Error & { digest?: string };
  reset?: () => void;
  where: string;
  title?: string;
  className?: string;
};

/**
 * What a route shows when it fails to render. The real error is reported, never shown;
 * the digest is the reference that matches the server log.
 */
export function ErrorState({ error, reset, where, title = "This page didn't load", className }: Props) {
  useEffect(() => {
    reportError(error, { where, digest: error.digest });
  }, [error, where]);

  return (
    <div className={cn("flex min-h-[60svh] flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <span aria-hidden className="mb-6 flex size-12 items-center justify-center rounded-full border bg-card">
        <span className="size-2 rounded-full bg-ember" />
      </span>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-pretty text-muted-foreground">
        Something went wrong on our side. Your work is safe. Try again, and if it keeps happening, send us the reference below.
      </p>
      <div className="mt-6 flex items-center gap-2">
        {reset && (
          <Button size="pill" onClick={() => reset()}>
            <RotateCcwIcon data-icon="inline-start" />
            Try again
          </Button>
        )}
        <Link href="/dashboard" className={buttonVariants({ size: "pill", variant: "outline" })}>
          Go to dashboard
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-xs text-muted-foreground">
          Reference {error.digest}
        </p>
      )}
    </div>
  );
}
