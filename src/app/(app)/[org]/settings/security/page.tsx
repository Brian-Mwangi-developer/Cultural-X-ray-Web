import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { SettingsPage } from "@/components/settings/parts";
import { orgPage } from "@/lib/page-context";
import { SecurityPanel, type SessionRow } from "@/components/settings/account";
import { backendGet } from "@/lib/session";
export const metadata: Metadata = { title: "Security" };

export default function Page({ params }: PageProps<"/[org]/settings/security">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/settings/security">["params"] }) {
  const { user, slug } = await orgPage(params);
  const [sessions, current] = await Promise.all([
    backendGet<Omit<SessionRow, "current">[]>("/api/auth/list-sessions"),
    backendGet<{ session: { token: string } }>("/api/auth/get-session"),
  ]);
  const rows = (sessions ?? [])
    .map((s) => ({ ...s, current: s.token === current?.session.token }))
    .sort((a, b) => Number(b.current) - Number(a.current) || +new Date(b.updatedAt) - +new Date(a.updatedAt));
  return (
    <SettingsPage slug={slug} title="Security" description="Your password and the devices signed in to your account.">
      <SecurityPanel hasPassword={user.hasPassword} sessions={rows} />
    </SettingsPage>
  );
}
