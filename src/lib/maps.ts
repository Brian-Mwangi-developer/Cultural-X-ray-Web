import { api } from "@/lib/api";

/** The workspace's Culture Map as the backend returns it (GET /orgs/:id/maps/latest). */
export type MapStatus = "QUEUED" | "BUILDING" | "READY" | "FAILED";
export type MapLabel = "YOURS" | "CONTESTED" | "THEIRS";
export type MapKind = "PODCAST" | "MOVIE" | "TV_SHOW" | "DESTINATION" | "PERSON" | "ARTIST" | "BRAND" | "BOOK";

export type MapItem = { id: string; name: string; image: string | null; detail: string | null; label: MapLabel; lean: number | null; rival: string | null };

export type MapCategory = {
  kind: MapKind;
  label: string;
  noun: string;
  verb: string;
  done: boolean;
  reading: string | null;
  counts: { yours: number; contested: number; theirs: number };
  items: MapItem[];
};

/** A rebuild under way (or stopped) while the last ready map stays on show. */
export type Rebuild = { id: string; status: MapStatus; categoriesDone: number; categoriesTotal: number };

export type CultureMap = {
  id: string;
  status: MapStatus;
  market: "GB" | "US";
  categoriesDone: number;
  categoriesTotal: number;
  queryCount: number;
  thinData: boolean;
  builtAt: string | null;
  createdAt: string;
  associations: number;
  subjects: { id: string; role: "SELF" | "SEED" | "RIVAL"; entityId: string; name: string; image: string | null }[];
  categories: MapCategory[];
  rebuild?: Rebuild;
};

export const territoryOf = (label: MapLabel) => label.toLowerCase() as "yours" | "contested" | "theirs";
export const inProgress = (status: MapStatus) => status === "QUEUED" || status === "BUILDING";

export const maps = {
  latest: (orgId: string, signal?: AbortSignal) => api<{ map: CultureMap | null }>(`/orgs/${orgId}/maps/latest`, { signal }),
  /** Starts the build in the background (or resumes a failed one). Returns at once. */
  build: (orgId: string, rebuild = false) => api<{ map: { id: string; status: MapStatus } }>(`/orgs/${orgId}/maps`, { method: "POST", body: { rebuild } }),
};

/*
 * Plain words only. Owners never see affinity scores or lean percentages: Qloo's affinities
 * bunch near 1 and mean nothing at a glance. Say who holds it and which way it leans.
 */

/** "Only yours", "Shared with Ben & Jerry's", "Only Häagen-Dazs". */
export function holderOf(item: MapItem): string {
  if (item.label === "YOURS") return "Only yours";
  if (item.label === "THEIRS") return item.rival ? `Only ${item.rival}` : "Only your rivals";
  return item.rival ? `Shared with ${item.rival}` : "Shared";
}

/** For shared items: "leans your way", "about even" or "leans to Ben & Jerry's". */
export function leanOf(item: MapItem): string | null {
  if (item.label !== "CONTESTED" || item.lean == null) return null;
  if (item.lean >= 0.6) return "leans your way";
  if (item.lean <= 0.4) return `leans to ${item.rival ?? "them"}`;
  return "about even";
}

/** Holder and lean together, for a line under a name. */
export const standingOf = (item: MapItem) => [holderOf(item), leanOf(item)].filter(Boolean).join(" · ");

/** Items your customers hold (yours or shared), in Qloo's order. */
export const ownedIn = (c: MapCategory | undefined) => (c?.items ?? []).filter((i) => i.label !== "THEIRS");

export const categoryOf = (map: CultureMap, kind: MapKind) => map.categories.find((c) => c.kind === kind);

/** "My Favorite Murder with Karen Kilgariff and Georgia Hardstark" → "My Favorite Murder", for headlines and titles. */
export function shortName(name: string) {
  const short = name.replace(/\s+(with|w\/|featuring|feat\.|ft\.)\s.+$/i, "").replace(/:\s.+$/, "").trim();
  return short.length >= 3 ? short : name;
}
