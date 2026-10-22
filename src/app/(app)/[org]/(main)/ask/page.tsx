import type { Metadata } from "next";
import { Suspense } from "react";
import { AskWorkspace } from "@/components/ask/ask-workspace";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { AskPage } from "@/components/views/ask-page";
import type { AskStatus, AskThread } from "@/lib/ask";
import type { CultureMap } from "@/lib/maps";
import { orgPage } from "@/lib/page-context";
import { backendGet } from "@/lib/session";

export const metadata: Metadata = { title: "Ask X-Ray" };

export default function Page({ params }: PageProps<"/[org]/ask">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

const mapLabelOf = (brand: string, map: CultureMap | null) =>
  map?.status === "READY" && map.builtAt ? `${brand} map · ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(map.builtAt))}` : null;

async function Content({ params }: Pick<PageProps<"/[org]/ask">, "params">) {
  const ctx = await orgPage(params);
  // Agencies ask across clients once they can read client maps; until then their page stays a sample.
  if (ctx.org.organization.kind === "AGENCY") return <AskPage brand="your client" />;
  const orgId = ctx.org.organization.id;
  // The open chat comes from the address hash (#t=…), read by the page in the browser.
  const [status, threads, latest] = await Promise.all([
    backendGet<AskStatus>("/api/v1/ask/status"),
    backendGet<{ threads: AskThread[] }>(`/api/v1/orgs/${orgId}/ask/threads`),
    backendGet<{ map: CultureMap | null }>(`/api/v1/orgs/${orgId}/maps/latest`),
  ]);
  return (
    <AskWorkspace
      orgId={orgId}
      slug={ctx.slug}
      brand={ctx.brand}
      status={status}
      mapLabel={mapLabelOf(ctx.brand, latest?.map ?? null)}
      threads={threads?.threads ?? []}
      initial={{ key: "new", id: null, messages: [] }}
    />
  );
}
