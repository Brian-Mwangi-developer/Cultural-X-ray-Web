"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRightIcon, MailIcon, RotateCwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { unwrap } from "@/lib/api";
import { attempt } from "@/lib/feedback";
import { cn } from "@/lib/utils";
import { FormAlert } from "./auth-parts";
import { safeNext } from "./login-form";

const COOLDOWN_SECONDS = 45;

/** A shortcut to the person's inbox for the providers most people use. */
function inboxFor(email: string): { label: string; href: string } | null {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return { label: "Open Gmail", href: "https://mail.google.com/mail/u/0/#search/from%3A(Cultural+X-Ray)+in%3Aanywhere+newer_than%3A1d" };
  }
  if (["outlook.com", "hotmail.com", "live.com", "msn.com"].includes(domain)) return { label: "Open Outlook", href: "https://outlook.live.com/mail/0/" };
  if (["yahoo.com", "ymail.com"].includes(domain)) return { label: "Open Yahoo Mail", href: "https://mail.yahoo.com/" };
  if (["icloud.com", "me.com", "mac.com"].includes(domain)) return { label: "Open iCloud Mail", href: "https://www.icloud.com/mail" };
  return null;
}

export function VerifyEmail() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const next = safeNext(params.get("next"));
  const [cooldown, setCooldown] = useState(params.has("resent") ? COOLDOWN_SECONDS : 0);
  const [sending, setSending] = useState(false);
  const inbox = inboxFor(email);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    if (!email) return;
    setSending(true);
    const result = await attempt(async () => unwrap(await authClient.sendVerificationEmail({ email, callbackURL: next })), {
      where: "auth.verify.resend",
    });
    setSending(false);
    if (result.ok) {
      toast.success("Sent. It can take a minute to arrive.");
      setCooldown(COOLDOWN_SECONDS);
    }
  }

  return (
    <div className="space-y-8 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-card">
        <MailIcon className="size-6" strokeWidth={1.5} aria-hidden />
      </span>

      <div>
        <h1 className="text-[2.1rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance">Check your inbox</h1>
        <p className="mx-auto mt-3 max-w-88 text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {email ? (
            <>
              We sent a link to <span className="font-medium text-foreground">{email}</span>. Click it to confirm your email and you&rsquo;re in.
            </>
          ) : (
            "We sent you a link. Click it to confirm your email and you're in."
          )}
        </p>
      </div>

      {params.has("resent") && <FormAlert tone="info" message="Your email isn't confirmed yet, so we've sent a fresh link." />} {/* ui-ok: alert or field state, not a chip */}

      <div className="space-y-3">
        {inbox && (
          <a href={inbox.href} target="_blank" rel="noreferrer" className={cn(buttonVariants({ size: "cta" }), "w-full")}>
            {inbox.label}
            <ArrowUpRightIcon data-icon="inline-end" />
          </a>
        )}
        <Button
          variant="outline"
          size="cta"
          className="w-full font-medium"
          disabled={!email || sending || cooldown > 0}
          onClick={resend}
        >
          {sending ? <Spinner className="size-4" /> : <RotateCwIcon data-icon="inline-start" />}
          {cooldown > 0 ? `Send again in ${cooldown}s` : "Send the link again"}
        </Button>
      </div>

      <div className="space-y-1.5 text-[13px] leading-relaxed text-muted-foreground">
        <p>Can&rsquo;t find it? Look in spam or promotions for an email from Cultural X-Ray.</p>
        <p>
          Wrong address?{" "}
          <Link href="/signup" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
            Start again
          </Link>
        </p>
      </div>
    </div>
  );
}
