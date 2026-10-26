"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { PauseIcon, PlayIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { clock } from "@/lib/ads";
import { cn } from "@/lib/utils";

export type PlayerHandle = { seek: (ms: number, play?: boolean) => void };

const chip = "inline-flex h-9 items-center gap-2 rounded-full bg-black/55 px-3.5 text-white backdrop-blur-md transition-colors hover:bg-black/70";

/**
 * The ad, with quiet chrome over it: a play chip with the time, mute, and a scrubber along the
 * bottom edge. Space or K plays and pauses, arrows step 5 s. `onTime` reports the playhead smoothly
 * (every frame while playing), for the shot strip and the timeline.
 */
export function Player({
  src,
  ref,
  label,
  onTime,
  className,
  rounded = "rounded-[16px]",
}: {
  src: string;
  ref?: React.Ref<PlayerHandle>;
  label?: (ms: number) => React.ReactNode;
  onTime?: (ms: number) => void;
  className?: string;
  rounded?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [broken, setBroken] = useState(false);
  const report = useRef(onTime);
  useEffect(() => {
    report.current = onTime;
  });

  useImperativeHandle(ref, () => ({
    seek(ms, play) {
      const v = video.current;
      if (!v) return;
      v.currentTime = ms / 1000;
      setTime(ms);
      report.current?.(ms);
      if (play) void v.play().catch(() => undefined);
    },
  }));

  // A smooth playhead while playing; timeupdate alone ticks only about four times a second.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const step = () => {
      const v = video.current;
      if (v) {
        const ms = v.currentTime * 1000;
        setTime(ms);
        report.current?.(ms);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
  };
  const jump = (deltaS: number) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + deltaS), v.duration || 0);
    setTime(v.currentTime * 1000);
    report.current?.(v.currentTime * 1000);
  };

  const pct = duration ? Math.min(100, (time / duration) * 100) : 0;

  return (
    <div
      className={cn("group/player relative aspect-video overflow-hidden bg-black outline-none focus-visible:ring-3 focus-visible:ring-ring/50", rounded, className)}
      tabIndex={0}
      aria-label="Ad player"
      onKeyDown={(e) => {
        if (e.key === " " || e.key.toLowerCase() === "k") {
          e.preventDefault();
          toggle();
        } else if (e.key === "ArrowRight") jump(5);
        else if (e.key === "ArrowLeft") jump(-5);
        else if (e.key.toLowerCase() === "m") setMuted((m) => !m);
      }}
    >
      <video
        ref={video}
        src={src}
        playsInline
        preload="metadata"
        muted={muted}
        className="size-full cursor-pointer object-contain"
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration * 1000)}
        onTimeUpdate={(e) => {
          if (playing) return;
          setTime(e.currentTarget.currentTime * 1000);
          report.current?.(e.currentTarget.currentTime * 1000);
        }}
        onError={() => setBroken(true)}
      />

      {broken && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-center">
          <p className="max-w-xs text-[13.5px] text-muted-foreground">This video won’t play here. The reading below doesn’t need it.</p>
        </div>
      )}

      {label && !broken && <div className="pointer-events-none absolute top-4 left-4 max-w-[70%]">{label(time)}</div>}

      {!broken && (
        <>
          <div className="absolute bottom-5 left-4 flex items-center gap-2">
            <button type="button" onClick={toggle} className={chip} aria-label={playing ? "Pause" : "Play"}>
              {playing ? <PauseIcon className="size-3.5 fill-white" aria-hidden /> : <PlayIcon className="size-3.5 fill-white" aria-hidden />}
              <span className="font-mono text-[13px] tabular-nums">
                {clock(time)} / {clock(duration)}
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
              aria-label="Seek"
              min={0}
              max={Math.max(1, Math.round(duration))}
              step={10}
              value={Math.round(time)}
              onChange={(e) => {
                const v = video.current;
                if (!v) return;
                v.currentTime = Number(e.target.value) / 1000;
                setTime(Number(e.target.value));
                report.current?.(Number(e.target.value));
              }}
              className="absolute inset-x-0 -top-2 h-4 w-full cursor-pointer opacity-0"
            />
          </div>
        </>
      )}
    </div>
  );
}

/** A dark chip over the video ("Shot 2 · Retro diner counter"). */
export function OverlayChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-[30px] max-w-full items-center gap-1.5 truncate rounded-full bg-black/55 px-3 text-[12.5px] font-medium text-white backdrop-blur-md", className)}>{children}</span>;
}
