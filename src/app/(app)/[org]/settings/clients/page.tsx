import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shell/page-skeleton";
import { SettingsPage } from "@/components/settings/parts";
import { orgPage } from "@/lib/page-context";
import { PlusIcon } from "lucide-react";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { ClientsTable } from "@/components/settings/clients";
import { Button } from "@/components/ui/button";
import { isManager } from "@/lib/roles";
import { agencyClients } from "@/lib/session";
export const metadata: Metadata = { title: "Clients" };

export default function Page({ params }: PageProps<"/[org]/settings/clients">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/[org]/settings/clients">["params"] }) {
  const { org, slug } = await orgPage(params, "AGENCY");
  const clients = await agencyClients(org.organization.id);
  return (
    <SettingsPage
      slug={slug}
      wide
      title="Clients"
      description="Each client owns its workspace. You see what they’ve granted; they can change it or remove you at any time."
      actions={
        isManager(org.membership.role) && (
          <AddClientDialog
            agency={{ id: org.organization.id, name: org.organization.name }}
            trigger={
              <Button size="pill" className="h-9 px-4">
                <PlusIcon data-icon="inline-start" />
                Add client
              </Button>
            }
          />
        )
      }
    >
      <ClientsTable slug={slug} clients={clients} />
    </SettingsPage>
  );
}
