"use client";

import { useEffect } from "react";
import { DownloadIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/**
 * The bar above a report on paper: our mark, what it is, and Save as PDF (the browser's own PDF,
 * A4, page numbers from globals.css). Opened with ?print=1 it goes straight to the print dialog once
 * the fonts and charts have drawn. Hidden in the PDF itself.
 */
export function PrintBar({ label, autoPrint = false }: { label: string; autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    let cancelled = false;
    void document.fonts.ready.then(() => setTimeout(() => !cancelled && window.print(), 600));
    return () => {
      cancelled = true;
    };
  }, [autoPrint]);
  return (
    <div className="no-print sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[860px] items-center justify-between gap-4 px-4">
        <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <LogoMark className="size-5 text-ember" />
          <span className="font-semibold text-foreground">Cultural X-Ray</span>
          <span className="hidden sm:inline">· {label}</span>
        </span>
        <Button size="pill" onClick={() => window.print()}>
          <DownloadIcon data-icon="inline-start" />
          Save as PDF
        </Button>
      </div>
    </div>
  );
}
