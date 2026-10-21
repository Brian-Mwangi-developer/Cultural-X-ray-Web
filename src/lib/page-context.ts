import "server-only";
import { notFound } from "next/navigation";
import { marketName, readIntent, rivalNames, seedNames } from "@/lib/intent";
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
