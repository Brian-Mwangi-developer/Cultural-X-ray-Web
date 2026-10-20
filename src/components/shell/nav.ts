import {
  BadgeDollarSignIcon,
  BuildingIcon,
  CircleAlertIcon,
  HouseIcon,
  InboxIcon,
  LinkIcon,
  LockIcon,
  MapIcon,
  MessageSquareIcon,
  PaletteIcon,
  ScanSearchIcon,
  SparklesIcon,
  TrendingUpIcon,
  UserIcon,
  UsersIcon,
  BriefcaseBusinessIcon,
  type LucideIcon,
} from "lucide-react";
import type { OrgKind } from "@/lib/session";

export type NavItem = { label: string; href: string; icon: LucideIcon; shortcut?: string; exact?: boolean; count?: number };

export const ownerNav = (slug: string): NavItem[] => [
  { label: "Overview", href: `/${slug}`, icon: HouseIcon, exact: true },
  { label: "Culture Map", href: `/${slug}/map`, icon: MapIcon },
  { label: "Plays", href: `/${slug}/plays`, icon: SparklesIcon },
  { label: "Ad check", href: `/${slug}/ad-check`, icon: ScanSearchIcon },
  { label: "Ask X-Ray", href: `/${slug}/ask`, icon: MessageSquareIcon, shortcut: "⌘J" },
];

export const agencyNav = (slug: string): NavItem[] => [
  { label: "Home", href: `/${slug}`, icon: HouseIcon, exact: true },
  { label: "Inbox", href: `/${slug}/inbox`, icon: InboxIcon },
  { label: "Ask X-Ray", href: `/${slug}/ask`, icon: MessageSquareIcon, shortcut: "⌘J" },
];

export const clientNav = (agencySlug: string, clientSlug: string): NavItem[] => {
  const base = `/${agencySlug}/clients/${clientSlug}`;
  return [
    { label: "Culture Map", href: base, icon: MapIcon, exact: true },
    { label: "Plays & briefs", href: `${base}/plays`, icon: SparklesIcon },
    { label: "Ad checks", href: `${base}/ads`, icon: ScanSearchIcon },
    { label: "Audience & places", href: `${base}/audience`, icon: UsersIcon },
  ];
};

export type SettingsNav = { group: string; items: NavItem[] }[];

export function settingsNav(slug: string, kind: OrgKind, counts: { members: number; clients: number; agencies: number }): SettingsNav {
  const base = `/${slug}/settings`;
  return [
    {
      group: kind === "AGENCY" ? "Agency" : "Workspace",
      items: [
        { label: "General", href: `${base}/general`, icon: BuildingIcon },
        { label: "Appearance", href: `${base}/appearance`, icon: PaletteIcon },
        { label: "Members", href: `${base}/members`, icon: UsersIcon, count: counts.members },
        kind === "AGENCY"
          ? { label: "Clients", href: `${base}/clients`, icon: BriefcaseBusinessIcon, count: counts.clients }
          : { label: "Agencies", href: `${base}/agencies`, icon: LinkIcon, count: counts.agencies },
        { label: "Billing", href: `${base}/billing`, icon: BadgeDollarSignIcon },
        { label: "Qloo usage", href: `${base}/usage`, icon: TrendingUpIcon },
      ],
    },
    {
      group: "You",
      items: [
        { label: "Profile", href: `${base}/profile`, icon: UserIcon },
        { label: "Security", href: `${base}/security`, icon: LockIcon },
      ],
    },
    { group: "", items: [{ label: "Danger zone", href: `${base}/danger`, icon: CircleAlertIcon }] },
  ];
}

export const isActive = (pathname: string, item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
