import { api } from "@/lib/api";
import type { Territory } from "@/components/app/parts";
import type { Basis } from "@/lib/basis";

/*
 * Plays and creators (Figma page 12, boards P1–P5). The backend writes plays from the Culture Map and
 * finds creators' channels from the handles Qloo lists (backend Architecture.md §18). Owners and their
 * agencies read the same endpoints; the backend decides who may see what.
 */

export type PlayKind = "CREATOR" | "PODCAST" | "SHOW" | "PLACE" | "SOUND" | "PARTNER" | "ARTIST" | "AESTHETIC" | "PRICE";
type Label = "YOURS" | "CONTESTED" | "THEIRS";
export type PlayItem = { entityId: string; name: string; kind: string; label: Label; rival: string | null; proof: string };
export type Play = { id: string; kind: PlayKind; title: string; rationale: string; why: string | null; brief: string[] | null; items: PlayItem[] | null; rank: number; createdAt: string };
export type PlaysList = { mapReady: boolean; writing: boolean; writtenAt: string | null; queryCount: number; plays: Play[]; basis: Basis | null };

export type Video = { id: string; title: string; published: string; views: number | null };
export type Match = "name" | "handle";
export type Creator = {
  entityId: string;
  name: string;
  image: string | null;
  description: string | null;
  label: Label;
  rival: string | null;
  proof: string;
  checked: boolean;
  youtube: { channelId: string; handle: string | null; title: string | null; subscribers: string | null; match: Match | null } | null;
  tiktok: { handle: string; name: string | null; match: Match | null } | null;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  videos: Video[];
};

export const plays = {
  refresh: (orgId: string) => api<{ ok: true }>(`/orgs/${orgId}/plays/refresh`, { method: "POST" }),
  list: (orgId: string) => api<PlaysList>(`/orgs/${orgId}/plays`),
  outreach: (orgId: string, entityId: string, playId: string | null) => api<{ draft: { subject: string; message: string } }>(`/orgs/${orgId}/creators/${entityId}/outreach`, { body: { playId } }),
};

/** Where each kind of play sits on the list, and the words for it. */
export const GROUPS: { label: string; kinds: PlayKind[] }[] = [
  { label: "Work with", kinds: ["CREATOR"] },
  { label: "Sponsor", kinds: ["PODCAST", "SHOW"] },
  { label: "Show up at", kinds: ["PLACE"] },
  { label: "Sound like", kinds: ["SOUND", "ARTIST"] },
  { label: "Team up with", kinds: ["PARTNER", "AESTHETIC", "PRICE"] },
];
export const KIND_WORD: Record<PlayKind, string> = { CREATOR: "Creator", PODCAST: "Podcast", SHOW: "TV", PLACE: "Place", SOUND: "Music", ARTIST: "Music", PARTNER: "Brand", AESTHETIC: "Look", PRICE: "Price" };

export const playHref = (base: string, id: string) => `${base}/plays/${id}` as const;
export const creatorsHref = (base: string, playId?: string) => (playId ? `${base}/plays/creators?play=${playId}` : `${base}/plays/creators`);
export const creatorHref = (base: string, entityId: string, playId?: string | null) => `${base}/plays/creators/${entityId}${playId ? `?play=${playId}` : ""}`;

export const territoryOf = (label: Label): Territory => (label === "YOURS" ? "yours" : label === "CONTESTED" ? "contested" : "theirs");


/** "30.6k" → "about 30.6k subscribers"; no count, no claim. */
export const subscriberWords = (s: string | null) => (s ? `about ${s} subscribers` : null);

export function viewsWords(n: number | null) {
  if (!n) return null;
  const f = (x: number) => (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10);
  return n >= 1e6 ? `about ${f(n / 1e6)}M views` : n >= 1e3 ? `about ${f(n / 1e3)}k views` : `${n} views`;
}

export function ago(iso: string, now = Date.now()) {
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
export const youtubeWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubeChannel = (c: NonNullable<Creator["youtube"]>) => (c.handle ? `https://www.youtube.com/@${c.handle}` : `https://www.youtube.com/channel/${c.channelId}`);
export const tiktokProfile = (handle: string) => `https://www.tiktok.com/@${handle}`;
export const instagramProfile = (handle: string) => `https://www.instagram.com/${handle}/`;
export const facebookSearch = (name: string) => `https://www.facebook.com/search/top?q=${encodeURIComponent(name)}`;
export const tiktokSearch = (name: string) => `https://www.tiktok.com/search/user?q=${encodeURIComponent(name)}`;
export const youtubeSearch = (name: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}`;
