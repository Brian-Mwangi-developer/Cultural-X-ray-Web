"use client";

import { useEffect, useState } from "react";
import { UserRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setExpectedUser } from "@/lib/api";

type Seen = { id: string; email: string } | null;

async function whoIsSignedIn(): Promise<Seen | undefined> {
  try {
    const res = await fetch("/api/auth/get-session", { credentials: "same-origin", cache: "no-store" });
    if (!res.ok) return undefined;
    const body = (await res.json()) as { user?: { id: string; email: string } } | null;
    return body?.user ? { id: body.user.id, email: body.user.email } : null;
  } catch {
    return undefined; // offline: say nothing
  }
}

/**
 * Keeps a tab honest about who it's acting for. The page was rendered for `userId`; if another
 * tab signs in as someone else (or signs out), this tab stops and asks for a reload instead of
 * quietly sending requests as the new person. API calls carry the id too, and the backend
 * refuses a mismatch (SESSION_CHANGED).
 */
export function SessionGuard({ userId }: { userId: string | null }) {
  const [now, setNow] = useState<Seen | undefined>(undefined);

  useEffect(() => {
    setExpectedUser(userId);
    let live = true;
    const check = async () => {
      const seen = await whoIsSignedIn();
      if (live && seen !== undefined && (seen?.id ?? null) !== userId) setNow(seen);
    };
    const onVisible = () => document.visibilityState === "visible" && void check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("xray:session-changed", check);
    return () => {
      live = false;
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("xray:session-changed", check);
    };
  }, [userId]);

  if (now === undefined) return null;
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="session-changed-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm space-y-4 rounded-[14px] border bg-card p-6">
        <UserRoundIcon className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
        <div className="space-y-1.5">
          <h2 id="session-changed-title" className="text-[17px] font-semibold tracking-[-0.01em]">
            {now ? "You switched accounts" : "You signed out"}
          </h2>
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            {now ? (
              <>
                Another tab is now signed in as <span className="font-medium text-foreground">{now.email}</span>. Reload to continue as that account.
              </>
            ) : (
              "Another tab signed you out. Reload to log in again."
            )}
          </p>
        </div>
        <Button size="pill" className="w-full" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    </div>
  );
}
