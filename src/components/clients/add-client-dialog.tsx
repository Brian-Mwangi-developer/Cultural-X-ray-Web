"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClientForm } from "./client-form";

/** c3: Add a client, from Home, the sidebar or Settings → Clients. */
export function AddClientDialog({ agency, trigger }: { agency: { id: string; name: string }; trigger: React.ReactElement }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto rounded-[20px] p-7 sm:max-w-[680px]">
        <DialogHeader className="mb-1">
          <DialogTitle className="text-[26px] font-semibold tracking-[-0.03em]">Add a client</DialogTitle>
        </DialogHeader>
        <ClientForm
          agency={agency}
          onCancel={() => setOpen(false)}
          onDone={(result) => {
            setOpen(false);
            toast.success(
              result.mode === "create" ? `${result.workspace.name} is ready. We emailed ${result.ownerEmail} a claim link.` : `Request sent. ${result.workspaceName} will decide your access.`,
            );
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
