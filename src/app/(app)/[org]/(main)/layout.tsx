import { Suspense } from "react";
import { cookies } from "next/headers";
import { MainShell } from "@/components/shell/main-shell";
import { ShellSkeleton } from "@/components/shell/shell-skeleton";
import { agencyClients, requireOrg, requireUser } from "@/lib/session";

export default function MainLayout({ children, params }: LayoutProps<"/[org]">) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell params={params}>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ params, children }: { params: LayoutProps<"/[org]">["params"]; children: React.ReactNode }) {
  const { org: slug } = await params;
  const [user, org, jar] = await Promise.all([requireUser(), requireOrg(slug), cookies()]);
  const sidebarOpen = jar.get("sidebar_state")?.value !== "false";
  const clients = org.organization.kind === "AGENCY" ? await agencyClients(org.organization.id) : [];
  return (
    <MainShell
      sidebarOpen={sidebarOpen}
      user={{ name: user.name, email: user.email, image: user.image, preferences: user.preferences }}
      org={org}
      memberships={user.memberships}
      clients={clients}
    >
      {children}
    </MainShell>
  );
}
