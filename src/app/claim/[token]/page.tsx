import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowRightIcon, FileTextIcon, MapIcon, UsersIcon } from "lucide-react";
import dusk from "../../../../public/images/panel-dusk.jpg";
import { BrandMark } from "@/components/app/parts";
import { PhotoAside, SplitShell } from "@/components/app/split-shell";
import { ClaimActions, type ClaimPreview } from "@/components/claim/claim-actions";
import { SessionGuard } from "@/components/auth/session-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Claim your workspace" };

const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");

async function loadClaim(token: string): Promise<ClaimPreview | null> {
  const res = await fetch(`${backendUrl}/api/v1/claims/${encodeURIComponent(token)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Claim preview answered ${res.status}`);
  return (await res.json()) as ClaimPreview;
}

export default function ClaimPage({ params }: PageProps<"/claim/[token]">) {
  return (
    <Suspense fallback={<SplitShell aside={<Skeleton className="h-full rounded-[22px]" />}><ClaimSkeleton /></SplitShell>}>
      <Claim params={params} />
    </Suspense>
  );
}

async function Claim({ params }: { params: PageProps<"/claim/[token]">["params"] }) {
  const { token } = await params;
  const [preview, user] = await Promise.all([loadClaim(token), currentUser()]);

  const aside = (
    <PhotoAside
      image={dusk}
      alt="Red canyon walls at dusk"
      eyebrow="Yours from today"
      title="You own the workspace. Agencies are guests."
      points={["Remove an agency any time; you keep everything", "Change their access without asking", "Take over billing whenever you're ready"]}
    />
  );

  if (!preview) {
    return (
      <SplitShell aside={aside}>
        <Dead title="This claim link doesn't exist" body="It may have been replaced by a newer one. Ask the agency to send it again." />
      </SplitShell>
    );
  }

  const meta = user?.email ?? preview.email;
  if (preview.status === "CLAIMED") {
    return (
      <SplitShell meta={meta} aside={aside}>
        <Dead title={`${preview.workspace.name} is already claimed`} body="If that was you, it's in your workspaces." href={user ? `/${preview.workspace.slug}` : "/login"} cta={user ? `Open ${preview.workspace.name}` : "Log in"} />
      </SplitShell>
    );
  }
  if (preview.status !== "PENDING" || preview.expired) {
    return (
      <SplitShell meta={meta} aside={aside}>
        <Dead title="This claim link has expired" body={`Claim links last two weeks. Ask ${preview.agency.name} to send a new one.`} />
      </SplitShell>
    );
  }

  const market = preview.workspace.markets.map((m) => (m === "GB" ? "UK" : "US")).join(" · ");
  const rivals = preview.workspace.rivals.join(", ");

  return (
    <SplitShell meta={meta} aside={aside}>
      <div className="space-y-7">
        <div className="flex items-center gap-3" aria-hidden>
          <BrandMark name={preview.agency.name} logo={preview.agency.logo} tone="ember" size="lg" />
          <ArrowRightIcon className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <BrandMark name={preview.workspace.name} tone="neutral" size="lg" />
        </div>
        <div>
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance">
            {preview.agency.name} set up {preview.workspace.name} for you
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Claim it to become the owner. The map, briefs and settings they made come with it.
          </p>
        </div>

        <ul className="divide-y rounded-[14px] border bg-card">
          <Item icon={MapIcon} title="Culture Map" body={[rivals && `vs ${rivals}`, market].filter(Boolean).join(" · ") || "Ready to build"} />
          <Item icon={FileTextIcon} title={preview.workspace.briefs === 1 ? "1 brief" : `${preview.workspace.briefs} briefs`} body={preview.workspace.briefs ? "Drafts and delivered" : "None yet"} />
          <Item icon={UsersIcon} title="Members" body="Just you, until you invite others" />
        </ul>

        <SessionGuard userId={user?.id ?? null} />
        <ClaimActions token={token} preview={preview} user={user ? { email: user.email } : null} />
      </div>
    </SplitShell>
  );
}

function Item({ icon: Icon, title, body }: { icon: typeof MapIcon; title: string; body: string }) {
  return (
    <li className="flex items-center gap-3.5 px-4 py-3.5">
      <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span>
        <span className="block text-[14.5px] font-medium">{title}</span>
        <span className="block text-[13px] text-muted-foreground">{body}</span>
      </span>
    </li>
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

function ClaimSkeleton() {
  return (
    <div className="space-y-7" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-11 w-32 rounded-xl" />
      <Skeleton className="h-9 w-4/5" />
      <Skeleton className="h-44 w-full rounded-[14px]" />
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  );
}
