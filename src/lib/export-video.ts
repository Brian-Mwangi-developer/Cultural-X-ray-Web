import type { Clip, Format, Overlay } from "@/lib/recut";

/**
 * Export (Figma 11 · R8): a version of an ad made into an MP4 on the person's own computer, with
 * Mediabunny and the browser's encoder (WebCodecs). Nothing is uploaded and nothing is rendered on our
 * side. Each clip of the draft is drawn onto a canvas of the chosen shape, cropped where the clip says,
 * with its caption and the end card drawn on top exactly as the players show them.
 */

export const SIZE: Record<Format, { width: number; height: number }> = { "9:16": { width: 1080, height: 1920 }, "16:9": { width: 1920, height: 1080 }, "1:1": { width: 1080, height: 1080 } };

export class ExportUnsupported extends Error {}

/** Whether this browser can make MP4s at all (WebCodecs with H.264). Checked before offering export. */
export async function canExport(format: Format = "9:16") {
  if (typeof window === "undefined" || typeof VideoEncoder === "undefined") return false;
  const { canEncodeVideo } = await import("mediabunny");
  return canEncodeVideo("avc", SIZE[format]).catch(() => false);
}

export type RenderJob = {
  source: Blob;
  clips: Clip[];
  overlays: Overlay[];
  durationMs: number;
  format: Format;
  sound: "original" | "mute";
  title: string;
  onProgress?: (share: number) => void;
  signal?: AbortSignal;
};

/** The app's own font for captions, so the file looks like the preview. */
const fontFamily = () => (typeof document === "undefined" ? "system-ui" : getComputedStyle(document.body).fontFamily || "system-ui");

