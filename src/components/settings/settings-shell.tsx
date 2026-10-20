"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { settingsNav } from "@/components/shell/nav";
import { PreferencesSync } from "@/lib/preferences";
import type { OrgContext, Preferences } from "@/lib/session";
import { cn } from "@/lib/utils";

const itemClass =
  "h-9 gap-2.5 rounded-[10px] px-2.5 text-[14px] text-foreground/85 [&_svg]:size-[17px] [&_svg]:text-foreground/70 data-active:bg-card data-active:font-medium data-active:text-foreground data-active:shadow-[0_0_0_1px_var(--border)] data-active:[&_svg]:text-ember";

/** c4: settings replace the workspace sidebar, with a clear way back. */
export function SettingsShell({ org, preferences, children }: { org: OrgContext; preferences: Preferences; children: React.ReactNode }) {
  const pathname = usePathname();
  const o = org.organization;
  const groups = settingsNav(o.slug, o.kind, { members: org.counts.members, clients: org.counts.clients, agencies: org.counts.agencies + org.counts.pendingRequests });

  return (
    <SidebarProvider style={{ "--sidebar-width": "16.5rem" } as React.CSSProperties}>
      <PreferencesSync preferences={preferences} />
      <Sidebar className="border-r-0">
        <SidebarHeader className="px-3 pt-4 pb-2">
          <Link href={`/${o.slug}`} className="flex h-9 items-center gap-2 rounded-[10px] px-2 text-[14px] text-foreground/85 transition-colors hover:bg-muted hover:text-foreground">
            <ChevronLeftIcon className="size-4" strokeWidth={1.75} aria-hidden />
            <span className="truncate">Back to {o.name}</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="gap-0 px-1">
          {groups.map((group, i) => (
            <SidebarGroup key={group.group || i} className={cn(!group.group && "pt-4")}>
              {group.group && <SidebarGroupLabel className="h-7 px-2.5 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">{group.group}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton render={<Link href={item.href} />} isActive={pathname === item.href} className={itemClass}>
                        <item.icon strokeWidth={1.75} />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {item.count !== undefined && item.count > 0 && <SidebarMenuBadge className="right-2.5 text-[12px] font-normal text-muted-foreground">{item.count}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-w-0 border-l bg-background">{children}</SidebarInset>
    </SidebarProvider>
  );
}
