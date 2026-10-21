"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";
import { signIn } from "@/lib/auth-client";
import { authMessage } from "@/lib/errors";
import { reportError } from "@/lib/report";
import { AuthDivider, AuthHeading, FormAlert, GoogleButton, PasswordField, SubmitButton, TextField, TextLinkButton } from "./auth-parts";
import { fieldErrors, loginSchema, type FieldErrors } from "./schemas";

type Values = { email: string; password: string };

/** Messages for the reasons someone can land on /login. */
function arrivalNotice(params: URLSearchParams): { message: string; tone: "error" | "info" } | null { // ui-ok: alert or field state, not a chip
  const error = params.get("error")?.toUpperCase();
  if (error === "INVALID_TOKEN" || error === "TOKEN_EXPIRED") {
    return { message: "That link has expired or was already used. Log in, and we'll send a fresh one if you still need it.", tone: "error" }; // ui-ok: alert or field state, not a chip
  }
  if (error) return { message: authMessage({ code: error }), tone: "error" }; // ui-ok: alert or field state, not a chip
  if (params.has("reset")) return { message: "Password changed. Log in with your new password.", tone: "info" }; // ui-ok: alert or field state, not a chip
  if (params.has("expired")) return { message: "Your session ended. Log in again to pick up where you left off.", tone: "info" }; // ui-ok: alert or field state, not a chip
  return null;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const notice = arrivalNotice(params);
  // Coming from an invitation or claim, the address is the one it was sent to: don't let it drift.
  const lockedEmail = /^\/(invite|claim)\//.test(next) ? params.get("email") : null;

  const [values, setValues] = useState<Values>({ email: params.get("email") ?? "", password: "" });
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

  const errors: FieldErrors<Values> = fieldErrors(loginSchema, values);
  const show = (k: keyof Values) => ((submitted || touched[k]) ? errors[k] : undefined);

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
      const { error } = await signIn.email({ email, password: values.password, callbackURL: next });
      if (error) {
        // Unconfirmed accounts get a fresh link from the server; send them to check their inbox.
        if (error.code === "EMAIL_NOT_VERIFIED") {
          router.push(`/verify-email?${new URLSearchParams({ email, next, resent: "1" })}`);
          return;
        }
        setFormError(authMessage(error));
        setPending(null);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch (error) {
      reportError(error, { where: "auth.login.email" });
      setFormError(authMessage({}));
      setPending(null);
    }
  }

  async function onGoogle() {
    setPending("google");
    setFormError(null);
    try {
      const { error } = await signIn.social({ provider: "google", callbackURL: next, newUserCallbackURL: "/onboarding", errorCallbackURL: "/login" });
      if (error) {
        setFormError(authMessage(error));
        setPending(null);
      }
    } catch (error) {
      reportError(error, { where: "auth.login.google" });
      setFormError(authMessage({}));
      setPending(null);
    }
  }

  return (
    <div className="space-y-8">
      <AuthHeading title="Welcome back" subtitle="Pick up your culture maps and briefs where you left them." />

      <div className="space-y-6">
        <GoogleButton label="Continue with Google" pending={pending === "google"} onClick={onGoogle} />
        <AuthDivider>or use your email</AuthDivider>

        <form noValidate onSubmit={onSubmit} className="space-y-4">
          <FormAlert message={formError ?? notice?.message ?? null} tone={formError ? "error" : (notice?.tone ?? "error")} />
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@brand.com"
            value={values.email}
            onChange={update("email")}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={show("email")}
            readOnly={Boolean(lockedEmail)}
          />
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={values.password}
            onChange={update("password")}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={show("password")}
            labelAction={<TextLinkButton href={`/forgot-password${values.email ? `?email=${encodeURIComponent(values.email)}` : ""}`}>Forgot password?</TextLinkButton>}
          />
          <div className="pt-2">
            <SubmitButton pending={pending === "email"}>Log in</SubmitButton>
          </div>
        </form>
      </div>

      <p className="text-center text-[14px] text-muted-foreground">
        New to Cultural X-Ray?{" "}
        <Link href="/signup" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground">
          Create an account
        </Link>
      </p>
    </div>
  );
}

/** Only follow same-site paths after login. */
export function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/dashboard";
}
