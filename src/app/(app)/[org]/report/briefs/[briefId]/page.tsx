import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BriefDocument } from "@/components/briefs/brief-document";
import { PrintBar } from "@/components/report/print-bar";
import type { Brief } from "@/lib/briefs";
import { backendGet, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Brief" };

/** A brief on paper, ready to save as a PDF: no app around it. `org` is the workspace it belongs to. */
export default function Page(props: PageProps<"/[org]/report/briefs/[briefId]">) {
  return (
    <Suspense fallback={null}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: PageProps<"/[org]/report/briefs/[briefId]">) {
  const [{ briefId }, q] = await Promise.all([params, searchParams, requireUser()]);
  const org = typeof q.org === "string" ? q.org : null;
  if (!org) notFound();
  const { brief } = (await backendGet<{ brief: Brief }>(`/api/v1/orgs/${encodeURIComponent(org)}/briefs/${encodeURIComponent(briefId)}`))!;
  return (
    <main className="paper min-h-svh">
      <PrintBar label={`Brief · ${brief.title}`} autoPrint={q.print === "1"} />
      <div className="px-4 py-8 print:p-0">
        <BriefDocument brief={brief} />
      </div>
    </main>
  );
}
