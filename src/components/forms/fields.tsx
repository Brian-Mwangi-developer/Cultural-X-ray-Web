"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckIcon, CircleAlertIcon, CircleCheckIcon, PlusIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------- field */

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  aside,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string | null;
  /** Right side of the label row, e.g. "Sets defaults; change per client". */
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const noteId = htmlFor ? `${htmlFor}-note` : undefined;
  return (
    <div className={cn("space-y-2", className)} data-invalid={error ? true : undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13.5px] font-medium">
          {label}
        </label>
        {aside && <span className="text-[12.5px] text-muted-foreground">{aside}</span>}
      </div>
      {children}
      {error ? (
        <p id={noteId} role="alert" className="flex items-center gap-1.5 text-[13px] text-destructive">
          <CircleAlertIcon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={noteId} className="text-[12.5px] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "h-10 rounded-[10px] bg-card px-3.5 text-[14.5px] shadow-none placeholder:text-faint hover:border-foreground/20 focus-visible:border-ember/70 focus-visible:ring-ember/15 md:text-[14.5px] dark:bg-input/20";

export function TextInput({ className, invalid, ...props }: React.ComponentProps<"input"> & { invalid?: boolean }) {
  return <Input aria-invalid={invalid || undefined} className={cn(inputClass, className)} {...props} />;
}

/* ------------------------------------------------------------------ select */

export type Option<T extends string> = { value: T; label: string; disabled?: boolean };

export function SelectField<T extends string>({
  id,
  value,
  onChange,
  options,
  placeholder = "Choose",
  className,
  size = "default",
  disabled,
}: {
  id?: string;
  value: T | null;
  onChange: (value: T) => void;
  options: Option<T>[];
  placeholder?: string;
  className?: string;
  size?: "default" | "sm";
  disabled?: boolean;
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => v !== null && onChange(v as T)} disabled={disabled}>
      <SelectTrigger
        id={id}
        className={cn(
          "w-full bg-card shadow-none hover:border-foreground/20 dark:bg-input/20",
          size === "default" ? "h-10! rounded-[10px] px-3.5 text-[14.5px]" : "h-8! rounded-lg px-2.5 text-[13px]",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ------------------------------------------------------------------- chips */

/** Selectable pill: ember outline with a check when on, a plus when off. */
export function ChoiceChip({
  selected,
  onClick,
  disabled,
  children,
  note,
  icon,
}: {
  selected: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  note?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13.5px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        selected ? "border-ember bg-ember-soft text-foreground" : "bg-card hover:border-foreground/25",
        disabled && "cursor-not-allowed text-muted-foreground opacity-70 hover:border-border",
      )}
    >
      {icon ?? (selected ? <CheckIcon className="size-3.5 text-ember-ink" strokeWidth={2.5} aria-hidden /> : <PlusIcon className="size-3.5 text-muted-foreground" strokeWidth={2} aria-hidden />)}
      {children}
      {note && <span className="text-[12px] font-normal text-muted-foreground">{note}</span>}
    </button>
  );
}

/** Two or three mutually exclusive options in a pill track, like the design's UK / US. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-full border bg-muted p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 rounded-full px-4 text-[13.5px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50",
            value === o.value ? "bg-card text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------- slug */

export type SlugState = { status: "idle" | "checking" | "available" | "taken" | "error"; reason?: string | null };

/** "Harbor & Pine" → "harborandpine", the way the design shows workspace URLs. */
export function suggestSlug(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40);
}

/** Debounced availability check against the backend. "Checking" is derived, so the effect only ever reports results. */
export function useSlugCheck(slug: string, { skip = false } = {}): SlugState {
  const [result, setResult] = useState<{ slug: string } & SlugState>({ slug: "", status: "idle" });
  const short = slug.length < 3;

  useEffect(() => {
    if (skip || short) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const answer = await api<{ available: boolean; reason: string | null }>(`/slugs/${encodeURIComponent(slug)}`, { signal: controller.signal });
        setResult({ slug, status: answer.available ? "available" : "taken", reason: answer.reason });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResult({ slug, status: "error", reason: "We couldn't check this address. You can still continue." }); // ui-ok: alert or field state, not a chip
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [slug, skip, short]);

  if (skip) return { status: "idle" };
  if (short) return { status: "idle", reason: slug ? "Use at least 3 characters." : null };
  if (result.slug !== slug) return { status: "checking" };
  return { status: result.status, reason: result.reason };
}

const subscribeNever = () => () => {};

export function SlugInput({ id, value, onChange, state }: { id: string; value: string; onChange: (value: string) => void; state: SlugState }) {
  const host = useSyncExternalStore(subscribeNever, () => window.location.host, () => "cultural-xray.app");
  return (
    <div
      className={cn(
        "flex h-10 items-center rounded-[10px] border bg-card pr-3 transition-colors focus-within:border-ember/70 focus-within:ring-3 focus-within:ring-ember/15 hover:border-foreground/20 dark:bg-input/20",
        state.status === "taken" && "border-destructive/60",
      )}
    >
      <span className="pl-3.5 text-[14.5px] text-faint select-none">{host}/</span>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={state.status === "taken" || undefined}
        aria-describedby={`${id}-status`}
        className="h-full min-w-0 flex-1 bg-transparent pl-0.5 text-[14.5px] outline-none"
      />
      <span id={`${id}-status`} aria-live="polite" className="flex shrink-0 items-center gap-1 text-[12.5px]">
        {state.status === "checking" && <Spinner className="size-3.5 text-muted-foreground" />}
        {state.status === "available" && (
          <span className="flex items-center gap-1 font-medium text-ember-ink">
            <CircleCheckIcon className="size-3.5" strokeWidth={2} aria-hidden />
            Available
          </span>
        )}
        {state.status === "taken" && (
          <span className="flex items-center gap-1 text-destructive">
            <CircleAlertIcon className="size-3.5" strokeWidth={2} aria-hidden />
            Taken
          </span>
        )}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------- lists */

export const COUNTRIES: Option<string>[] = [
  "United States", "United Kingdom", "Canada", "Ireland", "Germany", "France", "Netherlands", "Spain", "Italy", "Sweden",
  "Australia", "New Zealand", "Kenya", "Nigeria", "South Africa", "Ghana", "United Arab Emirates", "India", "Singapore", "Japan", "Brazil", "Mexico", "Other",
].map((c) => ({ value: c, label: c }));

export const TEAM_SIZES: Option<"1-10" | "11-50" | "51-200" | "201+">[] = [
  { value: "1-10", label: "1–10" },
  { value: "11-50", label: "11–50" },
  { value: "51-200", label: "51–200" },
  { value: "201+", label: "201+" },
];

export const MARKETS: Option<"US" | "GB">[] = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
];

export const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "yahoo.com", "ymail.com",
  "icloud.com", "me.com", "mac.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "gmx.net", "mail.com",
  "zoho.com", "yandex.com", "hey.com", "fastmail.com",
]);
