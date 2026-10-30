import { api } from "@/lib/api";
import type { Verdict } from "@/lib/ads";
import { possessive } from "@/lib/intent";

/*
 * Suggested re-cuts (Figma R5). The backend writes them (backend/src/modules/adcheck/recut.ts);
 * `applyChanges` mirrors the backend's so a switch updates the preview at once, with no round trip.
 * Keep the two in step: the backend's tests describe the behaviour.
 */

export type RecutKind = "RECOMMENDED" | "SHORTEST" | "BOLDEST" | "CUSTOM";
type Label = "YOURS" | "CONTESTED" | "THEIRS" | null;
export type Proof = { cue: string; tag: { name: string; type: string } | null; territory: Label; rival: string | null; shot: number };
export type EditChange = {
  id: string;
  on: boolean;
  op: "drop" | "trim" | "move" | "caption" | "endcard";
  shot: number;
  position?: "first" | "last" | "before";
  before?: number;
  startS?: number;
  endS?: number;
  text?: string;
  what: string;
  why: string;
  evidence: string;
  proof: Proof | null;
};
export type Position = "top" | "middle" | "bottom";
export type Format = "9:16" | "16:9" | "1:1";
export type Sound = "original" | "mute";
export type Clip = { shot: number; inMs: number; outMs: number; moved: boolean; cropX?: number; cropY?: number; caption?: { text: string; position: Position } };
export type Overlay = { kind: "caption"; text: string; atMs: number; untilMs: number; position?: Position } | { kind: "endCard"; brand: string; line: string; atMs: number; untilMs: number };
export type EditList = {
  version: 1;
  kind: RecutKind;
  title: string;
  summary: string;
  newFootage: string;
  changes: EditChange[];
  clips: Clip[];
  overlays: Overlay[];
  durationMs: number;
  format?: Format;
  sound?: Sound;
  endCard?: string | null;
};
export type Recut = { id: string; kind: RecutKind; editList: EditList; verdict: Verdict; createdAt: string };
export type SavedVersion = Recut & { parentId: string | null; createdBy?: { name: string } | null };

export const recutHref = (base: string, adId: string) => `${base}/ad-check/${adId}/recut`;
export const tweakHref = (base: string, adId: string, from: string, off: string[] = []) => `${recutHref(base, adId)}/tweak?from=${from}${off.length ? `&off=${off.join(",")}` : ""}`;
export const versionHref = (base: string, adId: string, versionId: string) => `${recutHref(base, adId)}/${versionId}`;

export const versionsApi = {
  list: (orgId: string, adId: string) => api<{ versions: SavedVersion[] }>(`/orgs/${orgId}/ads/${adId}/versions`),
  save: (orgId: string, adId: string, body: Cut & { title: string; from: string | null }) => api<{ version: SavedVersion }>(`/orgs/${orgId}/ads/${adId}/versions`, { body }),
};

export const KIND_LABEL: Record<RecutKind, string> = { RECOMMENDED: "Recommended", SHORTEST: "Shortest · 15 s", BOLDEST: "Boldest", CUSTOM: "Your version" };

const MIN_CLIP_MS = 600;
const CAPTION_MS = 3_500;

/** The draft's shots with the switched-on changes applied: clips in order, overlays on the new timeline. */
export function applyChanges(shots: { index: number; startMs: number; endMs: number }[], changes: EditChange[], brand: string) {
  const on = changes.filter((c) => c.on);
  const known = new Set(shots.map((s) => s.index));
  const dropped = new Set(on.filter((c) => c.op === "drop" && known.has(c.shot)).map((c) => c.shot));
  if (dropped.size >= shots.length && shots[0]) dropped.delete(shots[0].index);
  const clips: Clip[] = shots.filter((s) => !dropped.has(s.index)).map((s) => ({ shot: s.index, inMs: s.startMs, outMs: s.endMs, moved: false }));

  for (const c of on.filter((c) => c.op === "trim")) {
    const clip = clips.find((k) => k.shot === c.shot);
    if (!clip || c.startS === undefined || c.endS === undefined) continue;
    const inMs = Math.max(clip.inMs, Math.round(c.startS * 1000));
    const outMs = Math.min(clip.outMs, Math.round(c.endS * 1000));
    if (outMs - inMs >= MIN_CLIP_MS) Object.assign(clip, { inMs, outMs });
  }
  for (const c of on.filter((c) => c.op === "move")) {
    const i = clips.findIndex((k) => k.shot === c.shot);
    if (i < 0) continue;
    const [clip] = clips.splice(i, 1);
    clip!.moved = true;
    let to = clips.length;
    if (c.position === "first") to = 0;
    else if (c.position === "before") {
      const j = clips.findIndex((k) => k.shot === c.before);
      if (j >= 0) to = j;
    }
    clips.splice(to, 0, clip!);
  }

  let t = 0;
  const at = new Map<number, { start: number; end: number }>();
  for (const k of clips) {
    at.set(k.shot, { start: t, end: t + (k.outMs - k.inMs) });
    t += k.outMs - k.inMs;
  }
  const overlays: Overlay[] = [];
  for (const c of on.filter((c) => c.op === "caption" && c.text)) {
    const span = at.get(c.shot);
    if (span) overlays.push({ kind: "caption", text: c.text!, atMs: span.start, untilMs: Math.min(span.end, span.start + CAPTION_MS) });
  }
  const end = on.find((c) => c.op === "endcard");
  if (end && clips.length) {
    const last = at.get(clips.at(-1)!.shot)!;
    overlays.push({ kind: "endCard", brand, line: end.text ?? "", atMs: Math.max(last.start, last.end - 3_000), untilMs: last.end });
  }
  return { clips, overlays, durationMs: t };
}

