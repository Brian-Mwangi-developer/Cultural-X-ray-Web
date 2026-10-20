import { CheckIcon, CreditCardIcon, FileTextIcon } from "lucide-react";
import { BrandMark, Meta, Panel, SampleBadge } from "@/components/app/parts";
import { SoonButton } from "@/components/app/soon-button";
import type { ClientSummary, OrgKind } from "@/lib/session";
import { SettingsSection } from "./parts";

const PLANS = {
  AGENCY: { name: "Agency", price: "$1,200", per: "per month", queries: 10000, features: ["10,000 Qloo queries a month, pooled", "Unlimited members and clients", "Client workspaces billed to you or them"] },
  WORKSPACE: { name: "Owner", price: "$149", per: "per month", queries: 1000, features: ["1,000 Qloo queries a month", "Up to 5 members", "Ad checks up to 60 seconds"] },
} as const;

export function BillingView({ kind, clients = [] }: { kind: OrgKind; clients?: ClientSummary[] }) {
  const plan = PLANS[kind];
  const paidFor = clients.filter((c) => c.billedTo && c.heldInTrust);
  return (
    <>
      <div className="flex justify-end">
        <SampleBadge />
      </div>
      <SettingsSection title="Plan">
        <div className="flex flex-wrap items-start justify-between gap-6 rounded-[16px] border bg-card p-6">
          <div>
            <p className="text-[13px] text-muted-foreground">Current plan</p>
            <p className="mt-1 text-[26px] font-semibold tracking-[-0.025em]">{plan.name}</p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-[14px]">
                  <CheckIcon className="size-4 text-ember" strokeWidth={2} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-right">
            <p className="text-[34px] font-semibold tracking-[-0.03em]">{plan.price}</p>
            <p className="text-[13px] text-muted-foreground">{plan.per}</p>
            <SoonButton size="pill" className="mt-4 h-10 px-5" message="Plans and payment arrive with billing.">
              Change plan
            </SoonButton>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Payment">
        <div className="grid gap-4 rounded-[16px] border bg-card p-5 sm:grid-cols-3">
          <Meta label="Card">
            <span className="flex items-center gap-2">
              <CreditCardIcon className="size-4" strokeWidth={1.75} aria-hidden />
              Not added yet
            </span>
          </Meta>
          <Meta label="Next invoice">—</Meta>
          <Meta label="Billing email">Set in General</Meta>
        </div>
      </SettingsSection>

      {kind === "AGENCY" && (
        <SettingsSection title="Client workspaces you pay for" description="While you hold a workspace in trust, it's billed to you. Billing moves to the client when they take it over.">
          {paidFor.length ? (
            <ul className="divide-y rounded-[16px] border bg-card">
              {paidFor.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3.5 text-[14.5px]">
                  <BrandMark name={c.workspace.name} size="xs" />
                  <span className="flex-1 font-medium">{c.workspace.name}</span>
                  <span className="text-muted-foreground">Held in trust</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-[16px] border border-dashed px-5 py-6 text-center text-[14px] text-muted-foreground">None right now.</p>
          )}
        </SettingsSection>
      )}

      <SettingsSection title="Invoices">
        <p className="flex items-center justify-center gap-2 rounded-[16px] border border-dashed px-5 py-8 text-[14px] text-muted-foreground">
          <FileTextIcon className="size-4" strokeWidth={1.75} aria-hidden />
          Invoices appear here after your first payment.
        </p>
      </SettingsSection>
    </>
  );
}

export function UsageView({ kind, clients = [] }: { kind: OrgKind; clients?: ClientSummary[] }) {
  const plan = PLANS[kind];
  const used = kind === "AGENCY" ? 2140 : 212;
  const rows =
    kind === "AGENCY" && clients.length
      ? clients.filter((c) => c.status === "ACTIVE").map((c, i) => ({ name: c.workspace.name, maps: 2 - (i % 2), queries: [1240, 580, 320][i % 3]! }))
      : [
          { name: "Culture Map · first build", maps: 1, queries: 188 },
          { name: "Ad check · Trailhead 30s", maps: 0, queries: 24 },
        ];
  return (
    <>
      <div className="flex justify-end">
        <SampleBadge />
      </div>
      <SettingsSection title="This month">
        <div className="rounded-[16px] border bg-card p-6">
          <div className="flex items-end justify-between">
            <p>
              <span className="text-[34px] font-semibold tracking-[-0.03em] tabular-nums">{used.toLocaleString("en-US")}</span>
              <span className="ml-2 text-[15px] text-muted-foreground">of {plan.queries.toLocaleString("en-US")} Qloo queries</span>
            </p>
            <p className="text-[13px] text-muted-foreground">Resets on 1 November</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-soft">
            <div className="h-full rounded-full bg-ember" style={{ width: `${(used / plan.queries) * 100}%` }} />
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground">Cached maps don&rsquo;t count again. Rebuilding a map after 30 days does.</p>
        </div>
      </SettingsSection>
      <Panel title={kind === "AGENCY" ? "By client" : "By activity"}>
        <table className="w-full text-left text-[14px]">
          <thead className="text-[12.5px] text-muted-foreground">
            <tr className="border-b">
              <th className="px-5 py-2.5 font-normal">{kind === "AGENCY" ? "Client" : "What"}</th>
              <th className="px-3 py-2.5 font-normal">Maps built</th>
              <th className="px-5 py-2.5 text-right font-normal">Queries</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-soft">
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="px-5 py-[var(--row-y)] font-medium">{r.name}</td>
                <td className="px-3 tabular-nums">{r.maps}</td>
                <td className="px-5 text-right font-mono text-[13px] tabular-nums">{r.queries.toLocaleString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
