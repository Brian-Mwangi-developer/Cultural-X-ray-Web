import { api } from "@/lib/api";

/**
 * Qloo queries used this month, from the backend's ledger (backend Architecture.md §19). Only calls
 * that reach Qloo count; answers served from our cache are free. The pool is the payer's: a brand
 * pays for itself unless its subscription names a payer.
 */
export type Usage = {
  used: number;
  allowance: number;
  cacheHits: number;
  since: string;
  resetsOn: string;
  payer: { id: string; name: string; self: boolean };
  ownUsed: number;
  byKind: { kind: UsageKind; calls: number }[];
  byWorkspace: { workspaceId: string; name: string; calls: number }[];
};
export type UsageKind = "MAP_BUILD" | "AD_CHECK" | "PLAYS" | "LOOKUP" | "BRIEF" | "LOCALIZE" | "OTHER";

/** This month's Gemini cost (ad checks, talking to X-Ray), backend usage.service aiSpendOf. */
export type AiSpend = {
  since: string;
  /** False for members who aren't owners or admins: they only get their own line. */
  everyone: boolean;
  totalMicros: number | null;
  byPerson: { userId: string | null; name: string; email: string | null; calls: number; costMicros: number }[];
  byActivity: { name: string; costMicros: number; seconds?: number }[];
};

/** Money in plain words: "$0.42", or "under 1¢" for the small change a single read costs. */
export const dollars = (micros: number) => (micros === 0 ? "$0.00" : micros < 10_000 ? "under 1¢" : `$${(micros / 1_000_000).toFixed(2)}`);
const minutes = (s: number) => (s < 60 ? `${s} s` : `${Math.round(s / 60)} min`);
export const talkWords = (s?: number) => (s ? ` · ${minutes(s)} of talking` : "");

export const usageApi = {
  ai: (orgId: string) => api<{ spend: AiSpend }>(`/orgs/${orgId}/usage/ai`), get: (orgId: string) => api<{ usage: Usage }>(`/orgs/${orgId}/usage`) };

export const KIND_WORDS: Record<UsageKind, string> = {
  MAP_BUILD: "Culture Maps and their filtered views",
  AD_CHECK: "Ad checks",
  PLAYS: "Plays and creators",
  LOOKUP: "Brand and place search",
  BRIEF: "Briefs",
  LOCALIZE: "Local views",
  OTHER: "Other",
};

export const resetsWords = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
export const count = (n: number) => n.toLocaleString("en-US");
