"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { AppError } from "@/lib/errors";
import { guideApi, type Memory } from "@/lib/guide";
import { SettingRow, SettingsSection } from "./parts";

const when = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
const oops = (error: unknown) => toast(error instanceof AppError ? error.message : "That didn’t save. Try again.");

/**
 * Settings › Profile › What X-Ray remembers (Figma 25 · C1): every note Ask X-Ray keeps about this
 * person in this workspace, where it came from, and Forget. On by default; one switch turns it off.
 * Only this person sees them; an agency never sees a brand's.
 */
export function MemorySettings({ orgId, brand }: { orgId: string; brand: string }) {
  const [memory, setMemory] = useState<Memory | null>(null);

  useEffect(() => {
    let live = true;
    guideApi.memory(orgId).then(
      ({ memory: m }) => live && setMemory(m),
      () => live && setMemory({ on: true, facts: [] }),
    );
    return () => {
      live = false;
    };
  }, [orgId]);

  async function toggle(on: boolean) {
    setMemory((m) => (m ? { ...m, on } : m));
    await guideApi.remembering(on).catch((error: unknown) => {
      setMemory((m) => (m ? { ...m, on: !on } : m));
      oops(error);
    });
  }

  async function drop(id: string | "all") {
    const before = memory;
    setMemory((m) => (m ? { ...m, facts: id === "all" ? [] : m.facts.filter((f) => f.id !== id) } : m));
    await guideApi.forget(orgId, id).then(
      () => toast(id === "all" ? "Forgotten. X-Ray starts fresh here." : "Forgotten."),
      (error: unknown) => {
        setMemory(before);
        oops(error);
      },
    );
  }

  return (
    <div id="memory" className="scroll-mt-24">
      <SettingsSection
        title="What X-Ray remembers"
        description={`Short notes Ask X-Ray keeps about you in ${brand} so you don’t have to repeat yourself. Only you see them.`}
        action={
          memory && memory.facts.length > 0 ? (
            <Button variant="outline" size="pill" onClick={() => void drop("all")}>
              <Trash2Icon data-icon="inline-start" />
              Forget everything
            </Button>
          ) : null
        }
      >
        <div className="border-t">
          <SettingRow label="Remember things I tell X-Ray" description="When it keeps a note, the chat says so. Turning this off stops new notes; the ones below stay until you forget them." htmlFor="remember">
            <Switch id="remember" checked={memory?.on ?? true} disabled={!memory} onCheckedChange={(on) => void toggle(on)} />
          </SettingRow>
        </div>
        {!memory ? (
          <div className="space-y-2 pt-3">
            <Skeleton className="h-11 w-full rounded-[10px]" />
            <Skeleton className="h-11 w-full rounded-[10px]" />
          </div>
        ) : memory.facts.length === 0 ? (
          <p className="border-t py-5 text-[13.5px] text-muted-foreground">Nothing yet. Tell Ask X-Ray about your plans (“we open in Leeds in March”) and it will keep a note here.</p>
        ) : (
          <ul className="divide-y border-t">
            {memory.facts.map((f) => (
              <li key={f.id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px]">{f.fact}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    {f.source === "picked" ? "You picked" : "You said"} · {when(f.createdAt)}
                  </p>
                </div>
                <Button variant="ghost" size="pill" className="text-muted-foreground" onClick={() => void drop(f.id)} aria-label={`Forget “${f.fact}”`}>
                  <Trash2Icon data-icon="inline-start" />
                  Forget
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>
    </div>
  );
}
