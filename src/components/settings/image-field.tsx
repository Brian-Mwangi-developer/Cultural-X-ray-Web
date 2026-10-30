"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AppError } from "@/lib/errors";
import { fileProblem, IMAGE_TYPES } from "@/lib/media";

/**
 * A logo or photo with Upload and Remove beside its preview. The preview is whatever the caller draws
 * (a BrandMark or an Avatar), so it looks the same here as everywhere else. Refreshes the page once
 * saved, so the sidebar and menus pick the new image up; the button keeps spinning until the new image is drawn.
 */
export function ImageField({ label, help, preview, has, disabled, onSave }: { label: string; help: string; preview: React.ReactNode; has: boolean; disabled?: boolean; onSave: (file: File | null) => Promise<unknown> }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState<"upload" | "remove" | null>(null);
  const [last, setLast] = useState<"upload" | "remove">("upload");
  const [refreshing, startRefresh] = useTransition();
  const busy = saving ?? (refreshing ? last : null);

  async function save(file: File | null) {
    if (file) {
      const problem = fileProblem(file);
      if (problem) return toast(problem);
    }
    setSaving(file ? "upload" : "remove");
    setLast(file ? "upload" : "remove");
    try {
      await onSave(file);
      toast(file ? "Saved." : "Removed.");
      startRefresh(() => router.refresh());
    } catch (error) {
      toast(error instanceof AppError ? error.message : "That didn’t upload. Try again.");
    } finally {
      setSaving(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {preview}
      <div className="min-w-0 flex-1 text-[13.5px]">
        <p className="font-medium">{label}</p>
        <p className="mt-0.5 text-muted-foreground">{help}</p>
      </div>
      <div className="flex gap-2">
        <input ref={input} type="file" accept={IMAGE_TYPES.join(",")} className="hidden" onChange={(e) => e.target.files?.[0] && void save(e.target.files[0])} />
        <Button type="button" variant="outline" size="pill" disabled={disabled || busy !== null} onClick={() => input.current?.click()}>
          {busy === "upload" ? <Spinner data-icon="inline-start" /> : <UploadIcon data-icon="inline-start" />}
          {has ? "Change" : "Upload"}
        </Button>
        {has && (
          <Button type="button" variant="ghost" size="pill" disabled={disabled || busy !== null} onClick={() => void save(null)}>
            {busy === "remove" ? <Spinner data-icon="inline-start" /> : <Trash2Icon data-icon="inline-start" />}
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
