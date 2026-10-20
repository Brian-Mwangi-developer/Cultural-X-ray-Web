"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookmarkIcon, ChevronRightIcon, PlusIcon, SettingsIcon } from "lucide-react";
import { BrandMark } from "@/components/app/parts";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { Kbd } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { readIntent } from "@/lib/intent";
import { isManager } from "@/lib/roles";
import type { ClientSummary, Membership, OrgContext, Preferences } from "@/lib/session";
import { cn } from "@/lib/utils";
import { SearchButton } from "./command-menu";
import { agencyNav, clientNav, isActive, ownerNav, type NavItem } from "./nav";
import { OrgSwitcher } from "./org-switcher";
import { ProfileMenu } from "./profile-menu";

export type ShellUser = { name: string; email: string; image: string | null; preferences: Preferences };

const itemClass =
  "h-9 gap-2.5 rounded-[10px] px-2.5 text-[14px] text-foreground/85 [&_svg]:size-[17px] [&_svg]:text-foreground/70 data-active:bg-card data-active:font-medium data-active:text-foreground data-active:shadow-[0_0_0_1px_var(--border)] data-active:[&_svg]:text-ember";

const labelClass = "h-7 px-2.5 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase";

export function AppSidebar({ user, org, memberships, clients }: { user: ShellUser; org: OrgContext; memberships: Membership[]; clients: ClientSummary[] }) {
  const pathname = usePathname();
  const o = org.organization;
  const agency = o.kind === "AGENCY";
  const nav = agency ? agencyNav(o.slug) : ownerNav(o.slug);
  const marketLabel = o.markets.map((m) => (m === "GB" ? "UK" : "US")).join(" · ");
  const intent = readIntent(o.metadata);
  const subtitle = agency ? undefined : [intent.city, marketLabel && `${marketLabel} market`].filter(Boolean).join(" · ") || undefined;

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="gap-3 px-3 pt-3.5 pb-1">
        <OrgSwitcher org={{ id: o.id, name: o.name, logo: o.logo, kind: o.kind }} subtitle={subtitle} memberships={memberships} />
        <SearchButton />
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {nav.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(pathname, item)} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {agency ? (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className={labelClass}>Pinned</SidebarGroupLabel>
              <SidebarGroupContent>
                <p className="flex items-start gap-2 px-2.5 py-1.5 text-[12.5px] leading-snug text-muted-foreground">
                  <BookmarkIcon className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                  Pin a map or brief to keep it here.
                </p>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className={labelClass}>Clients</SidebarGroupLabel>
              {isManager(org.membership.role) && (
                <AddClientDialog
                  agency={{ id: o.id, name: o.name }}
                  trigger={
                    <SidebarGroupAction title="Add a client" className="top-3.5 right-3 rounded-md text-muted-foreground hover:text-foreground">
                      <PlusIcon strokeWidth={2} />
                      <span className="sr-only">Add a client</span>
                    </SidebarGroupAction>
                  }
                />
              )}
              <SidebarGroupContent>
                {clients.length === 0 ? (
                  <p className="px-2.5 py-1.5 text-[12.5px] leading-snug text-muted-foreground">No clients yet. Add one with the plus.</p>
                ) : (
                  <SidebarMenu className="gap-0.5">
                    {clients.map((client) => (
                      <ClientItem key={client.id} agencySlug={o.slug} client={client} pathname={pathname} />
                    ))}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          (intent.seeds?.length || intent.rivals?.length) && (
            <SidebarGroup>
              <SidebarGroupLabel className={labelClass}>Compared with</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {[...(intent.seeds ?? []).map((b) => ({ b, role: "seed" })), ...(intent.rivals ?? []).map((b) => ({ b, role: "rival" }))].map(({ b, role }) => (
                    <SidebarMenuItem key={`${role}-${b}`}>
                      <SidebarMenuButton render={<Link href={`/${o.slug}/map`} />} className={itemClass}>
                        <BrandMark name={b} size="xs" tone="neutral" />
                        <span className="flex-1 truncate">{b}</span>
                        <span className="text-[12px] text-muted-foreground">{role}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        )}
      </SidebarContent>

      <SidebarFooter className="gap-2.5 px-3 pb-3.5">
        <UsageMeter used={agency ? 2140 : 212} limit={agency ? 10000 : 1000} />
        <div className="flex items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <ProfileMenu user={user} org={{ id: o.id, slug: o.slug, name: o.name, role: org.membership.role }} memberships={memberships} />
          </div>
          <Link
            href={`/${o.slug}/settings/general`}
            aria-label="Settings"
            title="Settings"
            className="flex size-[50px] shrink-0 items-center justify-center rounded-[12px] border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <SettingsIcon className="size-[18px]" strokeWidth={1.75} />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<Link href={item.href} />} isActive={active} className={itemClass}>
        <item.icon strokeWidth={1.75} />
        <span className="flex-1">{item.label}</span>
        {item.shortcut && <Kbd className="h-5 bg-transparent px-1 text-[11px] text-muted-foreground ring-1 ring-border">{item.shortcut}</Kbd>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function ClientItem({ agencySlug, client, pathname }: { agencySlug: string; client: ClientSummary; pathname: string }) {
  const base = `/${agencySlug}/clients/${client.workspace.slug}`;
  const inside = pathname === base || pathname.startsWith(`${base}/`);
  const [open, setOpen] = useState(inside);
  const expanded = open || inside;

  if (client.status !== "ACTIVE") {
    return (
      <SidebarMenuItem>
        <div className="flex h-9 items-center gap-2.5 px-2.5 text-[14px] text-muted-foreground">
          <BrandMark name={client.workspace.name} size="xs" tone="neutral" />
          <span className="flex-1 truncate">{client.workspace.name}</span>
          <span className="text-[12px]">{client.status === "REQUESTED" ? "asked" : "declined"}</span>
        </div>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => setOpen(!expanded)} aria-expanded={expanded} className={itemClass}>
        <BrandMark name={client.workspace.name} size="xs" tone="neutral" />
        <span className="flex-1 truncate">{client.workspace.name}</span>
        {client.claim && <span className="text-[11.5px] text-muted-foreground">unclaimed</span>}
        <ChevronRightIcon className={cn("size-4! transition-transform", expanded && "rotate-90")} strokeWidth={1.75} />
      </SidebarMenuButton>
      {expanded && (
        <SidebarMenuSub className="mr-0 ml-[19px] gap-0.5 border-l-0 px-0 py-0.5">
          {clientNav(agencySlug, client.workspace.slug).map((item) => (
            <SidebarMenuSubItem key={item.href}>
              <SidebarMenuSubButton render={<Link href={item.href} />} isActive={isActive(pathname, item)} className={cn(itemClass, "h-8 text-[13.5px]")}>
                <item.icon strokeWidth={1.75} />
                <span>{item.label}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

function UsageMeter({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="rounded-[12px] border bg-card px-3 py-2.5" title="Sample figures until Qloo usage is metered">
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="text-ember-ink">Qloo queries</span>
        <span className="tabular-nums">
          {used.toLocaleString("en-US")} / {limit.toLocaleString("en-US")}
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-soft" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit} aria-label="Qloo queries used this month">
        <div className="h-full rounded-full bg-ember" style={{ width: `${Math.max(pct, 4)}%` }} />
      </div>
      <p className="mt-2 text-[11.5px] text-muted-foreground">Cached maps don&rsquo;t count again.</p>
    </div>
  );
}
