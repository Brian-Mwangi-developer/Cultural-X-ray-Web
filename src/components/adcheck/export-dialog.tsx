"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CircleCheckIcon, DownloadIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { seconds } from "@/lib/ads";
import { canExport, ExportUnsupported, renderMp4 } from "@/lib/export-video";
import { type Cut, cutDown, type Format, FORMAT_FOR, FORMAT_WORDS, playable } from "@/lib/recut";
import { cn } from "@/lib/utils";

type Row = { id: "main" | "15" | "6"; label: string; sub: string; cut: Cut };
type Cell = `${Row["id"]}|${Format}`;
type State = "off" | "queued" | "making" | "ready" | "failed";
const FORMATS: Format[] = ["9:16", "16:9", "1:1"];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "ad";

/**
 * R8 · Export versions: the cut, a 15-second cut-down and a 6-second bumper, each in the shapes its
 * placements need, made one after another in this browser (lib/export-video.ts). Shapes for where the
 * ad will run are ticked to begin with.
 */
export function ExportDialog({ open, onOpenChange, src, cut, brand, title, placements }: { open: boolean; onOpenChange: (o: boolean) => void; src: string; cut: Cut; brand: string; title: string; placements: string[] }) {
  const main = playable(cut, brand);
  const rows: Row[] = [
    { id: "main", label: `Main · ${seconds(main.durationMs)}`, sub: "This version", cut },
    ...([15_000, 6_000] as const).flatMap((ms): Row[] => {
      const down = cutDown(cut, ms);
      return down ? [{ id: ms === 15_000 ? "15" : "6", label: ms === 15_000 ? "Cut-down · 15 s" : "Bumper · 6 s", sub: ms === 15_000 ? "For feeds" : "Opening and ending", cut: down }] : [];
    }),
  ];
  const wanted = new Set<Format>(placements.map((p) => FORMAT_FOR[p]).filter((f): f is Format => Boolean(f)));
  if (!wanted.size) wanted.add(cut.format);

  const [picked, setPicked] = useState<Set<Cell>>(() => new Set([...wanted].map((f) => `main|${f}` as Cell)));
  const [state, setState] = useState<Record<string, State>>({});
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<Record<string, { url: string; name: string }>>({});
  const [supported, setSupported] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const stop = useRef<AbortController | null>(null);
  const source = useRef<Blob | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    void canExport().then((ok) => live && setSupported(ok));
    return () => {
      live = false;
    };
  }, [open]);
  // Files made here live in memory; let them go when the dialog is done with.
  useEffect(() => () => Object.values(files).forEach((f) => URL.revokeObjectURL(f.url)), [files]);

  const toggle = (cell: Cell) => setPicked((p) => (p.has(cell) ? new Set([...p].filter((c) => c !== cell)) : new Set([...p, cell])));
  const cells = [...picked].filter((c) => !files[c]);
  const ready = Object.keys(files).length;
  const done = Object.values(state).filter((s) => s === "ready").length;

  async function make() {
    setRunning(true);
    stop.current = new AbortController();
    try {
      const draft: Blob =
        source.current ??
        (await fetch(src, { credentials: "same-origin" }).then((r) => {
          if (!r.ok) throw new Error("source");
          return r.blob();
        }));
      source.current = draft;
      const todo = cells.slice();
      setState((s) => ({ ...s, ...Object.fromEntries(todo.map((c) => [c, "queued"])) }));
      for (const [n, cell] of todo.entries()) {
        const [rowId, format] = cell.split("|") as [Row["id"], Format];
        const row = rows.find((r) => r.id === rowId)!;
        const play = playable({ ...row.cut, format }, brand);
        setState((s) => ({ ...s, [cell]: "making" }));
        try {
          const blob = await renderMp4({ source: draft, ...play, format, sound: row.cut.sound, title, signal: stop.current.signal, onProgress: (p) => setProgress((n + p) / todo.length) });
          const name = `${slug(title)}-${rowId === "main" ? "main" : `${rowId}s`}-${format.replace(":", "x")}.mp4`;
          setFiles((f) => ({ ...f, [cell]: { url: URL.createObjectURL(blob), name } }));
          setState((s) => ({ ...s, [cell]: "ready" }));
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") throw error;
          setState((s) => ({ ...s, [cell]: "failed" }));
          if (error instanceof ExportUnsupported) {
            toast(error.message);
            break;
          }
        }
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) toast("We couldn’t load the draft to make the files. Try again.");
    } finally {
      setRunning(false);
      setState((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v === "queued" || v === "making" ? (files[k] ? "ready" : "off") : v])));
    }
  }

  function download(cell: string) {
    const f = files[cell];
    if (!f) return;
    const a = document.createElement("a");
    a.href = f.url;
    a.download = f.name;
    a.click();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && running) stop.current?.abort();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="text-[22px] tracking-[-0.02em]">Export versions</DialogTitle>
          <DialogDescription>Made on this computer: nothing is uploaded, and it’s free.</DialogDescription>
        </DialogHeader>

        {supported === false ? (
          <p className="rounded-[12px] border bg-muted/60 px-4 py-3 text-[13.5px] leading-relaxed">This browser can’t make video files. Open this page in Chrome, Edge or Safari on a computer to export.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[13.5px]">
              <thead className="text-[12px] text-muted-foreground">
                <tr>
                  <th className="w-[170px] pb-2 font-normal" />
                  {FORMATS.map((f) => (
                    <th key={f} className="pb-2 font-medium">
                      {FORMAT_WORDS[f]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-3 pr-3">
                      <span className="block font-medium">{r.label}</span>
                      <span className="block text-[12px] text-muted-foreground">{r.sub}</span>
                    </td>
                    {FORMATS.map((f) => {
                      const cell = `${r.id}|${f}` as Cell;
                      const st = files[cell] ? "ready" : state[cell] ?? "off";
                      return (
                        <td key={f} className="py-3">
                          {st === "ready" ? (
                            <button type="button" onClick={() => download(cell)} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium hover:text-ember-ink">
                              <CircleCheckIcon className="size-4" aria-hidden /> Download
                            </button>
                          ) : st === "making" ? (
                            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ember-ink">
                              <LoaderCircleIcon className="size-4 animate-spin" aria-hidden /> Making…
                            </span>
                          ) : (
                            <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-muted-foreground">
                              <Checkbox checked={picked.has(cell)} disabled={running} onCheckedChange={() => toggle(cell)} aria-label={`${r.label} in ${f}`} />
                              {st === "queued" ? "Queued" : st === "failed" ? <span className="text-destructive">Didn’t work</span> : wanted.has(f) && r.id === "main" ? "Where it runs" : ""}
                            </label>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(running || done > 0) && (
          <div className="space-y-2">
            <div className="flex justify-between text-[12.5px]">
              <span>
                {ready} of {ready + cells.filter((c) => state[c] !== "failed").length} ready
              </span>
              {running && <span className="text-muted-foreground">Keep this tab open while it finishes.</span>}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-soft">
              <div className="h-full rounded-full bg-ember transition-[width]" style={{ width: `${Math.round((running ? progress : 1) * 100)}%` }} />
            </div>
          </div>
        )}

        <DialogFooter className="items-center gap-2 sm:justify-between">
          <p className={cn("text-[12.5px] text-muted-foreground", !rows.some((r) => r.id !== "main") && "invisible")}>Cut-downs keep the opening and the ending, and share the time between the shots.</p>
          <div className="flex gap-2">
            {ready > 1 && (
              <Button variant="outline" size="pill" onClick={() => Object.keys(files).forEach(download)}>
                <DownloadIcon data-icon="inline-start" />
                Download all {ready}
              </Button>
            )}
            <Button size="pill" disabled={!cells.length || running || supported === false} onClick={() => void make()}>
              {running ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : <DownloadIcon data-icon="inline-start" />}
              {running ? "Making…" : cells.length ? `Make ${cells.length} ${cells.length === 1 ? "file" : "files"}` : "Pick a version"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
