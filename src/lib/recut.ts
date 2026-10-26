import type { Verdict } from "@/lib/ads";
import { possessive } from "@/lib/intent";

/*
 * Suggested re-cuts (Figma R5). The backend writes them (backend/src/modules/adcheck/recut.ts);
 * `applyChanges` mirrors the backend's so a switch updates the preview at once, with no round trip.
 * Keep the two in step: the backend's tests describe the behaviour.
 */

export type RecutKind = "RECOMMENDED" | "SHORTEST" | "BOLDEST";
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
export type Clip = { shot: number; inMs: number; outMs: number; moved: boolean };
export type Overlay = { kind: "caption"; text: string; atMs: number; untilMs: number } | { kind: "endCard"; brand: string; line: string; atMs: number; untilMs: number };
export type EditList = { version: 1; kind: RecutKind; title: string; summary: string; newFootage: string; changes: EditChange[]; clips: Clip[]; overlays: Overlay[]; durationMs: number };
export type Recut = { id: string; kind: RecutKind; editList: EditList; verdict: Verdict; createdAt: string };

export const recutHref = (base: string, adId: string) => `${base}/ad-check/${adId}/recut`;

export const KIND_LABEL: Record<RecutKind, string> = { RECOMMENDED: "Recommended", SHORTEST: "Shortest · 15 s", BOLDEST: "Boldest" };

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
