import { api } from "@/lib/api";
import type { Words } from "@/lib/basis";
import { possessive } from "@/lib/intent";

/*
 * The Culture Map page (backend Architecture.md §14.5): one category of the latest map under the
 * chosen filters. Filtered views are built on first ask and kept. Everything is said in words: the
 * page shows where an item ranks for each side, never Qloo's raw scores.
 */

export type Kind = "PODCAST" | "MOVIE" | "TV_SHOW" | "DESTINATION" | "PERSON" | "ARTIST" | "BRAND" | "BOOK";
export type AgeKey = "" | "age:under_25" | "age:25_34" | "age:35_44" | "age:45_54" | "age:55_plus";
export type Tier = "MAINSTREAM" | "NICHE";
type Label = "YOURS" | "CONTESTED" | "THEIRS";

export type Call = { side: string; path: string; params: Record<string, string | number>; warnings: number };
export type TerritoryItem = {
  id: string;
  name: string;
  image: string | null;
  detail: string | null;
  label: Label;
  reach: "mainstream" | "niche";
  lean: number | null;
  you: { rank: number; of: number } | null;
  them: { name: string; rank: number | null; of: number } | null;
  calls: Call[];
};
export type Counts = { yours: number; contested: number; theirs: number };
export type TerritoryView = {
  map: { id: string; market: "GB" | "US"; builtAt: string | null; queryCount: number; you: string | null; rivals: string[]; known: boolean; through: string[] } | null;
  view: {
    kind: Kind;
    segment: AgeKey;
    tier: Tier;
    status: "ready" | "building" | "missing";
    cost: number;
    /** Nearly everything shared and nothing only yours: Qloo can’t tell customers apart under this filter. */
    sameForEveryone: boolean;
    reading: string | null;
    counts: Record<Kind, Counts | null>;
    items: TerritoryItem[];
  } | null;
};

export const KINDS: { kind: Kind; label: string; noun: string; one: string; verb: string }[] = [
  { kind: "PODCAST", label: "Podcasts", noun: "podcasts", one: "Podcast", verb: "listen to" },
  { kind: "MOVIE", label: "Films", noun: "films", one: "Film", verb: "watch" },
  { kind: "TV_SHOW", label: "TV", noun: "TV shows", one: "TV show", verb: "watch" },
  { kind: "PERSON", label: "Creators", noun: "creators", one: "Creator", verb: "follow" },
  { kind: "ARTIST", label: "Artists", noun: "artists", one: "Artist", verb: "listen to" },
  { kind: "DESTINATION", label: "Places", noun: "places", one: "Place", verb: "go to" },
  { kind: "BRAND", label: "Brands", noun: "brands", one: "Brand", verb: "also buy" },
  { kind: "BOOK", label: "Books", noun: "books", one: "Book", verb: "read" },
];
export const kindOf = (k: Kind) => KINDS.find((x) => x.kind === k)!;

export const AGES: { value: AgeKey; label: string }[] = [
  { value: "", label: "Everyone" },
  { value: "age:under_25", label: "Under 25" },
  { value: "age:25_34", label: "25–34" },
  { value: "age:35_44", label: "35–44" },
  { value: "age:45_54", label: "45–54" },
  { value: "age:55_plus", label: "55 and over" },
];
export const TIERS: { value: Tier; label: string }[] = [
  { value: "MAINSTREAM", label: "Mainstream" },
  { value: "NICHE", label: "Niche" },
];

const query = (kind: Kind, segment: AgeKey, tier: Tier) => `category=${kind}${segment ? `&age=${encodeURIComponent(segment)}` : ""}${tier === "NICHE" ? "&tier=NICHE" : ""}`;
export const territory = {
  get: (orgId: string, kind: Kind, segment: AgeKey, tier: Tier) => api<TerritoryView>(`/orgs/${orgId}/maps/latest/territory?${query(kind, segment, tier)}`),
  build: (orgId: string, kind: Kind, segment: AgeKey, tier: Tier) => api<{ queued: boolean }>(`/orgs/${orgId}/maps/latest/territory?${query(kind, segment, tier)}`, { method: "POST" }),
};

export const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
};

/** Which way a shared item leans, in words. Lean is your share of where it ranks (0.5 is even). */
/** Which way a shared item leans, in words. Lean is this side's share of where it ranks (0.5 is even). */
export function leanWords(item: TerritoryItem, words: Words) {
  const l = item.lean ?? 0.5;
  if (l >= 0.55) return words.ownColumn === "Yours" ? "Leans your way" : words.ownColumn === "Open to you" ? "Leans to brands like yours" : `Leans ${words.rankFor.replace(/^for /, "")}`;
  if (l <= 0.45) return `Leans ${item.them?.name ?? "a rival"}`;
  return "Even";
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The sentence behind an item's place on the map, for its tooltip and the drawer. `words` says whose
 * customers this side is: the brand's own, or (for a brand Qloo doesn't know) the brands it's read through.
 */
export function whyHere(item: TerritoryItem, words: Words, rivals: string[], noun: string) {
  const look = words.ownColumn === "Open to you";
  const yours = item.you ? `${cap(words.who)} rank ${item.name} ${ordinal(item.you.rank)} of the ${item.you.of} ${noun} Qloo lists for them` : null;
  if (item.label === "YOURS") {
    const others = rivals.length ? `${rivals.map(possessive).join(" and ")} customers don’t have it in their top ${item.you?.of ?? 20}` : "No rival’s customers rank it";
    return `${yours}. ${others}, so ${look ? "it’s open ground a brand like yours could take" : "no rival holds it"}.`;
  }
  if (item.label === "CONTESTED" && item.them) {
    const theirs = `${possessive(item.them.name)} customers rank it ${item.them.rank ? ordinal(item.them.rank) : "too"}`;
    const l = item.lean ?? 0.5;
    const where = l >= 0.55 ? `It sits higher on ${words.who}’ list.` : l <= 0.45 ? `It sits higher on ${possessive(item.them.name)} list, so it leans their way.` : "It sits about level on both lists.";
    return `${yours}; ${theirs}. ${where}`;
  }
  if (item.them) return `${possessive(item.them.name)} customers rank ${item.name} ${item.them.rank ? ordinal(item.them.rank) : "in their top 20"}; ${words.who} don’t rank it. It’s a rival’s ground.`;
  return `${item.name} is on the map.`;
}

export const builtWords = (iso: string | null, now = Date.now()) => {
  if (!iso) return "Built";
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  return days < 1 ? "Built today" : days === 1 ? "Built yesterday" : `Built ${days} days ago`;
};
