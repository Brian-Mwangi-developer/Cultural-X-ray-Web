import {
  BadgeDollarSignIcon,
  BuildingIcon,
  CircleAlertIcon,
  FileTextIcon,
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

/** A brand's workspace pages: the same list for its own team and for a connected agency. */
const workspaceNav = (base: string): NavItem[] => [
  { label: "Overview", href: base, icon: HouseIcon, exact: true },
  { label: "Culture Map", href: `${base}/map`, icon: MapIcon },
  { label: "Audience & places", href: `${base}/audience`, icon: UsersIcon },
  { label: "Plays", href: `${base}/plays`, icon: SparklesIcon },
  { label: "Briefs", href: `${base}/briefs`, icon: FileTextIcon },
  { label: "Ad check", href: `${base}/ad-check`, icon: ScanSearchIcon },
];

export const ownerNav = (slug: string): NavItem[] => [...workspaceNav(`/${slug}`), { label: "Ask X-Ray", href: `/${slug}/ask`, icon: MessageSquareIcon, shortcut: "⌘J" }];

export const agencyNav = (slug: string): NavItem[] => [
  { label: "Home", href: `/${slug}`, icon: HouseIcon, exact: true },
  { label: "Inbox", href: `/${slug}/inbox`, icon: InboxIcon },
  { label: "Ask X-Ray", href: `/${slug}/ask`, icon: MessageSquareIcon, shortcut: "⌘J" },
];

export const clientNav = (agencySlug: string, clientSlug: string): NavItem[] => workspaceNav(`/${agencySlug}/clients/${clientSlug}`);

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
        { label: "Usage", href: `${base}/usage`, icon: TrendingUpIcon },
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
