import { Suspense } from "react";
import { cookies } from "next/headers";
import { ShellSkeleton } from "@/components/shell/shell-skeleton";
import { SettingsShell } from "@/components/settings/settings-shell";
import { requireOrg, requireUser } from "@/lib/session";

export default function SettingsLayout({ children, params }: LayoutProps<"/[org]/settings">) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell params={params}>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ params, children }: { params: LayoutProps<"/[org]/settings">["params"]; children: React.ReactNode }) {
  const { org: slug } = await params;
  const [user, org, jar] = await Promise.all([requireUser(), requireOrg(slug), cookies()]);
  const sidebarOpen = jar.get("sidebar_state")?.value !== "false";
  return (
    <SettingsShell sidebarOpen={sidebarOpen} org={org} preferences={user.preferences}>
      {children}
    </SettingsShell>
  );
}
