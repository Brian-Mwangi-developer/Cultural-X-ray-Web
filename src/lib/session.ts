import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export type OrgKind = "AGENCY" | "WORKSPACE";

export type Membership = {
  id: string;
  name: string;
  slug: string;
  kind: OrgKind;
  logo: string | null;
  role: string;
  allClients: boolean;
};

export type Preferences = {
  theme: "LIGHT" | "DARK" | "SYSTEM";
  density: "COMFORTABLE" | "COMPACT";
  reduceMotion: boolean;
  showEvidenceInline: boolean;
  locale: string;
  region: string;
  defaultMarket: "US" | "GB";
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  createdAt: string;
  activeOrganizationId: string | null;
  memberships: Membership[];
  preferences: Preferences;
  hasPassword: boolean;
};

export type OrgContext = {
  organization: {
    id: string;
    kind: OrgKind;
    name: string;
    slug: string;
    logo: string | null;
    hqCountry: string | null;
    teamSize: string | null;
    billingEmail: string | null;
    markets: ("US" | "GB")[];
    joinDomain: string | null;
    joinRole: string | null;
    connectCode: string | null;
    metadata: string | null;
    createdAt: string;
    custodian: { id: string; name: string; slug: string } | null;
  };
  membership: { id: string; role: string; allClients: boolean };
  counts: { members: number; invitations: number; clients: number; agencies: number; pendingRequests: number };
};

class BackendError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
  ) {
    super(`Backend ${path} answered ${status}`);
    this.name = "BackendError";
  }
}

/**
 * A GET to the backend as the signed-in person. 401 sends them to log in, 404 renders
 * the not-found page, anything else throws to the nearest error boundary (which reports it).
 */
/** Answers that mean "try again in a moment": the backend restarting or busy, not a real failure. */
const PASSING = new Set([429, 502, 503, 504]);
const WAITS_MS = [300, 900];

/**
 * One GET with two quick retries for passing trouble: a deploy or a dev restart refusing the
 * connection for a second, or a busy moment. Without them a page loaded at that instant fails whole.
 */
async function fetchBackend(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, init);
      if (!PASSING.has(res.status) || attempt >= WAITS_MS.length) return res;
    } catch (error) {
      if (attempt >= WAITS_MS.length) throw error;
    }
    await new Promise((r) => setTimeout(r, WAITS_MS[attempt]));
  }
}

export async function backendGet<T>(path: string, { allowAnonymous = false } = {}): Promise<T | null> {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetchBackend(`${backendUrl}${path}`, { headers: { cookie }, cache: "no-store" });
  if (res.status === 401) {
    if (allowAnonymous) return null;
    redirect("/login?expired=1");
  }
  if (res.status === 404) notFound();
  if (!res.ok) throw new BackendError(res.status, path);
  return (await res.json()) as T;
}

type MeResponse = Omit<CurrentUser, "activeOrganizationId" | "memberships" | "preferences" | "hasPassword"> & object;

function toUser(body: { user: MeResponse; activeOrganizationId: string | null; memberships: Membership[]; preferences: Preferences; hasPassword: boolean }): CurrentUser {
  return { ...body.user, activeOrganizationId: body.activeOrganizationId, memberships: body.memberships, preferences: body.preferences, hasPassword: body.hasPassword };
}

/** The signed-in user, or a redirect to /login. Call inside a Suspense boundary. One fetch per request. */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const body = await backendGet<Parameters<typeof toUser>[0]>("/api/v1/me");
  return toUser(body!);
});

/** The signed-in user, or null for visitors. For pages that work either way (invites, claims). */
export async function currentUser(): Promise<CurrentUser | null> {
  const body = await backendGet<Parameters<typeof toUser>[0]>("/api/v1/me", { allowAnonymous: true });
  return body ? toUser(body) : null;
}

/** Org context for a member, or the not-found page for everyone else. One fetch per request. */
export const requireOrg = cache(async (slug: string): Promise<OrgContext> => {
  return (await backendGet<OrgContext>(`/api/v1/orgs/${encodeURIComponent(slug)}`))!;
});

export type ClientSummary = {
  id: string;
  status: "ACTIVE" | "REQUESTED" | "DECLINED";
  origin: "AGENCY_REQUEST" | "WORKSPACE_CODE" | "AGENCY_CREATED";
  access: "VIEW" | "EDIT" | "MANAGE" | null;
  accessRequested: "VIEW" | "EDIT" | "MANAGE";
  requestedAt: string;
  workspace: { id: string; name: string; slug: string; markets: ("US" | "GB")[]; rivals: string[] };
  owner: { name: string; email: string } | null;
  claim: { email: string; status: string; expired: boolean; expiresAt: string } | null;
  heldInTrust: boolean;
  billedTo: string | null;
  team: number;
};

/** An agency's clients the signed-in member can see. */
export const agencyClients = cache(async (agencyId: string): Promise<ClientSummary[]> => {
  return (await backendGet<{ clients: ClientSummary[] }>(`/api/v1/orgs/${agencyId}/clients`))!.clients;
});

export type AgencyConnection = {
  id: string;
  status: "ACTIVE" | "REQUESTED";
  origin: ClientSummary["origin"];
  access: ClientSummary["access"];
  accessRequested: ClientSummary["accessRequested"];
  requestedAt: string;
  decidedAt: string | null;
  agency: { id: string; name: string; logo: string | null };
  requestedBy: { name: string; email: string } | null;
  people: string[];
};

/** The agencies connected to (or asking to join) a brand workspace. */
export const workspaceAgencies = cache(async (workspaceId: string): Promise<AgencyConnection[]> => {
  return (await backendGet<{ agencies: AgencyConnection[] }>(`/api/v1/orgs/${workspaceId}/agencies`))!.agencies;
});

/** Where a signed-in person should land: their active org, their first org, or onboarding. */
export function homeFor(user: CurrentUser): string {
  const active = user.memberships.find((m) => m.id === user.activeOrganizationId) ?? user.memberships[0];
  return active ? `/${active.slug}` : "/onboarding";
}
