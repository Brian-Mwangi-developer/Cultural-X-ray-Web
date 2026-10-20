"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { signOut } from "@/lib/auth-client";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  useResetOnHide(() => setPending(false));

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className="rounded-full text-muted-foreground"
      onClick={async () => {
        setPending(true);
        await signOut();
        router.replace("/login");
        router.refresh();
      }}
    >
      {pending ? <Spinner /> : <LogOutIcon strokeWidth={1.75} />}
      Log out
    </Button>
  );
}