/** Where a re-cut is at a moment of its own timeline: which clip, and the time in the original. */
export function locate(clips: Clip[], ms: number) {
  let t = 0;
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i]!;
    const len = c.outMs - c.inMs;
    if (ms < t + len || i === clips.length - 1) return { index: i, sourceMs: c.inMs + Math.min(Math.max(0, ms - t), len), clipStart: t };
    t += len;
  }
  return { index: 0, sourceMs: clips[0]?.inMs ?? 0, clipStart: 0 };
}

const quote = (s: string) => `“${s.charAt(0).toUpperCase()}${s.slice(1)}”`;

/**
 * What a change rests on, in words, for its evidence tooltip. No scores: which Qloo tag the cue
 * matched, whose customers it belongs to, and where in the draft.
 */
export function proofWords(c: EditChange, brand: string, rivals: string[]): string {
  if (c.evidence === "15 s limit") return "Feeds favour 15 seconds or less, so every kept shot is shortened by the same share.";
  const p = c.proof;
  if (!p) {
    if (c.op === "endcard") return `A closing line with ${possessive(brand)} name. New words aren’t placed on your map yet; checking them is coming with “Check again”.`;
    if (c.op === "caption") return "New words written for this cut. They aren’t placed on your map yet; that’s coming with “Check again”.";
    return c.evidence ? `From the read of your draft: ${c.evidence}.` : "From the read of your draft.";
  }
  const tag = p.tag ? ` matches Qloo’s “${p.tag.name}” ${tagKind(p.tag.type)}` : "";
  const where = ` Seen in shot ${p.shot + 1} of your draft.`;
  const others = rivals.length ? `${rivals.map(possessive).join(" or ")} customers` : "your rivals’ customers";
  if (p.territory === "YOURS") return `${quote(p.cue)}${tag}. ${possessive(brand)} customers are drawn to it more than ${others}.${where}`;
  if (p.territory === "THEIRS") return `${quote(p.cue)}${tag}. ${p.rival ? possessive(p.rival) : "A rival’s"} customers are drawn to it more than yours.${where}`;
  if (p.territory === "CONTESTED") return `${quote(p.cue)}${tag}. Your customers and ${p.rival ? possessive(p.rival) : "a rival’s"} both like it.${where}`;
  return `Qloo has no clear read on ${quote(p.cue)} for your customers or your rivals’.${where}`;
}

function tagKind(type: string) {
  const t = type.split(":")[0] ?? "";
  return { lifestyle: "lifestyle", hobby: "hobby", keyword: "theme", genre: "genre", adjective: "mood", subgenre: "genre" }[t] ?? "tag";
}

/* ------------------------------------------------- a version to tweak and export (R6–R8) */

/**
 * One cut as the editor, the players and the export all read it: clips of the draft in order, each
 * with its own caption and crop, an end card line, the shape and the sound. The backend checks the
 * same shape (backend recut.ts `tweakSchema`, `editFromTweak`); keep them in step.
 */
export type Cut = {
  format: Format;
  sound: Sound;
  endCard: string | null;
  clips: { shot: number; inMs: number; outMs: number; cropX?: number; cropY?: number; caption?: { text: string; position: Position } }[];
};

const firstWord = (s: string) => s.trim();

