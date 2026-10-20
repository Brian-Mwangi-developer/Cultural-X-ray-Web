"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRightIcon, CircleCheckIcon, Clock3Icon, LinkIcon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/app/parts";
import { SplitShell, Steps } from "@/components/app/split-shell";
import { ChoiceChip, COUNTRIES, FormField, MARKETS, PUBLIC_EMAIL_DOMAINS, SelectField, SlugInput, suggestSlug, TEAM_SIZES, TextInput, useSlugCheck } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { api, unwrap } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { AppError, userMessage } from "@/lib/errors";
import { attempt } from "@/lib/feedback";
import { reportError } from "@/lib/report";
import { INVITABLE_ROLES, ROLE_COPY, type InvitableRole } from "@/lib/roles";
import type { OrgContext } from "@/lib/session";
import { AgencyPreview, ClientsAside, RolesAside } from "./asides";
import { FirstClient } from "./first-client";

const STEPS = ["Agency", "Your team", "First client"];

type Props = { step: number; org: OrgContext | null; user: { email: string; name: string } };

export function AgencyFlow({ step, org, user }: Props) {
  const current = org ? Math.min(Math.max(step, 2), 3) : 1;
  if (current === 1 || !org) return <AgencyStep user={user} />;
  if (current === 2) return <TeamStep org={org} user={user} />;
  return (
    <SplitShell meta="Step 3 of 3" aside={<ClientsAside />} footnote="You can add clients any time from Home.">
      <Steps steps={STEPS} current={2} />
      <FirstClient agency={org} />
    </SplitShell>
  );
}

/* ---------------------------------------------------------------- step 1 */

function AgencyStep({ user }: { user: { email: string } }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [hq, setHq] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<"1-10" | "11-50" | "51-200" | "201+" | null>(null);
  const [markets, setMarkets] = useState<("US" | "GB")[]>(["US"]);
  const [billingEmail, setBillingEmail] = useState(user.email);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveSlug = slugEdited ? slug : suggestSlug(name);
  const slugState = useSlugCheck(effectiveSlug);

  const errors = {
    name: name.trim().length < 2 ? "Enter your agency's name." : null,
    slug: effectiveSlug.length < 3 ? "Use at least 3 characters." : slugState.status === "taken" ? slugState.reason ?? "That address is taken." : null,
    markets: markets.length ? null : "Choose at least one market.",
    billingEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail.trim()) ? null : "Enter an email like finance@agency.com.",
  };
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);
    if (Object.values(errors).some(Boolean) || slugState.status === "checking") return;
    setPending(true);
    try {
      const created = unwrap(
        await authClient.organization.create({
          name: name.trim(),
          slug: effectiveSlug,
          kind: "AGENCY",
          billingEmail: billingEmail.trim().toLowerCase(),
          ...(hq && { hqCountry: hq }),
          ...(teamSize && { teamSize }),
        }),
      );
      await api(`/orgs/${created!.id}/profile`, { method: "PATCH", body: { markets } });
      router.replace(`/onboarding?kind=agency&step=2&org=${encodeURIComponent(created!.slug)}`);
      router.refresh();
    } catch (error) {
      if (!(error instanceof AppError && error.expected)) reportError(error, { where: "onboarding.agency.create" });
      setFormError(userMessage(error));
      setPending(false);
    }
  }

  return (
    <SplitShell meta="Step 1 of 3" aside={<AgencyPreview name={name} />} footnote="You can rename the agency later. The URL can change once a year.">
      <form noValidate onSubmit={onSubmit} className="space-y-6">
        <Steps steps={STEPS} current={0} />
        <div>
          <h1 className="text-[34px] leading-[1.08] font-semibold tracking-[-0.03em]">Set up your agency</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">Your agency is where your team works. Each client keeps its own workspace; you connect to it.</p>
        </div>

        <div className="flex items-center gap-4">
          <BrandMark name={name || "A"} tone="ember" size="xl" />
          <div className="text-[13.5px]">
            <p className="font-medium">Agency logo</p>
            <p className="mt-0.5 text-muted-foreground">Your initial for now. Logo upload is coming soon.</p>
          </div>
        </div>

        {formError && <p role="alert" className="rounded-xl bg-destructive/[0.06] px-4 py-3 text-[14px] ring-1 ring-destructive/25 ring-inset">{formError}</p>}

        <FormField label="Agency name" htmlFor="name" error={show("name")}>
          <TextInput id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Harbor & Pine" autoComplete="organization" autoFocus invalid={Boolean(show("name"))} />
        </FormField>

        <FormField label="Workspace URL" htmlFor="slug" error={show("slug") ?? (slugState.status === "taken" ? slugState.reason : null)} hint={slugState.status === "error" ? slugState.reason : undefined}>
          <SlugInput
            id="slug"
            value={effectiveSlug}
            onChange={(v) => {
              setSlugEdited(true);
              setSlug(v);
            }}
            state={slugState}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Headquarters" htmlFor="hq">
            <SelectField id="hq" value={hq} onChange={setHq} options={COUNTRIES} placeholder="Choose a country" />
          </FormField>
          <FormField label="Team size" htmlFor="team">
            <SelectField id="team" value={teamSize} onChange={setTeamSize} options={TEAM_SIZES} placeholder="Choose a size" />
          </FormField>
        </div>

        <FormField label="Markets you work in" aside="Sets defaults; change per client" error={show("markets")}>
          <div className="flex flex-wrap gap-2">
            {MARKETS.map((m) => (
              <ChoiceChip
                key={m.value}
                selected={markets.includes(m.value)}
                onClick={() => setMarkets((cur) => (cur.includes(m.value) ? cur.filter((x) => x !== m.value) : [...cur, m.value]))}
              >
                {m.label}
              </ChoiceChip>
            ))}
            <ChoiceChip selected={false} disabled icon={<Clock3Icon className="size-3.5" strokeWidth={2} aria-hidden />}>
              More soon
            </ChoiceChip>
          </div>
        </FormField>

        <FormField label="Billing email" htmlFor="billing" error={show("billingEmail")} hint="Invoices for client workspaces you pay for go here.">
          <TextInput id="billing" type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} invalid={Boolean(show("billingEmail"))} />
        </FormField>

        <Button type="submit" size="cta" className="w-full" disabled={pending}>
          {pending && <Spinner className="size-4" />}
          Continue
          {!pending && <ArrowRightIcon data-icon="inline-end" />}
        </Button>
      </form>
    </SplitShell>
  );
}

