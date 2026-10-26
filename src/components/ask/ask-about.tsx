"use client";

import { MessageSquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Opens the Ask X-Ray panel with a question already asked (the launcher listens for "xray:ask"). */
export function AskAbout({ question, children = "Ask X-Ray about this" }: { question: string; children?: React.ReactNode }) {
  return (
    <Button variant="outline" size="pill" onClick={() => window.dispatchEvent(new CustomEvent("xray:ask", { detail: { question } }))}>
      <MessageSquareIcon data-icon="inline-start" />
      {children}
    </Button>
  );
}
