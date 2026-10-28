import { api } from "@/lib/api";
import { screenNow } from "@/lib/ask";

/**
 * Talk to X-Ray in the browser (Figma 22). The mic is captured at 16 kHz as 16-bit PCM and streamed to
 * our API's voice socket (backend voice.relay.ts), which talks to Gemini Live; the spoken answer
 * comes back as 24 kHz PCM and is played in order, and stops at once when the person cuts in.
 * Nothing is recorded here: audio only ever flows through.
 */

export type VoiceEvent =
  | { type: "ready"; secondsLeft: number }
  | { type: "you"; text: string }
  | { type: "say"; text: string }
  | { type: "turn" }
  | { type: "interrupted" }
  | { type: "tool"; name: string }
  | { type: "do"; tool: string; input: unknown; output: unknown }
  | { type: "remembered"; output: unknown }
  | { type: "end"; reason?: string }
  | { type: "level"; value: number }
  | { type: "speaking"; on: boolean };

export type VoiceControls = { stop: () => void; mute: (on: boolean) => void; screen: () => void };

// Runs on the audio thread: Float32 at 16 kHz → 16-bit PCM in 100 ms chunks, plus a level for the meter.
const WORKLET = `
class Mic extends AudioWorkletProcessor {
  constructor() { super(); this.buf = new Int16Array(1600); this.n = 0; this.sum = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      const s = Math.max(-1, Math.min(1, ch[i]));
      this.buf[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      this.sum += s * s;
      if (this.n === this.buf.length) {
        this.port.postMessage({ pcm: this.buf.buffer.slice(0), level: Math.sqrt(this.sum / this.n) });
        this.n = 0; this.sum = 0;
      }
    }
    return true;
  }
}
registerProcessor("xray-mic", Mic);`;

const toBase64 = (buf: ArrayBuffer) => {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

export async function startVoice(orgId: string, on: (e: VoiceEvent) => void): Promise<VoiceControls> {
  // The mic first: the browser's prompt can take a while, and the ticket only lasts a minute.
  const mic = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  let url: string;
  try {
    ({ url } = await api<{ url: string; secondsLeft: number }>(`/orgs/${orgId}/voice/ticket`, { method: "POST" }));
  } catch (error) {
    mic.getTracks().forEach((t) => t.stop());
    throw error;
  }

  const input = new AudioContext({ sampleRate: 16000 });
  const output = new AudioContext({ sampleRate: 24000 });
  const module = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
  await input.audioWorklet.addModule(module);
  URL.revokeObjectURL(module);
  const node = new AudioWorkletNode(input, "xray-mic");
  input.createMediaStreamSource(mic).connect(node);

  const ws = new WebSocket(url);
  let muted = false;
  let ended = false;
  let ready = false;

  // Playback: chunks queue back to back; cutting in stops them all.
  let at = 0;
  const playing = new Set<AudioBufferSourceNode>();
  const play = (b64: string) => {
    const raw = atob(b64);
    const pcm = new Int16Array(raw.length / 2);
    for (let i = 0; i < pcm.length; i++) pcm[i] = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
    const buffer = output.createBuffer(1, pcm.length, 24000);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) data[i] = pcm[i]! / 0x8000;
    const src = output.createBufferSource();
    src.buffer = buffer;
    src.connect(output.destination);
    at = Math.max(at, output.currentTime + 0.02);
    src.start(at);
    at += buffer.duration;
    if (!playing.size) on({ type: "speaking", on: true });
    playing.add(src);
    src.onended = () => {
      playing.delete(src);
      if (!playing.size) on({ type: "speaking", on: false });
    };
  };
  const silence = () => {
    for (const s of playing) s.stop();
    playing.clear();
    at = 0;
    on({ type: "speaking", on: false });
  };

  node.port.onmessage = (e: MessageEvent<{ pcm: ArrayBuffer; level: number }>) => {
    on({ type: "level", value: muted ? 0 : e.data.level });
    if (!muted && ready && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "audio", data: toBase64(e.data.pcm) }));
  };

  const sendScreen = () => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: "screen", screen: screenNow() }));
  const teardown = () => {
    if (ended) return;
    ended = true;
    silence();
    mic.getTracks().forEach((t) => t.stop());
    node.disconnect();
    void input.close();
    void output.close();
  };

  ws.onopen = sendScreen;
  ws.onmessage = (e) => {
    const m = JSON.parse(String(e.data)) as VoiceEvent & { data?: string };
    if (m.type === "ready") ready = true;
    if (m.type === ("audio" as string) && m.data) return play(m.data);
    if (m.type === "interrupted") silence();
    on(m);
  };
  ws.onclose = () => {
    teardown();
    // Closed before it was ever ready: say so, rather than quietly going back to the bar.
    on(ready ? { type: "end" } : { type: "end", reason: "Couldn’t start talking just now. Try again, or type to Ask X-Ray." });
  };

  return {
    stop: () => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "stop" }));
      ws.close();
      teardown();
    },
    mute: (m) => {
      muted = m;
      if (m && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "pause" }));
    },
    screen: sendScreen,
  };
}
