"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { PauseIcon, PlayIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { clock } from "@/lib/ads";
import { type Clip, locate, type Overlay } from "@/lib/recut";
import { cn } from "@/lib/utils";

export type EditPlayerHandle = { play: (fromMs?: number) => void; pause: () => void };

const chip = "inline-flex h-9 items-center gap-2 rounded-full bg-black/55 px-3.5 text-white backdrop-blur-md transition-colors hover:bg-black/70";

/**
 * Plays a re-cut without rendering it: the original video, clip by clip from the edit list, with the
 * re-cut's captions and end card drawn on top. Time on the chip and scrubber is the re-cut's own.
 */
export function EditPlayer({ src, clips, overlays, durationMs, ref, className }: { src: string; clips: Clip[]; overlays: Overlay[]; durationMs: number; ref?: React.Ref<EditPlayerHandle>; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const at = useRef({ index: 0, clipStart: 0 });

  // Show the first frame of the cut whenever the cut changes (a switch was flipped, or another kind chosen).
  const shape = clips.map((c) => `${c.shot}:${c.inMs}-${c.outMs}`).join(",");
  useEffect(() => {
    const v = video.current;
    if (!v || !clips[0]) return;
    v.pause();
    at.current = { index: 0, clipStart: 0 };
    const show = () => (v.currentTime = clips[0]!.inMs / 1000);
    if (v.readyState >= 1) show();
    else v.addEventListener("loadedmetadata", show, { once: true });
    setTime(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `shape` stands for the clips
  }, [shape]);

  function seekTo(ms: number) {
    const v = video.current;
    if (!v || !clips.length) return;
    const l = locate(clips, Math.min(Math.max(0, ms), durationMs));
    at.current = { index: l.index, clipStart: l.clipStart };
    v.currentTime = l.sourceMs / 1000;
    setTime(Math.min(Math.max(0, ms), durationMs));
  }

  function play(fromMs?: number) {
    const v = video.current;
    if (!v || !clips.length) return;
    if (fromMs !== undefined || time >= durationMs - 50) seekTo(fromMs ?? 0);
    void v.play().catch(() => undefined);
  }

  useImperativeHandle(ref, () => ({ play, pause: () => video.current?.pause() }));

  // While playing: follow the clip, jump to the next at its out point, stop at the end of the cut.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const step = () => {
      const v = video.current;
      if (v) {
        const clip = clips[at.current.index];
        const src = v.currentTime * 1000;
        if (clip && src >= clip.outMs - 25) {
          const next = clips[at.current.index + 1];
          if (next) {
            at.current = { index: at.current.index + 1, clipStart: at.current.clipStart + (clip.outMs - clip.inMs) };
            v.currentTime = next.inMs / 1000;
          } else {
            v.pause();
            setTime(durationMs);
            return;
          }
        } else if (clip) {
          setTime(at.current.clipStart + Math.max(0, src - clip.inMs));
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, clips, durationMs]);

  const showing = overlays.filter((o) => time >= o.atMs && time < o.untilMs);
  const caption = showing.find((o) => o.kind === "caption");
  const endCard = showing.find((o): o is Extract<Overlay, { kind: "endCard" }> => o.kind === "endCard");
  const pct = durationMs ? Math.min(100, (time / durationMs) * 100) : 0;

  return (
    <div
      className={cn("group/player relative aspect-video overflow-hidden rounded-[14px] bg-black outline-none focus-visible:ring-3 focus-visible:ring-ring/50", className)}
      tabIndex={0}
      aria-label="Re-cut player"
      onKeyDown={(e) => {
        if (e.key === " " || e.key.toLowerCase() === "k") {
          e.preventDefault();
          if (playing) video.current?.pause();
          else play();
        }
      }}
    >
      <video
        ref={video}
        src={src}
        playsInline
        preload="auto"
        muted={muted}
        className="size-full cursor-pointer object-contain"
        onClick={() => (playing ? video.current?.pause() : play())}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {caption && (
        <p className="pointer-events-none absolute inset-x-6 bottom-16 mx-auto w-fit max-w-[90%] rounded-lg bg-black/60 px-3.5 py-2 text-center text-[clamp(13px,2.2cqw,18px)] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">{caption.text}</p>
      )}
      {endCard && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl bg-white/92 px-6 py-3.5 text-center text-[#111113] shadow-sm">
            <p className="text-[clamp(18px,3cqw,26px)] font-bold tracking-[-0.02em]">{endCard.brand}</p>
            {endCard.line && <p className="mt-0.5 text-[12.5px] text-[#3f3f46]">{endCard.line}</p>}
          </div>
        </div>
      )}

      <div className="absolute bottom-5 left-4">
        <button type="button" onClick={() => (playing ? video.current?.pause() : play())} className={chip} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <PauseIcon className="size-3.5 fill-white" aria-hidden /> : <PlayIcon className="size-3.5 fill-white" aria-hidden />}
          <span className="font-mono text-[13px] tabular-nums">
            {clock(time)} / {clock(durationMs)}
          </span>
        </button>
      </div>
      <button type="button" onClick={() => setMuted((m) => !m)} className={cn(chip, "absolute right-4 bottom-5 w-9 justify-center px-0")} aria-label={muted ? "Turn sound on" : "Mute"}>
        {muted ? <VolumeXIcon className="size-4" aria-hidden /> : <Volume2Icon className="size-4" aria-hidden />}
      </button>
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20 transition-[height] group-hover/player:h-[5px]">
        <div className="h-full bg-ember" style={{ width: `${pct}%` }} />
        <input
          type="range"
          aria-label="Seek in the re-cut"
          min={0}
          max={Math.max(1, Math.round(durationMs))}
          step={10}
          value={Math.round(time)}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="absolute inset-x-0 -top-2 h-4 w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}
