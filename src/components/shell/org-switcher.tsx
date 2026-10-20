"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2Icon, CheckIcon, ChevronDownIcon, StoreIcon } from "lucide-react";
import { BrandMark } from "@/components/app/parts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { unwrap } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { attempt } from "@/lib/feedback";
import { roleLabel } from "@/lib/roles";
import type { Membership } from "@/lib/session";

export function OrgSwitcher({ org, subtitle, memberships }: { org: { id: string; name: string; logo: string | null; kind: "AGENCY" | "WORKSPACE" }; subtitle?: string; memberships: Membership[] }) {
  const router = useRouter();
  const agencies = memberships.filter((m) => m.kind === "AGENCY");
  const workspaces = memberships.filter((m) => m.kind === "WORKSPACE");

  async function switchTo(m: Membership) {
    if (m.id === org.id) return;
    const result = await attempt(async () => unwrap(await authClient.organization.setActive({ organizationId: m.id })), { where: "org-switcher" });
    if (result.ok) router.push(`/${m.slug}`);
  }

  const group = (label: string, list: Membership[]) =>
    list.length > 0 && (
      <DropdownMenuGroup>
        <DropdownMenuLabel className="px-2 text-[11.5px] font-medium tracking-[0.06em] text-muted-foreground uppercase">{label}</DropdownMenuLabel>
        {list.map((m) => (
          <DropdownMenuItem key={m.id} onClick={() => switchTo(m)} className="h-10 gap-2.5 rounded-[8px] px-2">
            <BrandMark name={m.name} logo={m.logo} size="sm" tone={m.kind === "AGENCY" ? "ember" : "ink"} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px]">{m.name}</span>
              <span className="block text-[11.5px] text-muted-foreground">{roleLabel(m.role)}</span>
            </span>
            {m.id === org.id && <CheckIcon className="size-4" strokeWidth={2} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 data-popup-open:bg-muted">
        <BrandMark name={org.name} logo={org.logo} size="md" tone={org.kind === "AGENCY" ? "ember" : "neutral"} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold tracking-[-0.01em]">{org.name}</span>
          {subtitle && <span className="block truncate text-[12px] text-muted-foreground">{subtitle}</span>}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[264px] rounded-[14px] p-1.5">
        {group("Agencies", agencies)}
        {agencies.length > 0 && workspaces.length > 0 && <DropdownMenuSeparator />}
        {group("Brand workspaces", workspaces)}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/onboarding?kind=agency" />} className="h-9 gap-2.5 rounded-[8px] px-2 text-[13.5px]">
          <Building2Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
          New agency
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/onboarding?kind=brand" />} className="h-9 gap-2.5 rounded-[8px] px-2 text-[13.5px]">
          <StoreIcon className="size-4 text-muted-foreground" strokeWidth={1.75} />
          New brand workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
