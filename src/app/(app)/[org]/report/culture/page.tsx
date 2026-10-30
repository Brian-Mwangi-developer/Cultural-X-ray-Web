import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CultureReport, type Report } from "@/components/report/culture-report";
import { PrintBar } from "@/components/report/print-bar";
import { backendGet, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Culture report" };

/** The culture report on paper, ready to save as a PDF. `org` is the brand's workspace. */
export default function Page(props: PageProps<"/[org]/report/culture">) {
  return (
    <Suspense fallback={null}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ searchParams }: PageProps<"/[org]/report/culture">) {
  const [q] = await Promise.all([searchParams, requireUser()]);
  const org = typeof q.org === "string" ? q.org : null;
  if (!org) notFound();
  const { report } = (await backendGet<{ report: Report }>(`/api/v1/orgs/${encodeURIComponent(org)}/report`))!;
  return (
    <main className="paper min-h-svh bg-muted/40 print:bg-white">
      <PrintBar label={`Culture report · ${report.brand.name}`} autoPrint={q.print === "1"} />
      <div className="px-4 py-8 print:p-0">
        <CultureReport report={report} />
      </div>
    </main>
  );
}
