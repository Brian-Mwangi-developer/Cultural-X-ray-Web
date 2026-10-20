import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { homeFor, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Opening your workspace" };

/** A stable address for "take me home": your active workspace, or onboarding if you have none. */
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center gap-2 text-[14px] text-muted-foreground">
          <Spinner className="size-4" />
          Opening your workspace
        </div>
      }
    >
      <Resolve />
    </Suspense>
  );
}

async function Resolve(): Promise<null> {
  redirect(homeFor(await requireUser()));
}
