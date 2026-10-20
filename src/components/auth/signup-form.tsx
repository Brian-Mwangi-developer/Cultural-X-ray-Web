"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Building2Icon, StoreIcon } from "lucide-react";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";
import { signIn, signUp } from "@/lib/auth-client";
import { authMessage } from "@/lib/errors";
import { reportError } from "@/lib/report";
import { cn } from "@/lib/utils";
import { AuthDivider, AuthHeading, FormAlert, GoogleButton, PasswordField, SubmitButton, TextField } from "./auth-parts";
import { fieldErrors, signupSchema, type FieldErrors } from "./schemas";

type Values = { name: string; email: string; password: string };
export type AccountKind = "brand" | "agency";

const KINDS: { value: AccountKind; title: string; body: string; icon: typeof StoreIcon }[] = [
  { value: "brand", title: "My brand", body: "Map one brand's culture and check its ads.", icon: StoreIcon },
  { value: "agency", title: "An agency", body: "A team working across several clients.", icon: Building2Icon },
];

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const invite = params.get("invite");
  const claim = params.get("claim");
  const lockedEmail = invite || claim ? params.get("email") : null;

  const [kind, setKind] = useState<AccountKind>(params.get("kind") === "agency" ? "agency" : "brand");
  const [values, setValues] = useState<Values>({ name: "", email: params.get("email") ?? "", password: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useResetOnHide(() => {
    setValues((v) => ({ ...v, password: "" }));
    setTouched({});
    setSubmitted(false);
    setPending(null);
    setFormError(null);
  });

  // Where the confirmation link (or Google) lands them afterwards.
  const callbackURL = invite ? `/invite/${encodeURIComponent(invite)}` : claim ? `/claim/${encodeURIComponent(claim)}` : `/onboarding?kind=${kind}`;

  const errors: FieldErrors<Values> = fieldErrors(signupSchema, values);
  const show = (k: keyof Values) => ((submitted || touched[k]) ? errors[k] : undefined);
  const blur = (k: keyof Values) => () => setTouched((t) => ({ ...t, [k]: true }));

  const update = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setFormError(null);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    setPending("email");
    try {
      const email = values.email.trim().toLowerCase();
      const { error } = await signUp.email({ name: values.name.trim(), email, password: values.password, callbackURL });
      if (error) {
        setFormError(authMessage(error));
        setPending(null);
        return;
      }
      const next = new URLSearchParams({ email, next: callbackURL });
      router.push(`/verify-email?${next}`);
    } catch (error) {
      reportError(error, { where: "auth.signup.email" });
      setFormError(authMessage({}));
      setPending(null);
    }
  }

  async function onGoogle() {
    setPending("google");
    setFormError(null);
    try {
      const { error } = await signIn.social({ provider: "google", callbackURL, newUserCallbackURL: callbackURL, errorCallbackURL: "/signup" });
      if (error) {
        setFormError(authMessage(error));
        setPending(null);
      }
    } catch (error) {
      reportError(error, { where: "auth.signup.google" });
      setFormError(authMessage({}));
      setPending(null);
    }
  }

  const joining = Boolean(invite || claim);
  const loginQuery = new URLSearchParams({ ...(values.email && { email: values.email }), ...(joining && { next: callbackURL }) }).toString();
  const loginHref = loginQuery ? `/login?${loginQuery}` : "/login";

  return (
    <div className="space-y-8">
      <AuthHeading
        title={joining ? "Create your account" : "Start with Cultural X-Ray"}
        subtitle={
          joining
            ? "Use the address the invitation went to. You'll land back on it once you confirm your email."
            : "Type a brand and its rivals. See the culture each one owns."
        }
      />

      {!joining && (
        <fieldset className="space-y-2.5">
          <legend className="mb-2.5 text-[13px] font-medium">What are you setting up?</legend>
          <div className="grid grid-cols-2 gap-2.5">
            {KINDS.map((k) => (
              <label
                key={k.value}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-2 rounded-xl border bg-card p-3.5 transition-colors hover:border-foreground/25 has-focus-visible:ring-3 has-focus-visible:ring-ring/40",
                  kind === k.value && "border-ember bg-ember-soft/60 hover:border-ember",
                )}
              >
                <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
                <span className="flex items-center justify-between">
                  <k.icon className={cn("size-[18px]", kind === k.value ? "text-ember-ink" : "text-muted-foreground")} strokeWidth={1.75} aria-hidden />
                  <span
                    aria-hidden
                    className={cn("flex size-4 items-center justify-center rounded-full border", kind === k.value ? "border-ember" : "border-input")}
                  >
                    {kind === k.value && <span className="size-2 rounded-full bg-ember" />}
                  </span>
                </span>
                <span className="text-[14px] font-semibold">{k.title}</span>
                <span className="text-[12.5px] leading-snug text-muted-foreground">{k.body}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="space-y-6">
        <GoogleButton label="Continue with Google" pending={pending === "google"} onClick={onGoogle} />
        <AuthDivider>or use your email</AuthDivider>

        <form noValidate onSubmit={onSubmit} className="space-y-4">
          <FormAlert message={formError} />
          <TextField
            label="Full name"
            name="name"
            autoComplete="name"
            placeholder="Ada Okafor"
            value={values.name}
            onChange={update("name")}
            onBlur={blur("name")}
            error={show("name")}
          />
          <TextField
            label="Work email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={kind === "agency" ? "name@agency.com" : "name@brand.com"}
            value={values.email}
            onChange={update("email")}
            onBlur={blur("email")}
            error={show("email")}
            readOnly={Boolean(lockedEmail)}
            hint={lockedEmail ? "The invitation only works for this address." : undefined}
          />
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={values.password}
            onChange={update("password")}
            onBlur={blur("password")}
            error={show("password")}
          />
          <div className="pt-2">
            <SubmitButton pending={pending === "email"}>Create account</SubmitButton>
          </div>
          <p className="text-center text-[12.5px] leading-relaxed text-muted-foreground">
            We&rsquo;ll email you a link to confirm it&rsquo;s you before anything is created.
          </p>
        </form>
      </div>

      <p className="text-center text-[14px] text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
