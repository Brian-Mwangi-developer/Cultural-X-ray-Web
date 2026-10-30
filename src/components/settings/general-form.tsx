"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BrandMark } from "@/components/app/parts";
import { ChoiceChip, COUNTRIES, FormField, MARKETS, SelectField, SlugInput, TEAM_SIZES, TextInput, useSlugCheck } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api, unwrap } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { AppError, userMessage } from "@/lib/errors";
import { readIntent } from "@/lib/intent";
import { reportError } from "@/lib/report";
import type { OrgContext } from "@/lib/session";
import { ImageField } from "@/components/settings/image-field";
import { media } from "@/lib/media";
import { ReadOnlyNote } from "./parts";

type TeamSize = "1-10" | "11-50" | "51-200" | "201+";

export function GeneralForm({ org, canEdit }: { org: OrgContext; canEdit: boolean }) {
  const router = useRouter();
  const o = org.organization;
  const agency = o.kind === "AGENCY";
  const intent = readIntent(o.metadata);
  const initial = {
    name: o.name,
    slug: o.slug,
    hq: o.hqCountry,
    teamSize: (o.teamSize as TeamSize | null) ?? null,
    billingEmail: o.billingEmail ?? "",
    markets: o.markets.length ? o.markets : (["US"] as ("US" | "GB")[]),
    city: intent.city ?? "",
  };
  const [v, setV] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slugState = useSlugCheck(v.slug, { skip: v.slug === o.slug });
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);
  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => setV((cur) => ({ ...cur, [key]: value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (v.name.trim().length < 2) return setError("Use a name of at least 2 characters.");
    if (slugState.status === "taken") return setError(slugState.reason ?? "That URL is taken.");
    if (!v.markets.length) return setError("Choose at least one market.");
    if (agency && v.billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.billingEmail)) return setError("Enter a billing email like finance@agency.com.");
    setPending(true);
    setError(null);
    try {
      const data: Record<string, unknown> = {};
      if (v.name.trim() !== o.name) data.name = v.name.trim();
      if (v.slug !== o.slug) data.slug = v.slug;
      if (agency) {
        if (v.hq !== o.hqCountry && v.hq) data.hqCountry = v.hq;
        if (v.teamSize !== o.teamSize && v.teamSize) data.teamSize = v.teamSize;
        if (v.billingEmail !== (o.billingEmail ?? "")) data.billingEmail = v.billingEmail.trim().toLowerCase();
      } else if (v.city !== (intent.city ?? "")) {
        data.metadata = { ...intent, city: v.city.trim() || undefined };
      }
      if (Object.keys(data).length) unwrap(await authClient.organization.update({ organizationId: o.id, data }));
      if (JSON.stringify(v.markets) !== JSON.stringify(initial.markets)) {
        await api(`/orgs/${o.id}/profile`, { method: "PATCH", body: { markets: v.markets } });
      }
      toast.success("Saved");
      if (data.slug) router.replace(`/${v.slug}/settings/general`);
      router.refresh();
    } catch (err) {
      if (!(err instanceof AppError && err.expected)) reportError(err, { where: "settings.general" });
      setError(userMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {!canEdit && <ReadOnlyNote>Only owners and admins can change these settings.</ReadOnlyNote>}
      <fieldset disabled={!canEdit || pending} className="space-y-6">
        <ImageField
          label={agency ? "Agency logo" : "Brand logo"}
          help={o.logo ? "Shown in the sidebar, on briefs, share links and PDFs." : "A square PNG, JPEG or WebP, up to 2 MB. Until then, your initial."}
          preview={<BrandMark name={v.name || "A"} logo={o.logo} tone={agency ? "ember" : "neutral"} size="xl" />}
          has={Boolean(o.logo)}
          disabled={!canEdit}
          onSave={(file) => media.setLogo(o.id, file)}
        />

        {error && <p role="alert" className="rounded-xl bg-destructive/[0.06] px-4 py-3 text-[14px] ring-1 ring-destructive/25 ring-inset">{error}</p>}

        <div className="grid gap-5 md:grid-cols-2">
          <FormField label={agency ? "Agency name" : "Brand name"} htmlFor="name">
            <TextInput id="name" value={v.name} onChange={(e) => set("name", e.target.value)} />
          </FormField>
          <FormField label="Workspace URL" htmlFor="slug" hint="Old links stop working when you change it." error={slugState.status === "taken" ? slugState.reason : null}>
            <SlugInput id="slug" value={v.slug} onChange={(s) => set("slug", s)} state={slugState} />
          </FormField>
        </div>

        {agency ? (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Headquarters" htmlFor="hq">
                <SelectField id="hq" value={v.hq} onChange={(x) => set("hq", x)} options={COUNTRIES} placeholder="Choose a country" disabled={!canEdit} />
              </FormField>
              <FormField label="Team size" htmlFor="size">
                <SelectField id="size" value={v.teamSize} onChange={(x) => set("teamSize", x)} options={TEAM_SIZES} placeholder="Choose a size" disabled={!canEdit} />
              </FormField>
            </div>
            <FormField label="Billing email" htmlFor="billing" hint="Invoices for client workspaces you pay for go here.">
              <TextInput id="billing" type="email" value={v.billingEmail} onChange={(e) => set("billingEmail", e.target.value)} />
            </FormField>
          </>
        ) : (
          <FormField label="Home city" htmlFor="city" hint="Optional. Used to read local culture first.">
            <TextInput id="city" value={v.city} onChange={(e) => set("city", e.target.value)} placeholder="London" />
          </FormField>
        )}

        <FormField label={agency ? "Markets you work in" : "Markets"} aside={agency ? "Defaults for new clients" : undefined}>
          <div className="flex flex-wrap gap-2">
            {MARKETS.map((m) => (
              <ChoiceChip
                key={m.value}
                selected={v.markets.includes(m.value)}
                disabled={!canEdit}
                onClick={() => set("markets", v.markets.includes(m.value) ? v.markets.filter((x) => x !== m.value) : [...v.markets, m.value])}
              >
                {m.label}
              </ChoiceChip>
            ))}
          </div>
        </FormField>
      </fieldset>

      {canEdit && (
        <div className="flex items-center gap-3 border-t pt-5">
          <Button type="submit" size="pill" className="h-10 px-5" disabled={!dirty || pending}>
            {pending && <Spinner className="size-3.5" />}
            Save changes
          </Button>
          {dirty && !pending && (
            <button type="button" onClick={() => setV(initial)} className="text-[14px] text-muted-foreground hover:text-foreground">
              Discard
            </button>
          )}
        </div>
      )}
    </form>
  );
}
