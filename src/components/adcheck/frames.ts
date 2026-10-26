"use client";

import { useEffect, useReducer } from "react";

/**
 * Stills from a video, drawn in the browser: the shot strip, the reading screen and the upload
 * preview all show the ad's own frames without storing thumbnails anywhere. Frames are cached for
 * the page's life, so moving between screens doesn't draw them twice.
 */

const cache = new Map<string, string>();
const keyOf = (src: string, ms: number, width: number) => `${src}|${Math.round(ms)}|${width}`;

function once(target: EventTarget, ok: string, timeoutMs = 8000) {
  return new Promise<boolean>((resolve) => {
    const done = (value: boolean) => {
      clearTimeout(timer);
      target.removeEventListener(ok, yes);
      target.removeEventListener("error", no);
      resolve(value);
    };
    const yes = () => done(true);
    const no = () => done(false);
    const timer = setTimeout(() => done(false), timeoutMs);
    target.addEventListener(ok, yes);
    target.addEventListener("error", no);
  });
}

/** One still per time (ms), or null until it's drawn. `src` null draws nothing. */
export function useFrames(src: string | null, times: number[], width = 240): (string | null)[] {
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  const wanted = times.map((t) => Math.max(0, Math.round(t))).join(",");

  useEffect(() => {
    if (!src || !wanted) return;
    const list = wanted.split(",").map(Number);
    const todo = list.filter((t) => !cache.has(keyOf(src, t, width)));
    if (!todo.length) return;
    let cancelled = false;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    // In the page (invisibly): Chrome may not decode new frames for a paused video that isn't.
    video.setAttribute("aria-hidden", "true");
    Object.assign(video.style, { position: "fixed", left: "-9999px", top: "0", width: "2px", height: "2px", opacity: "0", pointerEvents: "none" });
    document.body.appendChild(video);
    video.src = src;

    void (async () => {
      if (video.readyState < 2 && !(await once(video, "loadeddata", 15000))) return;
      const canvas = document.createElement("canvas");
      const ratio = video.videoHeight / video.videoWidth || 9 / 16;
      canvas.width = width;
      canvas.height = Math.round(width * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      for (const t of todo) {
        if (cancelled) return;
        // A hair past the cut, so a shot's still isn't the last frame of the one before.
        video.currentTime = Math.min(Math.max(0, t / 1000), Math.max(0, video.duration - 0.05));
        if (!(await once(video, "seeked"))) continue;
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          cache.set(keyOf(src, t, width), canvas.toDataURL("image/jpeg", 0.72));
        } catch {
          return; // a tainted canvas (shouldn't happen: same origin) just means no stills
        }
        if (!cancelled) redraw();
      }
    })();

    return () => {
      cancelled = true;
      video.removeAttribute("src");
      video.load();
      video.remove();
    };
  }, [src, wanted, width]);

  return times.map((t) => (src ? (cache.get(keyOf(src, Math.max(0, Math.round(t)), width)) ?? null) : null));
}

/** Duration and size of a local file before it's uploaded. */
export function probeFile(file: File): Promise<{ durationMs: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const finish = (value: { durationMs: number; width: number; height: number } | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onloadedmetadata = () => finish(Number.isFinite(video.duration) ? { durationMs: Math.round(video.duration * 1000), width: video.videoWidth, height: video.videoHeight } : null);
    video.onerror = () => finish(null);
    video.src = url;
  });
}
