"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckIcon, CircleCheckIcon, Clock3Icon, CopyIcon, LinkIcon, MoreHorizontalIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import { BrandMark, Meta } from "@/components/app/parts";
import { ACCESS_COPY, type Access } from "@/components/clients/client-form";
import { SelectField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { attempt } from "@/lib/feedback";
import type { AgencyConnection, OrgContext } from "@/lib/session";
import { cn } from "@/lib/utils";
import { SettingsSection } from "./parts";

const ACCESS_OPTIONS = (Object.keys(ACCESS_COPY) as Access[]).map((a) => ({ value: a, label: ACCESS_COPY[a].label }));
const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" });

function since(iso: string) {
  const hours = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  return dateFormat.format(new Date(iso));
}

/** b1: the agencies working in this workspace, and the code to invite one. */
export function AgenciesManager({ org, agencies }: { org: OrgContext; agencies: AgencyConnection[] }) {
  const router = useRouter();
  const o = org.organization;
  const manager = org.membership.role === "owner" || org.membership.role === "admin";
  const [busy, setBusy] = useState<string | null>(null);
  const [asked, setAsked] = useState<Record<string, Access>>({});
  const [code, setCode] = useState(o.connectCode);
  const [copied, setCopied] = useState(false);

  async function run(id: string, fn: () => Promise<unknown>, where: string, success: string) {
    setBusy(id);
    const result = await attempt(fn, { where, success });
    setBusy(null);
    if (result.ok) router.refresh();
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${what} copied`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Your browser blocked copying. Select the code and copy it instead.");
    }
  }

  async function rotate() {
    setBusy("code");
    const result = await attempt(() => api<{ connectCode: string }>(`/orgs/${o.id}/connect-code`, { method: "POST" }), { where: "settings.agencies.rotate", success: "New code ready. The old one no longer works." });
    setBusy(null);
    if (result.ok) setCode(result.data.connectCode);
  }

  return (
    <>
      {agencies.length === 0 && (
        <p className="rounded-[14px] border border-dashed px-5 py-8 text-center text-[14px] text-muted-foreground">No agencies yet. Share your code below and approve them when they ask.</p>
      )}

      {agencies.map((a) => {
        const requested = a.status === "REQUESTED";
        const level = asked[a.id] ?? a.accessRequested;
        return (
          <section key={a.id} className={cn("overflow-hidden rounded-[16px] border bg-card", requested && "border-ember/70 ring-1 ring-ember/30")}>
            <header className="flex flex-wrap items-center gap-4 px-5 py-4">
              <BrandMark name={a.agency.name} logo={a.agency.logo} tone={requested ? "ink" : "ember"} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[16px] font-semibold">
                  {a.agency.name}
                  {requested ? (
                    <span className="flex items-center gap-1 text-[13px] font-normal text-ember-ink">
                      <Clock3Icon className="size-3.5" strokeWidth={2} aria-hidden />
                      Wants access
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[13px] font-normal">
                      <CircleCheckIcon className="size-3.5" strokeWidth={2} aria-hidden />
                      Connected
                    </span>
                  )}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {requested
                    ? `Asked ${since(a.requestedAt)}${a.requestedBy ? ` by ${a.requestedBy.name} · ${a.requestedBy.email}` : ""}`
                    : `Connected since ${dateFormat.format(new Date(a.decidedAt ?? a.requestedAt))}${a.origin === "AGENCY_CREATED" ? " · they set this workspace up" : ""}`}
                </p>
              </div>
              {manager &&
                (requested ? (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="pill" className="h-9 px-4" disabled={busy === a.id} onClick={() => run(a.id, () => api(`/connections/${a.id}/decide`, { body: { approve: false } }), "settings.agencies.decline", `${a.agency.name} declined`)}>
                      Decline
                    </Button>
                    <Button size="pill" className="h-9 px-4" disabled={busy === a.id} onClick={() => run(a.id, () => api(`/connections/${a.id}/decide`, { body: { approve: true, access: level } }), "settings.agencies.approve", `${a.agency.name} can now ${ACCESS_COPY[level].label.toLowerCase()}`)}>
                      {busy === a.id ? <Spinner className="size-3.5" /> : <CheckIcon data-icon="inline-start" />}
                      Approve
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <SelectField
                      value={a.access ?? "VIEW"}
                      onChange={(access) => run(a.id, () => api(`/connections/${a.id}/access`, { method: "PATCH", body: { access } }), "settings.agencies.access", `Access changed to ${ACCESS_COPY[access].label}`)}
                      options={ACCESS_OPTIONS}
                      size="sm"
                      className="w-32"
                      disabled={busy === a.id}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`More for ${a.agency.name}`} />}>
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-[12px] p-1.5">
                        <DropdownMenuItem variant="destructive" onClick={() => router.push(`/${o.slug}/settings/danger?remove=${a.id}`)}>
                          Remove agency…
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
            </header>
            <div className="grid gap-4 border-t bg-muted/50 px-5 py-4 sm:grid-cols-[150px_200px_1fr]">
              <Meta label="Access">
                {requested ? (
                  manager ? (
                    <SelectField value={level} onChange={(v) => setAsked((cur) => ({ ...cur, [a.id]: v }))} options={ACCESS_OPTIONS} size="sm" className="mt-1 w-32" />
                  ) : (
                    `${ACCESS_COPY[a.accessRequested].label} (asked)`
                  )
                ) : (
                  ACCESS_COPY[a.access ?? "VIEW"].label
                )}
              </Meta>
              <Meta label="People">{a.people.length ? a.people.slice(0, 3).join(", ") + (a.people.length > 3 ? ` +${a.people.length - 3}` : "") : "—"}</Meta>
              <Meta label="Can">
                <span className="font-normal">
                  {ACCESS_COPY[requested ? level : (a.access ?? "VIEW")].can}
                  {requested ? " You can lower or raise this before approving." : " Not billing, members or deleting anything."}
                </span>
              </Meta>
            </div>
          </section>
        );
      })}

      <SettingsSection title="Invite an agency">
        <div className="flex flex-wrap items-center gap-4 rounded-[16px] border bg-card px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-medium">Share this code with your agency</p>
            <p className="text-[13px] text-muted-foreground">They enter it under Add client → Connect. You still approve the access.</p>
          </div>
          {code ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copy(code, "Code")}
                className="inline-flex h-11 items-center gap-3 rounded-[12px] border bg-muted px-4 font-mono text-[15px] tracking-wide transition-colors hover:border-foreground/25"
                aria-label={`Copy workspace code ${code}`}
              >
                {code}
                {copied ? <CheckIcon className="size-4" strokeWidth={2} /> : <CopyIcon className="size-4 text-muted-foreground" strokeWidth={1.75} />}
              </button>
              {manager && (
                <Button variant="outline" size="pill" className="h-11 px-4" onClick={rotate} disabled={busy === "code"} title="Make a new code; the old one stops working">
                  {busy === "code" ? <Spinner className="size-3.5" /> : <RefreshCwIcon data-icon="inline-start" />}
                  New code
                </Button>
              )}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <LinkIcon className="size-4" strokeWidth={1.75} aria-hidden />
              Only owners and admins can see the code.
            </p>
          )}
        </div>
      </SettingsSection>
    </>
  );
}
