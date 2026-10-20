"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { unwrap } from "@/lib/api";
import { attempt } from "@/lib/feedback";
import { cn } from "@/lib/utils";

export type InvitePreview = {
  id: string;
  email: string;
  role: string;
  status: string;
  expired: boolean;
  expiresAt: string;
  organization: { name: string; kind: "AGENCY" | "WORKSPACE"; logo: string | null; slug: string };
  inviter: { name: string };
  accountExists: boolean;
};

export function InviteActions({ preview, user }: { preview: InvitePreview; user: { email: string; name: string } | null }) {
  const router = useRouter();
  const [pending, setPending] = useState<"accept" | "decline" | "signout" | null>(null);
  const [declined, setDeclined] = useState(false);
  const back = `/invite/${preview.id}`;

  if (!user) {
    const query = new URLSearchParams({ email: preview.email, next: back });
    return (
      <div className="space-y-3">
        {preview.accountExists ? (
          <Link href={`/login?${query}`} className={cn(buttonVariants({ size: "cta" }), "w-full")}>
            Log in to accept
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        ) : (
          <Link href={`/signup?${new URLSearchParams({ email: preview.email, invite: preview.id })}`} className={cn(buttonVariants({ size: "cta" }), "w-full")}>
            Create your account
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        )}
        <p className="text-center text-[13px] text-muted-foreground">
          {preview.accountExists ? "Log in as " : "Takes a minute. Use "}
          <span className="font-medium text-foreground">{preview.email}</span>
          {preview.accountExists ? "." : ", the address the invitation went to."}
        </p>
      </div>
    );
  }

  if (user.email.toLowerCase() !== preview.email.toLowerCase()) {
    async function switchAccount() {
      setPending("signout");
      await attempt(async () => unwrap(await authClient.signOut()), { where: "invite.switch-account" });
      router.refresh();
    }
    return (
      <div className="space-y-4 rounded-[14px] border border-dashed px-5 py-4">
        <p className="text-[14px] leading-relaxed">
          You&rsquo;re signed in as <span className="font-medium">{user.email}</span>, but this invitation is for{" "}
          <span className="font-medium">{preview.email}</span>.
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
      <div className="space-y-2 rounded-[14px] border bg-muted/60 px-5 py-4">
        <p className="text-[14px] font-medium">Invitation declined</p>
        <p className="text-[13.5px] text-muted-foreground">{preview.inviter.name} can see that you said no. Nothing else changes.</p>
      </div>
    );
  }

  async function accept() {
    setPending("accept");
    const result = await attempt(
      async () => {
        unwrap(await authClient.organization.acceptInvitation({ invitationId: preview.id }));
        const org = unwrap(await authClient.organization.setActive({ organizationSlug: preview.organization.slug }));
        return org;
      },
      { where: "invite.accept", success: `Welcome to ${preview.organization.name}` },
    );
    if (result.ok) {
      router.replace(`/${preview.organization.slug}`);
      router.refresh();
      return;
    }
    setPending(null);
  }

  async function decline() {
    setPending("decline");
    const result = await attempt(async () => unwrap(await authClient.organization.rejectInvitation({ invitationId: preview.id })), { where: "invite.decline" });
    setPending(null);
    if (result.ok) setDeclined(true);
  }

  return (
    <div className="space-y-3">
      <Button size="cta" className="w-full" onClick={accept} disabled={pending !== null}>
        {pending === "accept" ? <Spinner className="size-4" /> : null}
        Join {preview.organization.name}
        {pending !== "accept" && <ArrowRightIcon data-icon="inline-end" />}
      </Button>
      <p className="text-center text-[13px] text-muted-foreground">
        Not for you?{" "}
        <button type="button" onClick={decline} disabled={pending !== null} className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground disabled:opacity-50">
          {pending === "decline" ? "Declining…" : "Decline"}
        </button>
        , and {preview.inviter.name} is told.
      </p>
    </div>
  );
}
