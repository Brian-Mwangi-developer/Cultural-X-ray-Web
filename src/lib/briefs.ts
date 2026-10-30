import { api } from "@/lib/api";
import type { Placement } from "@/lib/ads";

/**
 * Briefs: a one-page creative brief written from the Culture Map (backend src/modules/briefs). Every
 * line about the customers or rivals cites the map items it rests on; must-haves for each channel are
 * added by code. Sections come in a fixed order.
 */

export const SECTIONS = ["ask", "audience", "insight", "proposition", "showUp", "avoid", "mandatories"] as const;
export type Section = (typeof SECTIONS)[number];
export const SECTION_TITLE: Record<Section, string> = {
  ask: "The ask",
  audience: "Who we’re talking to",
  insight: "What we know about them",
  proposition: "What to say",
  showUp: "Where to show up",
  avoid: "Steer clear of",
  mandatories: "Must-haves",
};
/** One line under each heading, saying what belongs there (shown while editing). */
export const SECTION_HINT: Record<Section, string> = {
  ask: "What the work has to do.",
  audience: "The people, through what they love.",
  insight: "The cultural truth the work is built on.",
  proposition: "The one thing to say, and how it should feel.",
  showUp: "Podcasts, creators, places and shows to be seen with.",
  avoid: "A rival’s culture that would make the work look like theirs.",
  mandatories: "What every piece must do on these channels.",
};

export type BriefRef = { entityId: string; name: string; label: "YOURS" | "CONTESTED" | "THEIRS"; rival: string | null; proof: string };
export type BriefItem = { id: string; section: Section; text: string; refs: BriefRef[] | null; state: "CITED" | "UNCITED" | "INSIGHT_ONLY" | "REJECTED" | "TAINTED" };
export type BriefSummary = { id: string; title: string; occasion: string | null; placements: string[]; status: "DRAFT" | "SHARED" | "EXPORTED" | "ARCHIVED"; shareToken: string | null; createdAt: string; updatedAt: string; author: { name: string } | null; _count?: { items: number } };
export type Brief = BriefSummary & {
  market: "GB" | "US";
  workspace: { name: string; logo: string | null };
  authorOrg: { name: string; kind: "WORKSPACE" | "AGENCY" } | null;
  items: BriefItem[];
};

export const briefsApi = {
  list: (orgId: string) => api<{ briefs: BriefSummary[] }>(`/orgs/${orgId}/briefs`),
  write: (orgId: string, body: { occasion: string; placements: Placement[] }) => api<{ brief: { id: string } }>(`/orgs/${orgId}/briefs`, { body }),
  save: (orgId: string, id: string, body: { title?: string; occasion?: string; items?: { id?: string; section: Section; text: string }[] }) => api<{ brief: Brief }>(`/orgs/${orgId}/briefs/${id}`, { method: "PUT", body }),
  remove: (orgId: string, id: string) => api<void>(`/orgs/${orgId}/briefs/${id}`, { method: "DELETE" }),
  share: (orgId: string, id: string, on: boolean) => api<{ shareToken: string | null }>(`/orgs/${orgId}/briefs/${id}/share`, { method: "PUT", body: { on } }),
};

export const briefHref = (base: string, id: string) => `${base}/briefs/${id}`;
/** The read-only link anyone can open. */
export const sharedBriefUrl = (token: string) => (typeof window === "undefined" ? `/b/${token}` : `${window.location.origin}/b/${token}`);

/** Starting points for "What's it for?". */
export const OCCASIONS = ["Summer campaign", "A new opening", "Launching something new", "Christmas", "Back to school", "Always-on social"];
