"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CopyIcon, DownloadIcon, Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { AppError } from "@/lib/errors";

const reportHref = (slug: string, orgId: string) => `/${slug}/report/culture?org=${orgId}&print=1`;

/**
 * The overview's Share and Export PDF. Share turns on a read-only link to the culture report (it always
 * shows the latest map; turning it off stops the link). Export opens the report on paper and the
 * browser's Save as PDF.
 */
export function ReportActions({ orgId, slug, brand, canShare }: { orgId: string; slug: string; brand: string; canShare: boolean }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || token !== undefined) return;
    let live = true;
    api<{ report: { shareToken: string | null } }>(`/orgs/${orgId}/report`).then(
      ({ report }) => live && setToken(report.shareToken),
      () => live && setToken(null),
    );
    return () => {
      live = false;
    };
  }, [open, token, orgId]);

  async function toggle(on: boolean) {
    setBusy(true);
    try {
      const { shareToken } = await api<{ shareToken: string | null }>(`/orgs/${orgId}/report/share`, { method: "PUT", body: { on } });
      setToken(shareToken);
    } catch (error) {
      toast(error instanceof AppError ? error.message : "That didn’t change. Try again.");
    } finally {
      setBusy(false);
    }
  }
  const url = token && typeof window !== "undefined" ? `${window.location.origin}/r/${token}` : null;

  return (
    <>
      {canShare && (
        <Button variant="outline" size="pill" onClick={() => setOpen(true)}>
          <Share2Icon data-icon="inline-start" />
          Share
        </Button>
      )}
      <Button variant="outline" size="pill" className="hidden md:inline-flex" onClick={() => window.open(reportHref(slug, orgId), "_blank", "noopener")}>
        <DownloadIcon data-icon="inline-start" />
        Export PDF
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Share {brand}’s culture report</DialogTitle>
            <DialogDescription>Anyone with the link sees the report: the read, the map’s highlights, who your customers are, places and plays. Always the latest; never the workspace itself.</DialogDescription>
          </DialogHeader>
          <label className="flex items-center justify-between gap-4 rounded-[12px] border px-4 py-3">
            <span>
              <span className="block text-[14px] font-medium">Read-only link</span>
              <span className="block text-[12.5px] text-muted-foreground">{token === undefined ? "Checking…" : url ? "On. Turning it off stops the link working." : "Off."}</span>
            </span>
            {token === undefined ? <Spinner className="size-4" /> : <Switch checked={Boolean(url)} disabled={busy} onCheckedChange={(on) => void toggle(on)} />}
          </label>
          {url && (
            <div className="flex gap-2">
              <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Share link" />
              <Button variant="outline" onClick={() => void navigator.clipboard.writeText(url).then(() => toast("Link copied."), () => toast("Couldn’t copy. Select the link and copy it."))}>
                <CopyIcon data-icon="inline-start" />
                Copy
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
