import { api } from "@/lib/api";
import type { Territory } from "@/components/app/parts";

/*
 * Ad check (Figma page 11, boards R1–R4). The backend reads the ad in its worker; these pages upload,
 * poll and show what came back. Words only: territory is a glyph plus a word, never a score.
 */

export type AdStatus = "UPLOADING" | "UPLOADED" | "QUEUED" | "READING" | "PROCESSING" | "READY" | "FAILED";
export type Lean = "yours" | "theirs" | "mixed" | "unclear";
type Label = "YOURS" | "CONTESTED" | "THEIRS";

export type AdSummary = {
  id: string;
  title: string;
  fileName: string | null;
  status: AdStatus;
  stage: string | null;
  failureReason: string | null;
  durationMs: number | null;
  width: number | null;
  height: number | null;
  placements: string[];
  createdAt: string;
  readAt: string | null;
  shotCount: number;
  hasVideo: boolean;
  uploadedBy: { id: string; name: string } | null;
  lean: Lean | null;
  rival: string | null;
  headline: string | null;
};

export type ShotDescription = { setting: string; action: string; people: { role: string; doing: string }[]; objects: string[]; styling: string[]; mood: string; framing: string; text: string[] };
export type AdShot = { index: number; startMs: number; endMs: number; description: ShotDescription | null; territory: Label | null };
export type AdElement = { id: string; kind: "SETTING" | "STYLING" | "SCRIPT" | "ONSCREEN_TEXT" | "SOUND" | "CREATOR" | "REFERENCE" | "LOGO"; raw: string; detail: Record<string, unknown> | null; startMs: number; endMs: number };
type Item = { cue: string; shots: number[] };
export type Verdict = {
  lean: Lean;
  rival: string | null;
  headline: string;
  yours: Item[];
  shared: (Item & { rival: string })[];
  theirs: (Item & { rival: string })[];
  noRead: string[];
  references: { name: string; says: string }[];
  reshoot: string[];
  notes: string[];
};
export type AdDetail = Omit<AdSummary, "lean" | "rival" | "headline"> & {
  shots: AdShot[];
  elements: AdElement[];
  check: { id: string; mapId: string; verdict: Verdict; createdAt: string } | null;
};

export const PLACEMENTS = [
  { id: "tiktok", label: "TikTok" },
  { id: "reels", label: "Instagram Reels" },
  { id: "shorts", label: "YouTube Shorts" },
  { id: "youtube", label: "YouTube" },
  { id: "feed", label: "Facebook & Instagram feed" },
  { id: "stories", label: "Stories" },
  { id: "tv", label: "TV / cinema" },
] as const;
export type Placement = (typeof PLACEMENTS)[number]["id"];

export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const MAX_SECONDS = 60;
export const MAX_BYTES = 1_000_000_000;

export const ads = {
  list: (orgId: string, signal?: AbortSignal) => api<{ ads: AdSummary[] }>(`/orgs/${orgId}/ads`, { signal }),
  get: (orgId: string, adId: string, signal?: AbortSignal) => api<{ ad: AdDetail }>(`/orgs/${orgId}/ads/${adId}`, { signal }),
  create: (orgId: string, file: { fileName: string; sizeBytes: number; contentType: string }) =>
    api<{ adId: string; pathname: string; clientToken: string; access: "private" | "public"; maxSeconds: number }>(`/orgs/${orgId}/ads`, { body: file }),
  start: (orgId: string, adId: string, body: { pathname: string; placements: Placement[] }) =>
    api<{ ad: { id: string; status: AdStatus } }>(`/orgs/${orgId}/ads/${adId}/start`, { body }),
  retry: (orgId: string, adId: string) => api<{ ad: { id: string; status: AdStatus } }>(`/orgs/${orgId}/ads/${adId}/start`, { body: {} }),
  deleteVideo: (orgId: string, adId: string) => api<void>(`/orgs/${orgId}/ads/${adId}/video`, { method: "DELETE" }),
  remove: (orgId: string, adId: string) => api<void>(`/orgs/${orgId}/ads/${adId}`, { method: "DELETE" }),
};

/** Same-origin, so frames drawn from it don't taint a canvas. */
export const videoUrl = (orgId: string, adId: string) => `/api/v1/orgs/${orgId}/ads/${adId}/video`;

export const reading = (status: AdStatus) => status === "QUEUED" || status === "READING" || status === "PROCESSING" || status === "UPLOADED";

/* ------------------------------------------------------------------ words */

export const territoryOfLabel = (label: Label | null): Territory | null => (label ? (label.toLowerCase() as Territory) : null);

/** The verdict's lean as a glyph and a word, for the read card and the list. */
export function leanWord(lean: Lean | null, rival: string | null): { glyph: Territory | null; word: string } {
  if (lean === "yours") return { glyph: "yours", word: "Reads as yours" };
  if (lean === "theirs") return { glyph: "theirs", word: rival ? `Leans toward ${rival}` : "Leans toward a rival" };
  if (lean === "mixed") return { glyph: "contested", word: "Pulls both ways" };
  return { glyph: null, word: "Not enough to go on" };
}

/** "0:04" */
export function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** "30 s", "1 min 5 s" */
export function seconds(ms: number | null) {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ""}`;
}

export function megabytes(bytes: number) {
  return bytes >= 1_000_000_000 ? `${(bytes / 1_000_000_000).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1_000_000))} MB`;
}

/** "just now", "4 min ago", "2 h ago", "3 days ago", then the date. */
export function ago(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86_400) return `${Math.round(s / 3600)} h ago`;
  if (s < 7 * 86_400) return `${Math.round(s / 86_400)} day${Math.round(s / 86_400) > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** "Shot 2", "Shots 2 and 5", "Shots 2, 3 and 6" (shots are 0-based in data, 1-based for people). */
export function shotWords(shots: number[]) {
  const n = [...new Set(shots)].sort((a, b) => a - b).map((i) => String(i + 1));
  if (!n.length) return "The whole ad";
  if (n.length === 1) return `Shot ${n[0]}`;
  return `Shots ${n.slice(0, -1).join(", ")} and ${n.at(-1)}`;
}

export const sentence = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/** What each shot is, in a few words: its action, else its setting. */
export const shotName = (shot: AdShot) => sentence(shot.description?.action ?? shot.description?.setting ?? `Shot ${shot.index + 1}`);

/* ------------------------------------------------------------- progress */

export const STEPS = [
  { id: "prepare", title: "Finding the shots", stages: ["uploading", "queued", "preparing", "finding shots"] },
  { id: "watch", title: "Watching, reading the text and listening", stages: ["watching"] },
  { id: "describe", title: "Describing each shot", stages: ["describing shots"] },
  { id: "place", title: "Comparing it with your customers’ culture", stages: ["saving", "placing on your map"] },
] as const;

/** Which step the reading is on (0-based), from the worker's stage. */
export function stepOf(status: AdStatus, stage: string | null) {
  if (status === "READY") return STEPS.length;
  const i = STEPS.findIndex((s) => (s.stages as readonly string[]).includes(stage ?? "queued"));
  return Math.max(0, i);
}
