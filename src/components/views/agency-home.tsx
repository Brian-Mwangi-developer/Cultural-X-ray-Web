import Link from "next/link";
import { BriefcaseBusinessIcon, CircleCheckIcon, Clock3Icon, FlagIcon, GlobeIcon, LoaderCircleIcon, MessageSquareIcon, PlusIcon, ScanSearchIcon, SendIcon } from "lucide-react";
import { BrandMark, Chip, Panel, SampleBadge, Status } from "@/components/app/parts";
import { SoonButton } from "@/components/app/soon-button";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { PageBody, TopBar } from "@/components/shell/top-bar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { isManager } from "@/lib/roles";
import { INBOX } from "@/lib/sample-data";
import type { ClientSummary, OrgContext } from "@/lib/session";
import { cn } from "@/lib/utils";

const INBOX_ICON = { check: CircleCheckIcon, flag: FlagIcon, scan: ScanSearchIcon, clock: Clock3Icon } as const;

const marketText = (markets: string[]) => markets.map((m) => (m === "GB" ? "UK" : m)).join(" · ");

/** a1: the agency's home. Clients are real; the activity feed is sample until maps run. */
export function AgencyHome({ org, clients, firstName, today }: { org: OrgContext; clients: ClientSummary[]; firstName: string; today: string }) {
  const o = org.organization;
  const active = clients.filter((c) => c.status === "ACTIVE");
  const manager = isManager(org.membership.role);
  const addClient = manager ? (
    <AddClientDialog
      agency={{ id: o.id, name: o.name }}
      trigger={
        <Button size="pill" className="h-9 px-4">
          <PlusIcon data-icon="inline-start" />
          Add client
        </Button>
      }
    />
  ) : null;

  return (
    <>
      <TopBar crumbs={[{ label: "Home" }]} />
      <PageBody className="space-y-8">
        <div>
          <p className="text-[11.5px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
            {o.name} · {active.length} {active.length === 1 ? "client" : "clients"} · {today}
          </p>
          <h1 className="mt-2.5 text-[30px] leading-[1.1] font-semibold tracking-[-0.03em] lg:text-[38px]">
            {active.length ? "Here’s what moved since yesterday." : `Welcome, ${firstName}. Let’s add your first client.`}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {active.length > 0 ? (
              <SoonButton size="pill" className="h-9 px-4" message="New maps arrive with the Culture Map engine.">
                <PlusIcon data-icon="inline-start" />
                New culture map
              </SoonButton>
            ) : (
              addClient
            )}
            <SoonButton variant="outline" size="pill" className="h-9 px-4" message="Ad checks arrive with the ad-check engine.">
              <ScanSearchIcon data-icon="inline-start" />
              Check an ad
            </SoonButton>
            <Link href={`/${o.slug}/ask`} className={cn(buttonVariants({ variant: "outline", size: "pill" }), "h-9 px-4")}>
              <MessageSquareIcon data-icon="inline-start" />
              Ask X-Ray
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel title="Inbox" action={<SampleBadge />}>
            {active.length ? (
              <ul className="divide-y divide-soft">
                {INBOX.map((item, i) => {
                  const client = active[item.client % active.length]!;
                  const Icon = INBOX_ICON[item.icon];
                  return (
                    <li key={i} className="flex items-center gap-4 px-5 py-[calc(var(--row-y)+0.25rem)]">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border">
                        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-medium">
                          {item.title}
                          <Chip>{client.workspace.name}</Chip>
                        </p>
                        <p className="truncate text-[13px] text-muted-foreground">{item.meta(client.workspace.rivals[0] ?? "its closest rival")}</p>
                      </div>
                      <span className="hidden text-[12.5px] text-muted-foreground sm:block">{item.time}</span>
                      <Link href={`/${o.slug}/clients/${client.workspace.slug}`} className={buttonVariants({ variant: "outline", size: "pill" })}>
                        {item.action}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-8 text-[14px] text-muted-foreground">Map updates, critic notes and rival scans for your clients land here.</p>
            )}
          </Panel>

          <Panel title="Markets">
            <ul className="divide-y divide-soft">
              {[
                { code: "US", name: "United States", coverage: "Full coverage" },
                { code: "GB", name: "United Kingdom", coverage: "Full coverage" },
              ].map((m) => {
                const count = active.filter((c) => c.workspace.markets.includes(m.code as "US" | "GB")).length;
                return (
                  <li key={m.code} className="flex items-center gap-3 px-5 py-3.5">
                    <CircleCheckIcon className="size-4" strokeWidth={1.75} aria-hidden />
                    <div className="flex-1">
                      <p className="text-[14.5px] font-medium">{m.name}</p>
                      <p className="text-[12.5px] text-muted-foreground">{m.coverage}</p>
                    </div>
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                      {count} {count === 1 ? "client" : "clients"}
                    </span>
                  </li>
                );
              })}
              <li className="flex items-center gap-3 px-5 py-3.5">
                <Clock3Icon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                <div className="flex-1">
                  <p className="text-[14.5px] font-medium">Kenya, Nigeria</p>
                  <p className="text-[12.5px] text-muted-foreground">Thin coverage in Qloo</p>
                </div>
                <span className="text-[13px] text-muted-foreground">Not offered yet</span>
              </li>
            </ul>
          </Panel>
        </div>

        <Panel
          title="Clients"
          action={
            <span className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] sm:flex">
                <GlobeIcon className="size-3.5" strokeWidth={1.75} aria-hidden />
                All markets
              </span>
              {clients.length > 0 && addClient}
            </span>
          }
        >
          {clients.length === 0 ? (
            <Empty className="border-0 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BriefcaseBusinessIcon strokeWidth={1.75} />
                </EmptyMedia>
                <EmptyTitle>No clients yet</EmptyTitle>
                <EmptyDescription>Set up a workspace for a brand and send them a claim link, or connect to a brand already here with their code.</EmptyDescription>
              </EmptyHeader>
              {addClient && <EmptyContent>{addClient}</EmptyContent>}
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[14px]">
                <thead className="text-[12.5px] text-muted-foreground">
                  <tr className="border-b">
                    <th className="px-5 py-2.5 font-normal">Client</th>
                    <th className="px-3 py-2.5 font-normal">Status</th>
                    <th className="px-3 py-2.5 font-normal">Market</th>
                    <th className="hidden px-3 py-2.5 font-normal lg:table-cell">Owner</th>
                    <th className="px-5 py-2.5 font-normal">Your access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft">
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-[var(--row-y)]">
                        {c.status === "ACTIVE" ? (
                          <Link href={`/${o.slug}/clients/${c.workspace.slug}`} className="flex items-center gap-2.5 font-medium hover:underline">
                            <BrandMark name={c.workspace.name} size="xs" />
                            {c.workspace.name}
                          </Link>
                        ) : (
                          <span className="flex items-center gap-2.5 font-medium">
                            <BrandMark name={c.workspace.name} size="xs" />
                            {c.workspace.name}
                          </span>
                        )}
                      </td>
                      <td className="px-3">
                        <ClientStatus client={c} />
                      </td>
                      <td className="px-3">{marketText(c.workspace.markets) || "—"}</td>
                      <td className="hidden max-w-[220px] truncate px-3 text-foreground/85 lg:table-cell">{c.owner?.name ?? c.claim?.email ?? "—"}</td>
                      <td className="px-5">{accessText(c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </PageBody>
    </>
  );
}

export function ClientStatus({ client }: { client: ClientSummary }) {
  if (client.status === "REQUESTED") return <Status icon={SendIcon}>Request sent</Status>;
  if (client.status === "DECLINED") return <Status icon={FlagIcon} className="text-muted-foreground">Declined</Status>;
  if (client.claim?.expired) return <Status icon={Clock3Icon} attention>Claim link expired</Status>;
  if (client.claim) return <Status icon={Clock3Icon} attention>Waiting to be claimed</Status>;
  if (client.owner) return <Status icon={CircleCheckIcon}>Connected</Status>;
  return <Status icon={LoaderCircleIcon}>Setting up</Status>;
}

const ACCESS_LABEL = { VIEW: "View", EDIT: "Edit", MANAGE: "Manage" } as const;
export const accessText = (c: ClientSummary) => (c.status === "REQUESTED" ? `${ACCESS_LABEL[c.accessRequested]} (asked)` : c.access ? ACCESS_LABEL[c.access] : "—");
