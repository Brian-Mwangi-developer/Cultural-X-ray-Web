import type { Metadata } from "next";
import { Suspense } from "react";
import { TweakPage } from "@/components/pages/workspace-pages";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { ownerView } from "@/lib/page-context";

export const metadata: Metadata = { title: "Tweak a re-cut" };

export default function Page({ params, searchParams }: PageProps<"/[org]/ad-check/[adId]/recut/tweak">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: PageProps<"/[org]/ad-check/[adId]/recut/tweak">) {
  const [{ adId }, q] = await Promise.all([params, searchParams]);
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  return <TweakPage view={await ownerView(params)} adId={adId} from={one(q.from)} off={(one(q.off) ?? "").split(",").filter(Boolean)} />;
}
