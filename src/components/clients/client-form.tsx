"use client";

import { useState } from "react";
import { LayersIcon, LinkIcon, PlusIcon, SearchIcon, SendIcon, XIcon } from "lucide-react";
import { FormField, MARKETS, SelectField, TextInput } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { AppError, userMessage } from "@/lib/errors";
import { reportError } from "@/lib/report";
import { cn } from "@/lib/utils";

export type Access = "VIEW" | "EDIT" | "MANAGE";

export const ACCESS_COPY: Record<Access, { label: string; can: string }> = {
  VIEW: { label: "View", can: "Read maps and briefs." },
  EDIT: { label: "Edit", can: "Build maps, write briefs and run ad checks." },
  MANAGE: { label: "Manage", can: "Everything except billing, members and deleting." },
};

export type ClientFormResult =
  | { mode: "create"; workspace: { id: string; name: string; slug: string }; ownerEmail: string }
  | { mode: "connect"; workspaceName: string };

type Mode = "create" | "connect";

export function ClientForm({
  agency,
  onDone,
  onCancel,
  submitLabel,
}: {
  agency: { id: string; name: string };
  onDone: (result: ClientFormResult) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [mode, setMode] = useState<Mode>("create");
  const [brand, setBrand] = useState("");
  const [rivalDraft, setRivalDraft] = useState("");
  const [rivals, setRivals] = useState<string[]>([]);
  const [market, setMarket] = useState<"US" | "GB">("US");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [code, setCode] = useState("");
  const [access, setAccess] = useState<Access>("MANAGE");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const errors =
    mode === "create"
      ? {
          brand: brand.trim().length < 2 ? "Enter the brand's name." : null,
          ownerEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim()) ? null : "Enter the owner's email, like name@brand.com.",
          code: null,
        }
      : { brand: null, ownerEmail: null, code: code.trim().length < 4 ? "Enter the code your client shared, like NORTHLINE-7KQ2." : null };
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  function addRival(value = rivalDraft) {
    const name = value.trim().replace(/,$/, "");
    if (name && !rivals.includes(name) && rivals.length < 5) setRivals((cur) => [...cur, name]);
    setRivalDraft("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);
    if (Object.values(errors).some(Boolean)) return;
    setPending(true);
    try {
      if (mode === "create") {
        const allRivals = rivalDraft.trim() ? [...rivals, rivalDraft.trim()] : rivals;
        const result = await api<{ workspace: { id: string; name: string; slug: string } }>(`/orgs/${agency.id}/clients`, {
          body: { brandName: brand.trim(), rivals: allRivals, market, ownerEmail: ownerEmail.trim().toLowerCase(), access },
        });
        onDone({ mode: "create", workspace: result.workspace, ownerEmail: ownerEmail.trim().toLowerCase() });
      } else {
        const result = await api<{ workspace: { name: string } }>(`/orgs/${agency.id}/connections`, { body: { code: code.trim().toUpperCase(), access } });
        onDone({ mode: "connect", workspaceName: result.workspace.name });
      }
    } catch (error) {
      if (!(error instanceof AppError && error.expected)) reportError(error, { where: `clients.${mode}` });
      setFormError(userMessage(error));
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      <div role="radiogroup" aria-label="How to add this client" className="grid gap-3 sm:grid-cols-2">
        <ModeCard
          selected={mode === "connect"}
          onSelect={() => setMode("connect")}
          icon={<LinkIcon className="size-[18px]" strokeWidth={1.75} />}
          title="Connect an existing workspace"
          body="They already use Cultural X-Ray. Enter their code; they choose your access."
        />
        <ModeCard
          selected={mode === "create"}
          onSelect={() => setMode("create")}
          icon={<PlusIcon className="size-[18px]" strokeWidth={1.75} />}
          title="Create a workspace for them"
          body="You set it up now. They claim ownership with one email, whenever they're ready."
        />
      </div>

      <div className="h-px bg-border" />

      {formError && <p role="alert" className="rounded-xl bg-destructive/[0.06] px-4 py-3 text-[14px] ring-1 ring-destructive/25 ring-inset">{formError}</p>}

      {mode === "create" ? (
        <>
          <FormField label="Brand" htmlFor="brand" error={show("brand")}>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} aria-hidden />
              <TextInput id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Starbucks" className="pl-10" invalid={Boolean(show("brand"))} autoComplete="off" />
            </div>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-[1fr_190px]">
            <FormField label="Rivals" htmlFor="rivals" hint="Up to five. Press Enter after each.">
              <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[10px] border bg-card px-2 py-1.5 focus-within:border-ember/70 focus-within:ring-3 focus-within:ring-ember/15 dark:bg-input/20">
                {rivals.map((r) => (
                  <span key={r} className="inline-flex h-6 items-center gap-1 rounded-full border bg-muted pr-1 pl-2.5 text-[12.5px] font-medium">
                    {r}
                    <button type="button" aria-label={`Remove ${r}`} onClick={() => setRivals((cur) => cur.filter((x) => x !== r))} className="rounded-full p-0.5 text-muted-foreground hover:bg-soft hover:text-foreground">
                      <XIcon className="size-3" strokeWidth={2} />
                    </button>
                  </span>
                ))}
                <input
                  id="rivals"
                  value={rivalDraft}
                  onChange={(e) => (e.target.value.endsWith(",") ? addRival(e.target.value) : setRivalDraft(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRival();
                    }
                    if (e.key === "Backspace" && !rivalDraft && rivals.length) setRivals((cur) => cur.slice(0, -1));
                  }}
                  onBlur={() => addRival()}
                  placeholder={rivals.length ? "" : "Dunkin', Tim Hortons"}
                  className="h-6 min-w-24 flex-1 bg-transparent px-1.5 text-[14.5px] outline-none placeholder:text-faint"
                />
              </div>
            </FormField>
            <FormField label="Market" htmlFor="market">
              <SelectField id="market" value={market} onChange={setMarket} options={MARKETS} />
            </FormField>
          </div>

          <FormField
            label="Client owner's email"
            htmlFor="owner"
            error={show("ownerEmail")}
            hint="They become the owner when they claim it. Until then, your agency holds it in trust and can't delete their data once claimed."
          >
            <TextInput id="owner" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="name@brand.com" invalid={Boolean(show("ownerEmail"))} />
          </FormField>
        </>
      ) : (
        <FormField label="Workspace code" htmlFor="code" error={show("code")} hint="Your client finds it in Settings → Agencies.">
          <TextInput
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="NORTHLINE-7KQ2"
            className="font-mono tracking-wide uppercase"
            autoComplete="off"
            spellCheck={false}
            invalid={Boolean(show("code"))}
          />
        </FormField>
      )}

      <FormField label="Access you're asking for" hint={mode === "create" ? "They can lower it when they claim, or change it any time after." : "Nothing changes until they approve. They can lower it first."}>
        <div role="radiogroup" aria-label="Access" className="flex flex-wrap gap-2">
          {(Object.keys(ACCESS_COPY) as Access[]).map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={access === level}
              onClick={() => setAccess(level)}
              title={ACCESS_COPY[level].can}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border bg-card pr-4 pl-3 text-[13.5px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                access === level ? "border-ember bg-ember-soft" : "hover:border-foreground/25",
              )}
            >
              <span aria-hidden className={cn("flex size-4 items-center justify-center rounded-full border-[1.5px]", access === level ? "border-ember" : "border-faint")}>
                {access === level && <span className="size-2 rounded-full bg-ember" />}
              </span>
              {ACCESS_COPY[level].label}
            </button>
          ))}
        </div>
      </FormField>

      {mode === "create" && (
        <p className="flex items-center gap-3 rounded-[12px] bg-muted px-4 py-3 text-[13.5px] text-foreground/85">
          <LayersIcon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
          Billed to {agency.name} while you hold it. Billing can move to them later.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" size="pill" className="h-10 px-4" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="pill" className="h-10 px-4" disabled={pending}>
          {pending ? <Spinner className="size-3.5" /> : <SendIcon data-icon="inline-start" />}
          {submitLabel ?? (mode === "create" ? "Create and send claim link" : "Send request")}
        </Button>
      </div>
    </form>
  );
}

function ModeCard({ selected, onSelect, icon, title, body }: { selected: boolean; onSelect: () => void; icon: React.ReactNode; title: string; body: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-2 rounded-[14px] border bg-card p-4 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        selected ? "border-ember bg-ember-soft/70" : "hover:border-foreground/25",
      )}
    >
      <span className="flex items-center justify-between">
        <span className={selected ? "text-ember-ink" : "text-muted-foreground"}>{icon}</span>
        <span aria-hidden className={cn("flex size-[18px] items-center justify-center rounded-full border-[1.5px]", selected ? "border-ember" : "border-faint")}>
          {selected && <span className="size-2.5 rounded-full bg-ember" />}
        </span>
      </span>
      <span className="text-[14.5px] font-semibold">{title}</span>
      <span className="text-[13px] leading-relaxed text-muted-foreground">{body}</span>
    </button>
  );
}
