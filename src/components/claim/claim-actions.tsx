"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { ACCESS_COPY, type Access } from "@/components/clients/client-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api, unwrap } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { attempt } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export type ClaimPreview = {
  email: string;
  status: "PENDING" | "CLAIMED" | "DECLINED" | "EXPIRED" | "CANCELLED";
  expired: boolean;
  expiresAt: string;
  requestedAccess: Access;
  workspace: { name: string; slug: string; markets: ("US" | "GB")[]; rivals: string[]; maps: number; briefs: number };
  agency: { name: string; logo: string | null };
  createdBy: string | null;
  accountExists: boolean;
};

const ORDER: Access[] = ["MANAGE", "EDIT", "VIEW"];

export function ClaimActions({ token, preview, user }: { token: string; preview: ClaimPreview; user: { email: string } | null }) {
  const router = useRouter();
  const [access, setAccess] = useState<Access>(preview.requestedAccess);
  const [pending, setPending] = useState<"claim" | "decline" | "signout" | null>(null);
  const [declined, setDeclined] = useState(false);
  const back = `/claim/${token}`;

  if (!user) {
    return (
      <div className="space-y-3">
        {preview.accountExists ? (
          <Link href={`/login?${new URLSearchParams({ email: preview.email, next: back })}`} className={cn(buttonVariants({ size: "cta" }), "w-full")}>
            Log in to claim
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        ) : (
          <Link href={`/signup?${new URLSearchParams({ email: preview.email, claim: token })}`} className={cn(buttonVariants({ size: "cta" }), "w-full")}>
            Create your account to claim
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        )}
        <p className="text-center text-[13px] text-muted-foreground">
          Use <span className="font-medium text-foreground">{preview.email}</span>, the address this was sent to.
        </p>
      </div>
    );
  }

  if (user.email.toLowerCase() !== preview.email.toLowerCase()) {
    async function switchAccount() {
      setPending("signout");
      await attempt(async () => unwrap(await authClient.signOut()), { where: "claim.switch-account" });
      router.refresh();
    }
    return (
      <div className="space-y-4 rounded-[14px] border border-dashed px-5 py-4">
        <p className="text-[14px] leading-relaxed">
          You&rsquo;re signed in as <span className="font-medium">{user.email}</span>, but this workspace is for <span className="font-medium">{preview.email}</span>.
        </p>
        <Button variant="outline" size="pill" onClick={switchAccount} disabled={pending !== null}>
          {pending === "signout" && <Spinner className="size-3.5" />}
          Log out and switch account
        </Button>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="space-y-1 rounded-[14px] border bg-muted/60 px-5 py-4">
        <p className="text-[14px] font-medium">Declined</p>
        <p className="text-[13.5px] text-muted-foreground">{preview.agency.name} can see that you said no. Nothing else changes.</p>
      </div>
    );
  }

  async function claim() {
    setPending("claim");
    const result = await attempt(
      async () => {
        const { slug } = await api<{ slug: string }>(`/claims/${encodeURIComponent(token)}/accept`, { body: { access } });
        unwrap(await authClient.organization.setActive({ organizationSlug: slug }));
        return slug;
      },
      { where: "claim.accept", success: `${preview.workspace.name} is yours` },
    );
    if (result.ok) {
      router.replace(`/${result.data}`);
      router.refresh();
    } else setPending(null);
  }

  async function decline() {
    setPending("decline");
    const result = await attempt(() => api(`/claims/${encodeURIComponent(token)}/decline`, { method: "POST" }), { where: "claim.decline" });
    setPending(null);
    if (result.ok) setDeclined(true);
  }

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2.5">
        <legend className="mb-2.5 text-[13.5px] font-medium">{preview.agency.name}&rsquo;s access after you claim</legend>
        {ORDER.map((level) => (
          <label
            key={level}
            className={cn(
              "flex cursor-pointer items-center gap-3.5 rounded-[14px] border bg-card px-4 py-3.5 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/40",
              access === level ? "border-ember bg-ember-soft/70" : "hover:border-foreground/25",
            )}
          >
            <input type="radio" name="access" value={level} checked={access === level} onChange={() => setAccess(level)} className="sr-only" />
            <span aria-hidden className={cn("flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px]", access === level ? "border-ember" : "border-faint")}>
              {access === level && <span className="size-2.5 rounded-full bg-ember" />}
            </span>
            <span>
              <span className="block text-[14.5px] font-medium">{ACCESS_COPY[level].label}</span>
              <span className="block text-[13px] text-muted-foreground">
                {ACCESS_COPY[level].can}
                {level === preview.requestedAccess && " What they asked for."}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <Button size="cta" className="w-full" onClick={claim} disabled={pending !== null}>
        {pending === "claim" && <Spinner className="size-4" />}
        Claim {preview.workspace.name}
        {pending !== "claim" && <ArrowRightIcon data-icon="inline-end" />}
      </Button>
      <p className="text-center text-[13px] text-muted-foreground">
        Not you?{" "}
        <button type="button" onClick={decline} disabled={pending !== null} className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground disabled:opacity-50">
          {pending === "decline" ? "Declining…" : "Decline"}
        </button>
        , and {preview.agency.name} is told.
      </p>
    </div>
  );
}
