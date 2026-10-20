import Link from "next/link";
import { CircleCheckIcon, Clock3Icon, FlagIcon, InboxIcon, ScanSearchIcon } from "lucide-react";
import { Chip, PageHeader, SampleBadge } from "@/components/app/parts";
import { PageBody, TopBar } from "@/components/shell/top-bar";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { INBOX } from "@/lib/sample-data";
import type { ClientSummary } from "@/lib/session";

const ICON = { check: CircleCheckIcon, flag: FlagIcon, scan: ScanSearchIcon, clock: Clock3Icon } as const;

export function InboxView({ slug, clients }: { slug: string; clients: ClientSummary[] }) {
  const active = clients.filter((c) => c.status === "ACTIVE");
  return (
    <>
      <TopBar crumbs={[{ label: "Inbox" }]} actions={<SampleBadge />} />
      <PageBody className="space-y-6">
        <PageHeader title="Inbox" description="Map updates, critic notes and rival scans across your clients." />
        {active.length === 0 ? (
          <Empty className="rounded-[14px] border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <InboxIcon strokeWidth={1.75} />
              </EmptyMedia>
              <EmptyTitle>Nothing here yet</EmptyTitle>
              <EmptyDescription>Once a client is connected, their map builds, critic notes and rival scans arrive here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y divide-soft rounded-[14px] border bg-card">
            {INBOX.map((item, i) => {
              const client = active[item.client % active.length]!;
              const Icon = ICON[item.icon];
              return (
                <li key={i} className="flex items-center gap-4 px-5 py-[calc(var(--row-y)+0.125rem)]">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border">
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-medium">
                      {item.title}
                      <Chip>{client.workspace.name}</Chip>
                    </p>
                    <p className="text-[13px] text-muted-foreground">{item.meta(client.workspace.rivals[0] ?? "its closest rival")}</p>
                  </div>
                  <span className="hidden text-[12.5px] text-muted-foreground sm:block">{item.time}</span>
                  <Link href={`/${slug}/clients/${client.workspace.slug}`} className={buttonVariants({ variant: "outline", size: "pill" })}>
                    {item.action}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
    </>
  );
}
