import "server-only";
import { notFound } from "next/navigation";
import type { Crumb } from "@/components/shell/top-bar";
import { marketName, readIntent, rivalNames, seedNames } from "@/lib/intent";
import { canWork, clientRole } from "@/lib/roles";
import { agencyClients, requireOrg, requireUser, type OrgKind } from "@/lib/session";

type Params = Promise<{ org: string }>;

/** Everything a workspace page needs, with a 404 if the page doesn't exist for this kind of org. */
export async function orgPage(params: Params, kind?: OrgKind) {
  const { org: slug } = await params;
  const [user, org] = await Promise.all([requireUser(), requireOrg(slug)]);
  if (kind && org.organization.kind !== kind) notFound();
  const intent = readIntent(org.organization.metadata);
  return {
    user,
    org,
    slug,
    brand: org.organization.name,
    seeds: seedNames(intent),
    rivals: rivalNames(intent),
    market: marketName(org.organization.markets[0]),
    marketCode: org.organization.markets[0] ?? "US",
  };
}

/** A client page inside an agency: only for clients this member can see and that are connected. */
export async function clientPage(params: Promise<{ org: string; client: string }>) {
  const { client: clientSlug } = await params;
  const ctx = await orgPage(params, "AGENCY");
  const clients = await agencyClients(ctx.org.organization.id);
  const client = clients.find((c) => c.workspace.slug === clientSlug && c.status === "ACTIVE");
  if (!client) notFound();
  const base = `/${ctx.slug}/clients/${client.workspace.slug}`;
  return {
    ...ctx,
    client,
    base,
    crumbs: (page: string) => [
      { label: "Clients", href: `/${ctx.slug}/settings/clients` },
      { label: client.workspace.name, href: base },
      { label: page },
    ],
  };
}

/**
 * One brand's workspace, seen by whoever is looking: its own team (`/judesicecream/…`) or an agency
 * it's connected to (`/harborandpine/clients/judesicecream/…`). Every workspace page renders from
 * this, so both sides show the same thing. The backend decides access (workspaceAccess); `role` here
 * only shapes the UI.
 */
export type WorkspaceView = {
  orgId: string;
  brand: string;
  rivals: string[];
  market: string;
  marketCode: "US" | "GB";
  /** Where the workspace's pages live: "/judesicecream" or "/harborandpine/clients/judesicecream". */
  base: string;
  /** Breadcrumbs ending in the given parts. */
  crumbs: (...parts: Crumb[]) => Crumb[];
  role: string;
  canWork: boolean;
  /** The Ask X-Ray panel is on owner pages; agencies ask from their own Ask page. */
  canAsk: boolean;
  viaAgency: boolean;
};

export async function ownerView(params: Params): Promise<WorkspaceView> {
  const ctx = await orgPage(params, "WORKSPACE");
  const role = ctx.org.membership.role;
  return {
    orgId: ctx.org.organization.id,
    brand: ctx.brand,
    rivals: ctx.rivals,
    market: ctx.market,
    marketCode: ctx.marketCode === "GB" ? "GB" : "US",
    base: `/${ctx.slug}`,
    crumbs: (...parts) => parts,
    role,
    canWork: canWork(role),
    canAsk: true,
    viaAgency: false,
  };
}

export async function clientView(params: Promise<{ org: string; client: string }>): Promise<WorkspaceView> {
  const ctx = await clientPage(params);
  const ws = ctx.client.workspace;
  const role = clientRole(ctx.org.membership.role, ctx.client.access);
  return {
    orgId: ws.id,
    brand: ws.name,
    rivals: ws.rivals,
    market: marketName(ws.markets[0]),
    marketCode: ws.markets[0] ?? "US",
    base: ctx.base,
    crumbs: (...parts) => [{ label: "Clients", href: `/${ctx.slug}/settings/clients` }, { label: ws.name, href: ctx.base }, ...parts],
    role,
    canWork: canWork(role),
    canAsk: false,
    viaAgency: true,
  };
}
