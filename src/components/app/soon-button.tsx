"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** An action whose feature isn't connected yet. It says so instead of doing nothing. */
export function SoonButton({
  children,
  message = "This arrives with the Culture Map engine.",
  ...props
}: React.ComponentProps<typeof Button> & { message?: string }) {
  return (
    <Button type="button" onClick={() => toast(message, { description: "You're looking at sample data for now." })} {...props}>
      {children}
    </Button>
  );
}
