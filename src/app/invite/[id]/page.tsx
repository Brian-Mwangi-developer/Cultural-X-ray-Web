import type { Metadata } from "next";
import { Suspense } from "react";
import misty from "../../../../public/images/panel-misty.jpg";
import { BrandMark } from "@/components/app/parts";
import { PhotoAside, SplitShell } from "@/components/app/split-shell";
import { InviteActions, type InvitePreview } from "@/components/invite/invite-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_COPY, type RoleName } from "@/lib/roles";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Invitation" };

const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");

async function loadPreview(id: string): Promise<InvitePreview | null> {
  const res = await fetch(`${backendUrl}/api/v1/invitations/${encodeURIComponent(id)}/preview`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Invitation preview answered ${res.status}`);
  return (await res.json()) as InvitePreview;
}

export default function InvitePage({ params }: PageProps<"/invite/[id]">) {
  return (
    <SplitShell
      aside={
        <PhotoAside
          image={misty}
          alt="Mist rolling over a mountain ridge"
          eyebrow="Work together"
          title="One map, the whole team reading it."
          points={["Maps, briefs and ad checks in one place", "Every claim links back to its evidence", "Your role decides what you can change"]}
        />
      }
    >
      <Suspense fallback={<InviteSkeleton />}>
        <Invite params={params} />
      </Suspense>
    </SplitShell>
  );
}

async function Invite({ params }: { params: PageProps<"/invite/[id]">["params"] }) {
  const { id } = await params;
  const [preview, user] = await Promise.all([loadPreview(id), currentUser()]);

  if (!preview) {
    return <Dead title="This invitation doesn't exist" body="It may have been cancelled. Ask the person who invited you to send a new one." />;
  }
  if (preview.status === "accepted") {
    return <Dead title="Already accepted" body={`This invitation to ${preview.organization.name} has been used.`} href={user ? `/${preview.organization.slug}` : "/login"} cta={user ? `Open ${preview.organization.name}` : "Log in"} />;
  }
  if (preview.status !== "pending" || preview.expired) {
    return <Dead title="This invitation has expired" body={`Invitations last a week. Ask ${preview.inviter.name} to send a new one.`} />;
  }

  const role = ROLE_COPY[preview.role as RoleName] ?? { label: preview.role, can: "" };
  const place = preview.organization.kind === "AGENCY" ? "agency" : "workspace";

  return (
    <div className="space-y-8">
      <BrandMark name={preview.organization.name} logo={preview.organization.logo} tone={preview.organization.kind === "AGENCY" ? "ember" : "ink"} size="lg" />
      <div>
        <h1 className="text-[34px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance">Join {preview.organization.name}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {preview.inviter.name} invited you to their {place} on Cultural X-Ray as {role.label === "Admin" ? "an" : "a"} {role.label}.
        </p>
      </div>

      <dl className="divide-y rounded-[14px] border bg-card">
        <Row label={place === "agency" ? "Agency" : "Workspace"} value={preview.organization.name} />
        <Row label="Your role" value={role.label} note={role.can} />
        <Row label="Invited by" value={preview.inviter.name} />
        <Row label="For" value={preview.email} />
      </dl>

      <InviteActions preview={preview} user={user ? { email: user.email, name: user.name } : null} />
    </div>
  );
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 px-5 py-3.5">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-[14px]">
        <span className="font-medium break-words">{value}</span>
        {note && <span className="mt-0.5 block text-[13px] text-muted-foreground">{note}</span>}
      </dd>
    </div>
  );
}

function Dead({ title, body, href = "/dashboard", cta = "Go to Cultural X-Ray" }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-[30px] leading-[1.1] font-semibold tracking-[-0.03em]">{title}</h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{body}</p>
      <a href={href} className="inline-block text-[14px] font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
        {cta}
      </a>
    </div>
  );
}

function InviteSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading invitation">
      <Skeleton className="size-11 rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-48 w-full rounded-[14px]" />
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  );
}
