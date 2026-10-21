import type { Metadata } from "next";
import { Suspense } from "react";
import { SwitchAccount } from "@/components/auth/switch-account";
import { Skeleton } from "@/components/ui/skeleton";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Switch account" };

/** Only ever continue to a confirmation link on our own auth API, never anywhere else. */
const safeContinue = (value: string | undefined) => (value && value.startsWith("/api/auth/verify-email?") ? value : null);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function SwitchAccountPage({ searchParams }: PageProps<"/switch-account">) {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full max-w-md rounded-[14px]" />}>
      <Switch searchParams={searchParams} />
    </Suspense>
  );
}

async function Switch({ searchParams }: { searchParams: PageProps<"/switch-account">["searchParams"] }) {
  const params = await searchParams;
  const to = one(params.to)?.trim().toLowerCase() ?? "";
  const resume = safeContinue(one(params.continue));
  const user = await currentUser();
  return <SwitchAccount to={to} resume={resume} current={user?.email ?? null} />;
}
