"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";
import { signIn, signUp } from "@/lib/auth-client";
import { AuthDivider, AuthHeading, FormAlert, GoogleButton, PasswordField, SubmitButton, TextField } from "./auth-parts";
import { authMessage } from "@/lib/errors";
import { fieldErrors, signupSchema, type FieldErrors } from "./schemas";

type Values = { name: string; email: string; password: string };

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();

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
    const { error } = await signUp.email({
      name: values.name.trim(),
      email: values.email,
      password: values.password,
    });
    if (error) {
      setFormError(authMessage(error));
      setPending(null);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  async function onGoogle() {
    setPending("google");
    setFormError(null);
    const { error } = await signIn.social({ provider: "google", callbackURL: "/dashboard", errorCallbackURL: "/signup" });
    if (error) {
      setFormError(authMessage(error));
      setPending(null);
    }
  }

  return (
    <div className="space-y-8">
      <AuthHeading
        title="Create your account"
        subtitle="Type a brand and its rivals. See the culture each one owns."
      />

      <div className="space-y-6">
        <GoogleButton label="Sign up with Google" pending={pending === "google"} onClick={onGoogle} />
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
            placeholder="name@brand.com"
            value={values.email}
            onChange={update("email")}
            onBlur={blur("email")}
            error={show("email")}
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
        </form>
      </div>

      <p className="text-center text-[14px] text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground">
          Log in
        </Link>
      </p>
    </div>
  );
}
