import { CheckIcon, CreditCardIcon, FileTextIcon } from "lucide-react";
import { BrandMark, Meta, Panel, SampleBadge } from "@/components/app/parts";
import { SoonButton } from "@/components/app/soon-button";
import type { ClientSummary, OrgKind } from "@/lib/session";
import { count, KIND_WORDS, resetsWords, type Usage } from "@/lib/usage";
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

/** Settings › Usage: this month's Qloo queries from the ledger, where they went, and when they reset. */
export function UsageView({ kind, usage }: { kind: OrgKind; usage: Usage }) {
  const pct = usage.allowance ? Math.min(100, (usage.used / usage.allowance) * 100) : 0;
  const pooled = !usage.payer.self;
  const byClient = kind === "AGENCY" || pooled;
  const rows = byClient ? usage.byWorkspace.map((w) => ({ name: w.name, calls: w.calls })) : usage.byKind.map((k) => ({ name: KIND_WORDS[k.kind], calls: k.calls }));
  return (
    <>
      <SettingsSection title="This month">
        <div className="rounded-[16px] border bg-card p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <p>
              <span className="text-[34px] font-semibold tracking-[-0.03em] tabular-nums">{count(usage.used)}</span>
              <span className="ml-2 text-[15px] text-muted-foreground">of {count(usage.allowance)} Qloo queries</span>
            </p>
            <p className="text-[13px] text-muted-foreground">Resets on {resetsWords(usage.resetsOn)}</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-soft">
            <div className={usage.used >= usage.allowance ? "h-full rounded-full bg-destructive" : "h-full rounded-full bg-ember"} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground">
            {pooled ? `Shared with everything ${usage.payer.name} pays for; this workspace used ${count(usage.ownUsed)}. ` : ""}
            Each new question to Qloo counts once. Answers we already have are free{usage.cacheHits ? `: ${count(usage.cacheHits)} this month` : ""}.
          </p>
        </div>
      </SettingsSection>
      <Panel title={byClient ? "By workspace" : "By activity"}>
        {rows.length ? (
          <table className="w-full text-left text-[14px]">
            <thead className="text-[12.5px] text-muted-foreground">
              <tr className="border-b">
                <th className="px-5 py-2.5 font-normal">{byClient ? "Workspace" : "What"}</th>
                <th className="px-5 py-2.5 text-right font-normal">Queries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft">
              {rows.map((r) => (
                <tr key={r.name}>
                  <td className="px-5 py-[var(--row-y)] font-medium">{r.name}</td>
                  <td className="px-5 text-right font-mono text-[13px] tabular-nums">{count(r.calls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-8 text-center text-[14px] text-muted-foreground">No Qloo queries yet this month.</p>
        )}
      </Panel>
    </>
  );
}
