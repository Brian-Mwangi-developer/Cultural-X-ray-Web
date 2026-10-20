"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRightIcon, Building2Icon, StoreIcon } from "lucide-react";
import dusk from "../../../public/images/panel-dusk.jpg";
import { BrandMark } from "@/components/app/parts";
import { PhotoAside, SplitShell } from "@/components/app/split-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { attempt } from "@/lib/feedback";
import { roleLabel } from "@/lib/roles";
import type { Membership } from "@/lib/session";

export type Joinable = { id: string; name: string; slug: string; kind: "AGENCY" | "WORKSPACE"; logo: string | null; joinRole: string | null; members: number };

const KINDS = [
  { kind: "brand", icon: StoreIcon, title: "My brand", body: "See the culture your customers live in, the plays it suggests, and how your next ad will land." },
  { kind: "agency", icon: Building2Icon, title: "An agency", body: "Bring your team, set up client workspaces, and run maps and ad checks across all of them." },
] as const;

export function Chooser({ name, joinable, memberships }: { name: string; joinable: Joinable[]; memberships: Membership[] }) {
  const router = useRouter();
  const [joining, setJoining] = useState<string | null>(null);
  const first = name.split(" ")[0] || name;

  async function join(org: Joinable) {
    setJoining(org.id);
    const result = await attempt(() => api<{ slug: string }>(`/orgs/${org.id}/join`, { method: "POST" }), { where: "onboarding.join-domain", success: `You joined ${org.name}` });
    if (result.ok) {
      router.replace(`/${result.data.slug}`);
      router.refresh();
    } else setJoining(null);
  }

  return (
    <SplitShell
      aside={
        <PhotoAside
          image={dusk}
          alt="Red canyon walls at dusk"
          eyebrow="Cultural X-Ray"
          title="See the culture around a brand, and who owns it."
          points={["Read from Qloo's taste graph, not surveys", "Every claim links back to its evidence", "Built for brands and the agencies that run them"]}
        />
      }
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-[34px] leading-[1.08] font-semibold tracking-[-0.03em]">Welcome, {first}</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">What are you setting up? You can add the other later.</p>
        </div>

        {joinable.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[13.5px] font-medium">Your team is already here</h2>
            <ul className="divide-y rounded-[14px] border bg-card">
              {joinable.map((org) => (
                <li key={org.id} className="flex items-center gap-3 px-4 py-3.5">
                  <BrandMark name={org.name} logo={org.logo} tone={org.kind === "AGENCY" ? "ember" : "ink"} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-medium">{org.name}</p>
                    <p className="text-[12.5px] text-muted-foreground">
                      {org.members} {org.members === 1 ? "person" : "people"} · you&rsquo;d join as {roleLabel(org.joinRole ?? "viewer")}
                    </p>
                  </div>
                  <Button size="pill" variant="outline" onClick={() => join(org)} disabled={joining !== null}>
                    {joining === org.id && <Spinner className="size-3.5" />}
                    Join
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid gap-3">
          {KINDS.map((k) => (
            <Link
              key={k.kind}
              href={`/onboarding?kind=${k.kind}`}
              className="group flex items-start gap-4 rounded-[16px] border bg-card p-5 transition-colors hover:border-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-muted">
                <k.icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold">{k.title}</span>
                <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-foreground">{k.body}</span>
              </span>
              <ArrowRightIcon className="mt-2.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" strokeWidth={1.75} aria-hidden />
            </Link>
          ))}
        </div>

        {memberships.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-[13px] text-muted-foreground">Or go back to</h2>
            <div className="flex flex-wrap gap-2">
              {memberships.map((m) => (
                <Link key={m.id} href={`/${m.slug}`} className="inline-flex h-9 items-center gap-2 rounded-full border bg-card pr-3.5 pl-1.5 text-[13.5px] font-medium hover:border-foreground/25">
                  <BrandMark name={m.name} logo={m.logo} tone={m.kind === "AGENCY" ? "ember" : "ink"} size="xs" className="rounded-full" />
                  {m.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </SplitShell>
  );
}
