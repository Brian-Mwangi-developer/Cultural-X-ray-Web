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

export const usageApi = { get: (orgId: string) => api<{ usage: Usage }>(`/orgs/${orgId}/usage`) };

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
