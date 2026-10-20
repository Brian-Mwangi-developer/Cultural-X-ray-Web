"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClientForm } from "@/components/clients/client-form";
import type { OrgContext } from "@/lib/session";

/** Agency step 3: add a first client, or skip to Home. */
export function FirstClient({ agency }: { agency: OrgContext }) {
  const router = useRouter();
  const home = `/${agency.organization.slug}`;
  return (
    <div className="mt-6 space-y-6">
      <div>
        <h1 className="text-[34px] leading-[1.08] font-semibold tracking-[-0.03em]">Add your first client</h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">Set one up for them, or connect to a brand already on Cultural X-Ray.</p>
      </div>
      <ClientForm
        agency={{ id: agency.organization.id, name: agency.organization.name }}
        onDone={(result) => {
          toast.success(
            result.mode === "create" ? `${result.workspace.name} is ready. We emailed ${result.ownerEmail} a claim link.` : `Request sent. ${result.workspaceName} will decide your access.`,
          );
          router.replace(home);
          router.refresh();
        }}
      />
      <button type="button" onClick={() => router.replace(home)} className="block w-full text-center text-[14px] text-muted-foreground hover:text-foreground">
        Skip for now
      </button>
    </div>
  );
}
