"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";
import { signIn } from "@/lib/auth-client";
import { AuthDivider, AuthHeading, FormAlert, GoogleButton, PasswordField, SubmitButton, TextField } from "./auth-parts";
import { authMessage, fieldErrors, loginSchema, type FieldErrors } from "./schemas";

type Values = { email: string; password: string };

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

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
    const { error } = await signIn.email({ email: values.email, password: values.password });
    if (error) {
      setFormError(authMessage(error));
      setPending(null);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function onGoogle() {
    setPending("google");
    setFormError(null);
    const { error } = await signIn.social({ provider: "google", callbackURL: next, errorCallbackURL: "/login" });
    if (error) {
      setFormError(authMessage(error));
      setPending(null);
    }
  }

  return (
    <div className="space-y-8">
      <AuthHeading title="Log in to your account" subtitle="Pick up your culture maps and briefs where you left them." />

      <div className="space-y-6">
        <GoogleButton label="Log in with Google" pending={pending === "google"} onClick={onGoogle} />
        <AuthDivider>or use your email</AuthDivider>

        <form noValidate onSubmit={onSubmit} className="space-y-4">
          <FormAlert message={formError} />
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
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}
