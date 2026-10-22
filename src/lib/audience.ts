import { centreOf, type GlobeCity } from "@/lib/globe-data";
import { possessive } from "@/lib/intent";

/** The Audience & places page as the backend returns it (GET /orgs/:id/maps/latest/audience). */
export type AudienceCell = { value: number | null; masked: boolean; lowConfidence: boolean };
export type AudienceSide = { key: string; name: string; readThrough: boolean };
export type AudiencePlace = {
  id: string;
  name: string;
  detail: string | null;
  lat: number | null;
  lon: number | null;
  label: "YOURS" | "CONTESTED" | "THEIRS";
  rival: string | null;
  /** 1 = that side's top place. Missing = not in that side's top 20. */
  ranks: Record<string, number>;
};
export type AudienceData = {
  id: string;
  market: "GB" | "US";
  builtAt: string | null;
  queryCount: number;
  hasAudience: boolean;
  sides: AudienceSide[];
  segments: { key: string; label: string; cells: Record<string, AudienceCell> }[];
  places: AudiencePlace[];
};

/*
 * Plain words only (BUILD-GUIDE, Copy). Scores shade the cells; the words carry the meaning,
 * so nobody has to know what 0.72 means.
 */

/** How strongly a group goes for a brand. */
export function strengthWord(cell: AudienceCell | undefined): string {
  if (!cell || cell.value == null) return "Not enough data";
  const v = cell.value;
  return v >= 0.9 ? "Very strong" : v >= 0.8 ? "Strong" : v >= 0.7 ? "Good" : v >= 0.6 ? "Some" : "Weak";
}

/** 0–1 shade for a cell; null for no data. */
export const shadeOf = (cell: AudienceCell | undefined) => (cell?.value == null ? null : Math.max(0, Math.min(1, (cell.value - 0.5) / 0.48)));

const PHRASE: Record<string, string> = {
  "age:24_and_younger": "under-25s",
  "age:25_to_29": "25 to 29s",
  "age:30_to_34": "30 to 34s",
  "age:35_to_44": "35 to 44s",
  "age:45_to_54": "45 to 54s",
  "age:55_and_older": "over-55s",
  "gender:female": "women",
  "gender:male": "men",
};
export const phraseOf = (key: string) => PHRASE[key] ?? key;

const list = (items: string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);
const usable = (c: AudienceCell | undefined): c is AudienceCell & { value: number } => c?.value != null && !c.lowConfidence;

/** A clear lead is at least this far ahead; anything closer reads as even. */
const LEAD = 0.08;

/**
 * Who reaches this group better than whom, always measured against you: "You", a rival's name
 * (or two), "About even", or null when you or every rival has no data. Thin data still counts;
 * its cell already says so.
 */
export function leaderOf(segment: AudienceData["segments"][number], sides: AudienceSide[]): string | null {
  const mine = segment.cells.you?.value;
  const rivals = sides.slice(1).filter((s) => segment.cells[s.key]?.value != null);
  if (mine == null || !rivals.length) return null;
  const ahead = rivals.filter((s) => segment.cells[s.key]!.value! - mine >= LEAD);
  if (ahead.length) return list(ahead.map((s) => s.name));
  return rivals.every((s) => mine - segment.cells[s.key]!.value! >= LEAD) ? "You" : "About even";
}

/** The page's one-line read: who you reach best, where rivals beat you, where your customers go. */
export function readOf(data: AudienceData, brand: string): string {
  const you = data.sides[0]!;
  const subject = you.readThrough ? "Your customers" : brand;
  const parts: string[] = [];
  if (data.hasAudience) {
    const mine = (s: AudienceData["segments"][number]) => s.cells.you!.value!;
    const ages = data.segments.filter((s) => s.key.startsWith("age:") && usable(s.cells.you));
    const best = [...ages].sort((a, b) => mine(b) - mine(a)).slice(0, 2);
    const gender = data.segments.filter((s) => s.key.startsWith("gender:") && usable(s.cells.you)).sort((a, b) => mine(b) - mine(a));
    const lead = gender.length === 2 && mine(gender[0]!) - mine(gender[1]!) >= LEAD ? gender : null;
    if (best.length) parts.push(`${subject} ${you.readThrough ? "are" : "is"} strongest with ${list(best.map((s) => phraseOf(s.key)))}${lead ? `, and with ${phraseOf(lead[0]!.key)} more than ${phraseOf(lead[1]!.key)}` : ""}.`);
    // Rivals ahead on the same groups share one sentence.
    const byGroups = new Map<string, { rivals: string[]; groups: string[] }>();
    for (const rival of data.sides.slice(1)) {
      const groups = data.segments.filter((s) => usable(s.cells[rival.key]) && usable(s.cells.you) && s.cells[rival.key]!.value! - mine(s) >= 0.1).slice(0, 2).map((s) => phraseOf(s.key));
      if (!groups.length) continue;
      const key = groups.join("|");
      const entry = byGroups.get(key) ?? { rivals: [], groups };
      entry.rivals.push(rival.name);
      byGroups.set(key, entry);
    }
    for (const { rivals, groups } of byGroups.values()) parts.push(`${list(rivals)} ${rivals.length > 1 ? "do" : "does"} better with ${list(groups)}.`);
  }
  const places = data.places.filter((p) => p.ranks.you).sort((a, b) => a.ranks.you! - b.ranks.you!).slice(0, 3);
  if (places.length) parts.push(`${you.readThrough ? "They" : `${possessive(brand)} customers`} go to ${list(places.map((p) => p.name))}.`);
  return parts.join(" ") || "Qloo doesn't know enough about who your customers are yet.";
}

const SUFFIX: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };
const ordinal = (n: number) => (n % 100 >= 11 && n % 100 <= 13 ? `${n}th` : `${n}${SUFFIX[n % 10] ?? "th"}`);

/** "Top pick for Jude's", "5th for Ben & Jerry's", "Not in Häagen-Dazs' top 20". */
export function rankWords(place: { ranks: Record<string, number> }, side: { key: string; name: string }): string {
  const rank = place.ranks[side.key];
  if (!rank) return `Not in ${possessive(side.name)} top 20`;
  return rank === 1 ? `Top pick for ${side.name}` : `${ordinal(rank)} for ${side.name}`;
}

/** "Top pick", "5th", or null when the side doesn't list it. For tight spaces like a list column. */
export const shortRank = (place: { ranks: Record<string, number> }, key: string) => {
  const rank = place.ranks[key];
  return rank ? (rank === 1 ? "Top pick" : ordinal(rank)) : null;
};

const TERRITORY = { YOURS: "yours", CONTESTED: "contested", THEIRS: "theirs" } as const;

/**
 * What the globe needs from the audience data: places with a location, the brands to switch
 * between, where to start looking and how tight the heat is. One market's towns sit close
 * together, so live maps start zoomed in on them; the sample spans the world.
 */
export function globeOf(data: AudienceData, sample = false) {
  const cities = data.places.flatMap((p): GlobeCity[] =>
    p.lat == null || p.lon == null ? [] : [{ id: p.id, name: p.name, region: p.detail ?? "", lat: p.lat, lng: p.lon, territory: TERRITORY[p.label], rival: p.rival, ranks: p.ranks }],
  );
  return {
    cities,
    sides: data.sides.map((s) => ({ key: s.key, name: s.name })),
    start: sample ? { lat: 38, lng: -60, altitude: 1.85 } : { ...centreOf(cities), altitude: 0.8 },
    spread: sample ? 1.1 : 0.3,
  };
}
