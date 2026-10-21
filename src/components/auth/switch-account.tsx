"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon, ShieldAlertIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { reportError } from "@/lib/report";
import { cn } from "@/lib/utils";

/**
 * Shown when a confirmation link for one address is opened while another account is signed in.
 * Nothing switches until the person chooses: continuing signs the current account out first,
 * then opens the link, which confirms the address and signs that account in.
 */
export function SwitchAccount({ to, resume, current }: { to: string; resume: string | null; current: string | null }) {
  const [pending, setPending] = useState(false);

  // Already signed out (or already the right account): just finish the confirmation.
  if (resume && (!current || current.toLowerCase() === to)) {
    return (
      <Shell title={`Confirm ${to}`} body="Continue to confirm the address and sign in.">
        <a href={resume} className={cn(buttonVariants({ size: "cta" }), "w-full")}>
          Continue
          <ArrowRightIcon data-icon="inline-end" />
        </a>
      </Shell>
    );
  }

  if (!resume || !to) {
    return (
      <Shell title="This link isn't valid" body="Open the latest confirmation email and use its button, or log in.">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "cta" }), "w-full")}>
          Go to Cultural X-Ray
        </Link>
      </Shell>
    );
  }

  async function continueAs() {
    setPending(true);
    try {
      await authClient.signOut();
    } catch (error) {
      reportError(error, { where: "switch-account.sign-out" });
    }
    // A full navigation: the link confirms the address and sets the new session cookie.
    window.location.assign(resume!);
  }

  return (
    <Shell
      title="You're signed in as someone else"
      body={
        <>
          This link confirms <span className="font-medium text-foreground">{to}</span>, but this browser is signed in as{" "}
          <span className="font-medium text-foreground">{current}</span>. Only one account can be signed in at a time.
        </>
      }
    >
      <Button size="cta" className="w-full" onClick={continueAs} disabled={pending}>
        {pending && <Spinner className="size-4" />}
        Log out and continue as {to}
        {!pending && <ArrowRightIcon data-icon="inline-end" />}
      </Button>
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "pill" }), "mx-auto flex w-fit")}>
        Stay as {current}
      </Link>
      <p className="text-center text-[12.5px] leading-relaxed text-muted-foreground">If you stay, {to} isn&rsquo;t confirmed yet. Open the link again when you&rsquo;re ready.</p>
    </Shell>
  );
}

function Shell({ title, body, children }: { title: string; body: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[420px] space-y-6">
      <ShieldAlertIcon className="size-6 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      <div className="space-y-2.5">
        <h1 className="text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance">{title}</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
