"use client";

import { useState } from "react";
import { CircleAlertIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h1 className="font-heading font-semibold text-[2.4rem] leading-[1.05] tracking-[-0.03em] text-balance sm:text-[2.75rem]">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-88 text-[15px] leading-relaxed text-pretty text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

const pill = "h-12 w-full rounded-full text-[15px] active:scale-[0.985] active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150";

export function GoogleButton({ label, pending, onClick }: { label: string; pending: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" onClick={onClick} disabled={pending} className={cn(pill, "gap-3 bg-card shadow-none")}>
      {pending ? <Spinner className="size-4" /> : <GoogleGlyph />}
      {label}
    </Button>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" disabled={pending} className={cn(pill, "hover:bg-primary/90 disabled:opacity-70")}>
      {pending && <Spinner className="size-4" />}
      {children}
    </Button>
  );
}

export function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

const inputClass =
  "h-12 rounded-xl bg-card px-4 text-[15px] shadow-none placeholder:text-muted-foreground/80 hover:border-foreground/25 focus-visible:border-foreground/60 focus-visible:ring-foreground/10 md:text-[15px] dark:bg-input/20";

type FieldProps = React.ComponentProps<"input"> & { label: string; error?: string; hint?: string };

export function TextField({ label, error, hint, className, ...props }: FieldProps) {
  const id = props.id ?? props.name;
  return (
    <Field data-invalid={!!error || undefined} className={cn("gap-1.5", className)}>
      <FieldLabel htmlFor={id} className="text-[13px]">
        {label}
      </FieldLabel>
      <Input id={id} aria-invalid={!!error || undefined} aria-describedby={error || hint ? `${id}-note` : undefined} className={inputClass} {...props} />
      <FieldNote id={`${id}-note`} error={error} hint={hint} />
    </Field>
  );
}

export function PasswordField({ label, error, hint, ...props }: FieldProps) {
  const [visible, setVisible] = useState(false);
  const id = props.id ?? props.name;
  return (
    <Field data-invalid={!!error || undefined} className="gap-1.5">
      <FieldLabel htmlFor={id} className="text-[13px]">
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${id}-note` : undefined}
          className={cn(inputClass, "pr-12")}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full text-muted-foreground active:-translate-y-1/2"
        >
          {visible ? <EyeOffIcon strokeWidth={1.75} /> : <EyeIcon strokeWidth={1.75} />}
        </Button>
      </div>
      <FieldNote id={`${id}-note`} error={error} hint={hint} />
    </Field>
  );
}

function FieldNote({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <FieldError id={id} className="flex items-center gap-1.5 text-[13px]">
        <CircleAlertIcon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {error}
      </FieldError>
    );
  }
  if (hint) {
    return (
      <FieldDescription id={id} className="text-[13px]">
        {hint}
      </FieldDescription>
    );
  }
  return null;
}

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-destructive/[0.06] px-4 py-3 text-[14px] ring-1 ring-destructive/25 ring-inset">
      <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" strokeWidth={1.75} aria-hidden />
      <span>{message}</span>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.02c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.27a12 12 0 0 0 0 10.78l4.01-3.11Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.27 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  );
}
