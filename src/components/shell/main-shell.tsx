"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AskLauncher } from "@/components/ask/ask-launcher";
import { SessionGuard } from "@/components/auth/session-guard";
import { FeedbackTab } from "@/components/feedback/feedback-tab";
import { GuideDock } from "@/components/guide/guide-bar";
import { GuideProvider } from "@/components/guide/guide-context";
import { PreferencesSync } from "@/lib/preferences";
import type { ClientSummary, Membership, OrgContext } from "@/lib/session";
import { AppSidebar, type ShellUser } from "./app-sidebar";
import { CommandMenu, type CommandLink } from "./command-menu";
import { agencyNav, clientNav, ownerNav, settingsNav } from "./nav";

/** Sidebar, ⌘K and appearance for every page inside a workspace or agency. */
export function MainShell({
  user,
  org,
  memberships,
  clients,
  sidebarOpen,
  children,
}: {
  user: ShellUser;
  org: OrgContext;
  memberships: Membership[];
  clients: ClientSummary[];
  /** Last open or collapsed state, from the sidebar's cookie. */
  sidebarOpen: boolean;
  children: React.ReactNode;
}) {
  const o = org.organization;
  const pages = (o.kind === "AGENCY" ? agencyNav(o.slug) : ownerNav(o.slug)).map((n) => ({ ...n, group: "Pages" }));
  const clientLinks = clients
    .filter((c) => c.status === "ACTIVE")
    .flatMap((c) => clientNav(o.slug, c.workspace.slug).map((n) => ({ ...n, label: `${c.workspace.name} · ${n.label}`, group: "Clients" })));
  const settings = settingsNav(o.slug, o.kind, { members: org.counts.members, clients: org.counts.clients, agencies: org.counts.agencies }).flatMap((g) =>
    g.items.map((n) => ({ ...n, label: `Settings · ${n.label}`, group: "Settings" })),
  );
  const links: CommandLink[] = [...pages, ...clientLinks, ...settings];

  return (
    <CommandMenu links={links}>
      <PreferencesSync preferences={user.preferences} />
      <SessionGuard userId={user.id} />
      {/* The guide bar (Figma 19) docks under every page; its mark opens Ask X-Ray. */}
      <GuideProvider orgId={o.id} base={`/${o.slug}`} kind={o.kind}>
        <SidebarProvider defaultOpen={sidebarOpen} style={{ "--sidebar-width": "16.5rem" } as React.CSSProperties}>
          <AppSidebar user={user} org={org} memberships={memberships} clients={clients} />
          <SidebarInset className="min-w-0 border-l bg-background">
            {children}
            <GuideDock />
          </SidebarInset>
        </SidebarProvider>
        {/* Agencies ask across clients once they can read client maps. */}
        {o.kind === "WORKSPACE" && <AskLauncher orgId={o.id} slug={o.slug} brand={o.name} docked />}
      </GuideProvider>
      <FeedbackTab email={user.email} />
    </CommandMenu>
  );
}