/* ---------------------------------------------------------------- step 2 */

type InviteRow = { key: number; email: string; role: InvitableRole; status: "idle" | "sent" | "error"; error?: string };

function TeamStep({ org, user }: { org: OrgContext; user: { email: string } }) {
  const router = useRouter();
  const domain = user.email.split("@")[1]?.toLowerCase() ?? "";
  const canJoinByDomain = Boolean(domain) && !PUBLIC_EMAIL_DOMAINS.has(domain);
  const placeholderDomain = canJoinByDomain ? domain : "agency.com";

  const [rows, setRows] = useState<InviteRow[]>([
    { key: 1, email: "", role: "strategist", status: "idle" },
    { key: 2, email: "", role: "strategist", status: "idle" },
  ]);
  const [joinByDomain, setJoinByDomain] = useState(org.organization.joinDomain === domain);
  const [pending, setPending] = useState(false);
  const next = `/onboarding?kind=agency&step=3&org=${encodeURIComponent(org.organization.slug)}`;

  const filled = useMemo(() => rows.filter((r) => r.email.trim() && r.status !== "sent"), [rows]);
  const update = (key: number, patch: Partial<InviteRow>) => setRows((cur) => cur.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  async function toggleDomain(on: boolean) {
    setJoinByDomain(on);
    const result = await attempt(() => api(`/orgs/${org.organization.id}/profile`, { method: "PATCH", body: { joinDomain: on ? domain : null, joinRole: "viewer" } }), {
      where: "onboarding.agency.join-domain",
      success: on ? `Anyone at @${domain} can now join as Viewer` : "Joining by domain is off",
    });
    if (!result.ok) setJoinByDomain(!on);
  }

  async function sendInvites(e: React.FormEvent) {
    e.preventDefault();
    let invalid = false;
    for (const row of filled) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
        update(row.key, { status: "error", error: "Check this email address." }); // ui-ok: alert or field state, not a chip
        invalid = true;
      }
    }
    if (invalid || !filled.length) return;

    setPending(true);
    let sent = 0;
    for (const row of filled) {
      try {
        unwrap(await authClient.organization.inviteMember({ email: row.email.trim().toLowerCase(), role: row.role, organizationId: org.organization.id }));
        update(row.key, { status: "sent", error: undefined });
        sent++;
      } catch (error) {
        if (!(error instanceof AppError && error.expected)) reportError(error, { where: "onboarding.agency.invite" });
        update(row.key, { status: "error", error: userMessage(error) }); // ui-ok: alert or field state, not a chip
      }
    }
    setPending(false);
    if (sent) toast.success(sent === 1 ? "Invitation sent" : `${sent} invitations sent`);
    if (sent === filled.length) router.push(next);
  }

  return (
    <SplitShell meta="Step 2 of 3" aside={<RolesAside />}>
      <form noValidate onSubmit={sendInvites} className="space-y-6">
        <Steps steps={STEPS} current={1} />
        <div>
          <h1 className="text-[34px] leading-[1.08] font-semibold tracking-[-0.03em]">Bring in your team</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">Invite by email. Give each person a role; they&rsquo;ll see every client until you narrow it in Settings.</p>
        </div>

        <ul className="space-y-2.5">
          {rows.map((row, i) => (
            <li key={row.key} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <TextInput
                    aria-label={`Teammate ${i + 1} email`}
                    type="email"
                    value={row.email}
                    disabled={row.status === "sent"}
                    onChange={(e) => update(row.key, { email: e.target.value, status: "idle", error: undefined })}
                    placeholder={`name@${placeholderDomain}`}
                    invalid={row.status === "error"}
                    className="pr-24"
                  />
                  {row.status === "sent" && (
                    <span className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 text-[12.5px] font-medium text-ember-ink">
                      <CircleCheckIcon className="size-3.5" strokeWidth={2} aria-hidden />
                      Invited
                    </span>
                  )}
                </div>
                <SelectField
                  value={row.role}
                  onChange={(role) => update(row.key, { role })}
                  options={INVITABLE_ROLES.map((r) => ({ value: r, label: ROLE_COPY[r].label }))}
                  className="w-[132px]"
                  disabled={row.status === "sent"}
                />
                {rows.length > 1 && row.status !== "sent" && (
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove teammate ${i + 1}`} onClick={() => setRows((cur) => cur.filter((r) => r.key !== row.key))}>
                    <XIcon />
                  </Button>
                )}
              </div>
              {row.error && <p className="pl-1 text-[12.5px] text-destructive">{row.error}</p>}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setRows((cur) => [...cur, { key: Math.max(0, ...cur.map((r) => r.key)) + 1, email: "", role: "strategist", status: "idle" }])}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ember-ink hover:underline"
        >
          <PlusIcon className="size-4" strokeWidth={2} aria-hidden />
          Add another
        </button>

        {canJoinByDomain && (
          <label className="flex items-center gap-4 rounded-[14px] border bg-muted/60 px-4 py-3.5">
            <LinkIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium">Anyone at @{domain} can join as Viewer</span>
              <span className="block text-[12.5px] text-muted-foreground">Admins approve upgrades. Turn off for contractors.</span>
            </span>
            <Switch checked={joinByDomain} onCheckedChange={toggleDomain} />
          </label>
        )}

        <div className="space-y-3">
          <Button type="submit" size="cta" className="w-full" disabled={pending || !filled.length}>
            {pending && <Spinner className="size-4" />}
            {filled.length > 1 ? `Send ${filled.length} invites` : "Send invite"}
            {!pending && <ArrowRightIcon data-icon="inline-end" />}
          </Button>
          <button type="button" onClick={() => router.push(next)} className="block w-full text-center text-[14px] text-muted-foreground hover:text-foreground">
            {rows.some((r) => r.status === "sent") ? "Continue" : "Skip for now"}
          </button>
        </div>
      </form>
    </SplitShell>
  );
}
