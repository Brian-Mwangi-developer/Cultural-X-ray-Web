import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MapIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Your maps" };

export default function DashboardPage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Suspense fallback={<div className="h-8 w-40 animate-pulse rounded-full bg-muted" />}> {/* ui-ok: loading skeleton */}
              <Account />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Suspense fallback={<div className="h-12 w-72 animate-pulse rounded-lg bg-muted" />}> {/* ui-ok: loading skeleton */}
          <Greeting />
        </Suspense>

        <section className="mt-8 rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b bg-muted/40 px-6 py-4">
            <h2 className="text-sm font-medium">Culture maps</h2>
            <span className="text-xs text-muted-foreground tabular-nums">0 maps</span>
          </div>
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-11 items-center justify-center rounded-full border text-muted-foreground">
              <MapIcon className="size-5" strokeWidth={1.5} />
            </span>
            <p className="mt-4 font-semibold text-2xl tracking-[-0.02em]">No maps yet</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Building a map from a brand name arrives with the Culture Map engine. Until then, your account is ready and waiting.
            </p>
            <Link href="/" className="mt-6 text-sm font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
              Read what a map shows
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

async function Greeting() {
  const user = await requireUser();
  const first = user.name.split(" ")[0] || user.name;
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Workspace</p>
      <h1 className="mt-2 font-semibold text-4xl tracking-[-0.03em]">Welcome, {first}</h1>
    </div>
  );
}

async function Account() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
      <SignOutButton />
    </div>
  );
}
