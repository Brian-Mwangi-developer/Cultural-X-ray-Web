import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { AgencyFlow } from "@/components/onboarding/agency-flow";
import { BrandFlow } from "@/components/onboarding/brand-flow";
import { Chooser, type Joinable } from "@/components/onboarding/chooser";
import { SessionGuard } from "@/components/auth/session-guard";
import { backendGet, requireOrg, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Set up" };

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <Onboarding searchParams={searchParams} />
    </Suspense>
  );
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function Onboarding({ searchParams }: { searchParams: PageProps<"/onboarding">["searchParams"] }) {
  const params = await searchParams;
  const kind = one(params.kind);
  const step = Number(one(params.step) ?? 1) || 1;
  const orgSlug = one(params.org);
  const user = await requireUser();

  // Steps after the first need the org they just made, and only its owners or admins continue.
  const org = orgSlug ? await requireOrg(orgSlug) : null;
  if (org && !["owner", "admin"].includes(org.membership.role)) notFound();

  if (kind === "agency" && (!org || org.organization.kind === "AGENCY")) {
    return (
      <>
        <SessionGuard userId={user.id} />
        <AgencyFlow step={step} org={org} user={{ email: user.email, name: user.name }} />
      </>
    );
  }
  if (kind === "brand" && (!org || org.organization.kind === "WORKSPACE")) {
    return (
      <>
        <SessionGuard userId={user.id} />
        <BrandFlow step={step} org={org} />
      </>
    );
  }

  const joinable = (await backendGet<{ organizations: Joinable[] }>("/api/v1/me/joinable"))?.organizations ?? [];
  return (
    <>
      <SessionGuard userId={user.id} />
      <Chooser name={user.name} joinable={joinable} memberships={user.memberships} />
    </>
  );
}

function OnboardingSkeleton() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col justify-center gap-6 px-5 sm:px-10 lg:px-16">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-10 w-3/4 max-w-md" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-10 w-full max-w-[560px] rounded-[10px]" />
        <Skeleton className="h-10 w-full max-w-[560px] rounded-[10px]" />
        <Skeleton className="h-11 w-full max-w-[560px] rounded-full" />
      </div>
      <div className="hidden p-3 lg:block">
        <Skeleton className="h-full rounded-[22px]" />
      </div>
    </div>
  );
}
