"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { MailCheckIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { unwrap } from "@/lib/api";
import { userMessage } from "@/lib/errors";
import { reportError } from "@/lib/report";
import { AppError } from "@/lib/errors";
import { AuthHeading, FormAlert, PasswordField, SubmitButton, TextField } from "./auth-parts";
import { z } from "zod";

const emailSchema = z.email("Enter an email address like name@brand.com");

export function ForgotPasswordForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Enter your email");
    setPending(true);
    try {
      unwrap(await authClient.requestPasswordReset({ email: parsed.data.toLowerCase(), redirectTo: "/reset-password" }));
      setSentTo(parsed.data);
    } catch (err) {
      if (!(err instanceof AppError && err.expected)) reportError(err, { where: "auth.forgot" });
      setError(userMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-6 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-card">
          <MailCheckIcon className="size-6" strokeWidth={1.5} aria-hidden />
        </span>
        <AuthHeading
          title="Check your inbox"
          subtitle={`If there's an account for ${sentTo}, a link to choose a new password is on its way. It works for one hour.`}
        />
        <Link href="/login" className="inline-block text-[14px] font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AuthHeading title="Reset your password" subtitle="Enter your account's email and we'll send you a link to choose a new one." />
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <FormAlert message={error} />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@brand.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
        />
        <div className="pt-2">
          <SubmitButton pending={pending}>Send reset link</SubmitButton>
        </div>
      </form>
      <p className="text-center text-[14px] text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
          Log in
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!token || linkError) {
    return (
      <div className="space-y-6 text-center">
        <AuthHeading title="This link has expired" subtitle="Reset links work once, for one hour. Ask for a new one and use the latest email." />
        <Link href="/forgot-password" className="inline-block text-[14px] font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
          Send a new link
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setPending(true);
    try {
      unwrap(await authClient.resetPassword({ newPassword: password, token: token! }));
      router.replace("/login?reset=1");
    } catch (err) {
      if (!(err instanceof AppError && err.expected)) reportError(err, { where: "auth.reset" });
      setError(userMessage(err));
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <AuthHeading title="Choose a new password" subtitle="Use at least 8 characters. You'll be logged out everywhere else." />
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <FormAlert message={error} />
        <PasswordField label="New password" name="password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} />
        <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(null); }} />
        <div className="pt-2">
          <SubmitButton pending={pending}>Save new password</SubmitButton>
        </div>
      </form>
    </div>
  );
}