function roundRect(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Wrap words into lines that fit `max` pixels. */
function lines(ctx: OffscreenCanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

function drawOverlays(ctx: OffscreenCanvasRenderingContext2D, overlays: Overlay[], ms: number, W: number, H: number, font: string) {
  const unit = Math.min(W, H) / 1080;
  for (const o of overlays) {
    if (ms < o.atMs || ms >= o.untilMs) continue;
    if (o.kind === "caption") {
      ctx.font = `600 ${Math.round(52 * unit)}px ${font}`;
      const text = o.text.toUpperCase();
      const rows = lines(ctx, text, W * 0.8);
      const lineH = Math.round(66 * unit);
      const padX = Math.round(36 * unit), padY = Math.round(22 * unit);
      const boxW = Math.max(...rows.map((r) => ctx.measureText(r).width)) + padX * 2;
      const boxH = rows.length * lineH + padY * 2;
      const y = o.position === "top" ? H * 0.08 : o.position === "middle" ? (H - boxH) / 2 : H * 0.86 - boxH;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      roundRect(ctx, (W - boxW) / 2, y, boxW, boxH, 18 * unit);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      rows.forEach((r, i) => ctx.fillText(r, W / 2, y + padY + lineH * i + lineH / 2));
    } else {
      ctx.font = `700 ${Math.round(78 * unit)}px ${font}`;
      const brandW = ctx.measureText(o.brand).width;
      ctx.font = `400 ${Math.round(36 * unit)}px ${font}`;
      const lineW = o.line ? ctx.measureText(o.line).width : 0;
      const boxW = Math.min(W * 0.9, Math.max(brandW, lineW) + 120 * unit);
      const boxH = (o.line ? 200 : 140) * unit;
      const x = (W - boxW) / 2, y = (H - boxH) / 2;
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      roundRect(ctx, x, y, boxW, boxH, 28 * unit);
      ctx.fill();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#111113";
      ctx.font = `700 ${Math.round(78 * unit)}px ${font}`;
      ctx.fillText(o.brand, W / 2, y + (o.line ? 78 : 70) * unit);
      if (o.line) {
        ctx.fillStyle = "#3f3f46";
        ctx.font = `400 ${Math.round(36 * unit)}px ${font}`;
        ctx.fillText(o.line, W / 2, y + 150 * unit, boxW - 60 * unit);
      }
    }
  }
}

/** The draft's sound for the kept clips, one after another. Null when it has none or can't be decoded. */
async function soundOf(source: Blob, clips: Clip[]): Promise<AudioBuffer | null> {
  let full: AudioBuffer;
  try {
    const ctx = new OfflineAudioContext(2, 1, 48_000);
    full = await ctx.decodeAudioData(await source.arrayBuffer());
  } catch {
    return null;
  }
  const rate = full.sampleRate;
  const channels = Math.min(2, full.numberOfChannels);
  const lengths = clips.map((c) => Math.round(((c.outMs - c.inMs) / 1000) * rate));
  const out = new AudioBuffer({ length: Math.max(1, lengths.reduce((a, b) => a + b, 0)), numberOfChannels: channels, sampleRate: rate });
  for (let ch = 0; ch < channels; ch++) {
    const from = full.getChannelData(ch);
    const to = out.getChannelData(ch);
    let at = 0;
    clips.forEach((c, i) => {
      const start = Math.round((c.inMs / 1000) * rate);
      to.set(from.subarray(start, start + lengths[i]!), at);
      at += lengths[i]!;
    });
  }
  return out;
}

export async function renderMp4(job: RenderJob): Promise<Blob> {
  const { Input, ALL_FORMATS, BlobSource, VideoSampleSink, Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource, Quality, canEncodeVideo, canEncodeAudio } = await import("mediabunny");
  const { width: W, height: H } = SIZE[job.format];
  if (!(await canEncodeVideo("avc", { width: W, height: H }))) throw new ExportUnsupported("This browser can’t make MP4 files. Try Chrome, Edge or Safari on a computer.");

  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(job.source) });
  const track = await input.getPrimaryVideoTrack();
  if (!track || !(await track.canDecode())) throw new ExportUnsupported("This browser can’t read the draft’s video.");
  const sink = new VideoSampleSink(track);
  const srcW = track.displayWidth, srcH = track.displayHeight;

  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext("2d")!;
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
  const video = new CanvasSource(canvas, { codec: "avc", bitrate: new Quality("high") });
  output.addVideoTrack(video, { frameRate: 30 });

  const sound = job.sound === "mute" ? null : await soundOf(job.source, job.clips);
  const audio = sound && (await canEncodeAudio("aac", { numberOfChannels: sound.numberOfChannels, sampleRate: sound.sampleRate })) ? new AudioBufferSource({ codec: "aac", bitrate: new Quality("high") }) : null;
  if (audio) output.addAudioTrack(audio);
  output.setMetadataTags({ title: job.title });
  await output.start();

  const font = fontFamily();
  const scale = Math.max(W / srcW, H / srcH);
  let t = 0; // where this clip starts in the new video, ms
  let last = -1; // last timestamp written, s: frames must keep moving forward
  try {
    for (const clip of job.clips) {
      // Cover the canvas, the visible window placed where the clip says.
      const sw = W / scale, sh = H / scale;
      const sx = (srcW - sw) * (clip.cropX ?? 0.5);
      const sy = (srcH - sh) * (clip.cropY ?? 0.5);
      for await (const sample of sink.samples(clip.inMs / 1000, clip.outMs / 1000)) {
        try {
          if (job.signal?.aborted) throw new DOMException("Stopped", "AbortError");
          const local = Math.max(0, sample.timestamp * 1000 - clip.inMs);
          if (local >= clip.outMs - clip.inMs) continue;
          const at = (t + local) / 1000;
          if (at <= last) continue;
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, W, H);
          sample.draw(ctx, sx, sy, sw, sh, 0, 0, W, H);
          drawOverlays(ctx, job.overlays, t + local, W, H, font);
          await video.add(at, Math.min(sample.duration || 1 / 30, (t + clip.outMs - clip.inMs) / 1000 - at));
          last = at;
          job.onProgress?.(Math.min(0.97, (t + local) / job.durationMs));
        } finally {
          sample.close();
        }
      }
      t += clip.outMs - clip.inMs;
    }
    if (audio && sound) await audio.add(sound);
    await output.finalize();
  } catch (error) {
    await output.cancel().catch(() => undefined);
    throw error;
  } finally {
    input.dispose?.();
  }
  job.onProgress?.(1);
  return new Blob([output.target.buffer!], { type: "video/mp4" });
}
