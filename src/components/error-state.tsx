"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, RotateCcwIcon } from "lucide-react";
import { signOut } from "@/lib/auth-client";
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
const SEEN_KEY = "xray:failures";
const WINDOW_MS = 3 * 60_000;

/** How many times a page has failed in this tab in the last few minutes, counting this one. */
function failuresRecently() {
  try {
    const now = Date.now();
    const seen = (JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]") as number[]).filter((t) => now - t < WINDOW_MS);
    seen.push(now);
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    return seen.length;
  } catch {
    return 1;
  }
}

export function ErrorState({ error, reset, where, title = "This page didn't load", className }: Props) {
  // A second failure within minutes usually means a session left over from an older version of the
  // account: signing out and back in clears it, which beats asking people to clear their cookies.
  const [stuck, setStuck] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { where, digest: error.digest });
    const t = setTimeout(() => setStuck(failuresRecently() >= 2), 0);
    return () => clearTimeout(t);
  }, [error, where]);

  async function signOutAndBack() {
    setLeaving(true);
    try {
      sessionStorage.removeItem(SEEN_KEY);
    } catch {
      /* private window */
    }
    await signOut().catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className={cn("flex min-h-[60svh] flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <span aria-hidden className="mb-6 flex size-12 items-center justify-center rounded-full border bg-card">
        <span className="size-2 rounded-full bg-ember" />
      </span>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-pretty text-muted-foreground">
        Something went wrong on our side. Your work is safe. Try again, and if it keeps happening, send us the reference below.
      </p>
      {stuck && (
        <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-pretty">
          Still not loading? Signing out and back in starts a fresh session. Nothing in your workspace changes.
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {reset && (
          <Button size="pill" onClick={() => reset()}>
            <RotateCcwIcon data-icon="inline-start" />
            Try again
          </Button>
        )}
        {stuck ? (
          <Button size="pill" variant="outline" onClick={signOutAndBack} disabled={leaving}>
            <LogOutIcon data-icon="inline-start" />
            Sign out and back in
          </Button>
        ) : (
          <Link href="/dashboard" className={buttonVariants({ size: "pill", variant: "outline" })}>
            Go to dashboard
          </Link>
        )}
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-xs text-muted-foreground">
          Reference {error.digest}
        </p>
      )}
    </div>
  );
}