/** Any edit list (a suggestion with its switches applied, or a saved version) as a cut. */
export function cutOf(clips: Clip[], overlays: Overlay[], edit: Partial<Pick<EditList, "format" | "sound" | "endCard">>, fallbackFormat: Format): Cut {
  // Suggested re-cuts carry captions as overlays on the cut's timeline; give each to the clip it starts on.
  let t = 0;
  const starts = clips.map((c) => {
    const s0 = t;
    t += c.outMs - c.inMs;
    return s0;
  });
  return {
    format: edit.format ?? fallbackFormat,
    sound: edit.sound ?? "original",
    endCard: edit.endCard ?? overlays.find((o): o is Extract<Overlay, { kind: "endCard" }> => o.kind === "endCard")?.line ?? null,
    clips: clips.map((c, i) => {
      const caption = c.caption ?? overlays.filter((o) => o.kind === "caption").map((o) => (o.atMs >= starts[i]! && o.atMs < starts[i]! + (c.outMs - c.inMs) ? { text: firstWord(o.text), position: (o as { position?: Position }).position ?? "bottom" } : null)).find(Boolean) ?? undefined;
      return { shot: c.shot, inMs: c.inMs, outMs: c.outMs, ...(c.cropX !== undefined ? { cropX: c.cropX } : {}), ...(c.cropY !== undefined ? { cropY: c.cropY } : {}), ...(caption ? { caption } : {}) };
    }),
  };
}

/** A cut's clips and overlays for the players and the export: captions last their clip, the end card the last 3 s. */
export function playable(cut: Cut, brand: string): { clips: Clip[]; overlays: Overlay[]; durationMs: number } {
  let last = -1;
  let t = 0;
  const clips: Clip[] = [];
  const overlays: Overlay[] = [];
  for (const c of cut.clips) {
    const len = c.outMs - c.inMs;
    clips.push({ ...c, moved: c.shot < last });
    last = Math.max(last, c.shot);
    if (c.caption?.text.trim()) overlays.push({ kind: "caption", text: c.caption.text.trim(), atMs: t, untilMs: t + len, position: c.caption.position });
    t += len;
  }
  if (cut.endCard?.trim()) overlays.push({ kind: "endCard", brand, line: cut.endCard.trim(), atMs: Math.max(0, t - 3_000), untilMs: t });
  return { clips, overlays, durationMs: t };
}

/**
 * A shorter version of a cut for feeds (15 s) or a bumper (6 s): clips keep their order and share the
 * time by length; clips that would fall under MIN_CLIP_MS are dropped from the middle first, so the
 * opening and the ending (with the end card) stay. Null when the cut is already that short.
 */
export function cutDown(cut: Cut, targetMs: number): Cut | null {
  const total = cut.clips.reduce((n, c) => n + (c.outMs - c.inMs), 0);
  if (total <= targetMs + 250) return null;
  let kept = cut.clips.map((c, i) => ({ c, i }));
  const fits = () => {
    const sum = kept.reduce((n, k) => n + (k.c.outMs - k.c.inMs), 0);
    return kept.every((k) => ((k.c.outMs - k.c.inMs) * targetMs) / sum >= MIN_CLIP_MS);
  };
  while (kept.length > 1 && !fits()) {
    // Drop the shortest clip that isn't the first or the last.
    const middle = kept.slice(1, -1);
    const pool = middle.length ? middle : kept.slice(0, -1);
    const shortest = pool.reduce((a, b) => (a.c.outMs - a.c.inMs <= b.c.outMs - b.c.inMs ? a : b));
    kept = kept.filter((k) => k !== shortest);
  }
  const sum = kept.reduce((n, k) => n + (k.c.outMs - k.c.inMs), 0);
  const share = Math.min(1, targetMs / sum);
  return { ...cut, clips: kept.map(({ c }) => ({ ...c, outMs: c.inMs + Math.max(MIN_CLIP_MS, Math.floor((c.outMs - c.inMs) * share)) })) };
}

/** The shape each place an ad runs wants. */
export const FORMAT_FOR: Record<string, Format> = { tiktok: "9:16", reels: "9:16", shorts: "9:16", stories: "9:16", feed: "1:1", youtube: "16:9", tv: "16:9" };
export const FORMAT_WORDS: Record<Format, string> = { "9:16": "9:16 · Reels, TikTok", "16:9": "16:9 · YouTube", "1:1": "1:1 · Feed" };
export const MIN_CLIP = MIN_CLIP_MS;
