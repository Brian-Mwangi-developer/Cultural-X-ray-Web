"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckIcon, CopyIcon, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { youtubeThumb } from "@/lib/plays";
import { cn } from "@/lib/utils";

/*
 * Creators' content, drawn by each platform's own embed in the viewer's browser. Nothing is copied
 * or stored. Embeds load only when asked for, so a page of creators doesn't load a page of players.
 */

/** A YouTube video: its thumbnail until clicked, then the privacy-enhanced player. */
export function YouTubeEmbed({ id, title, className }: { id: string; title: string; className?: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className={cn("relative aspect-video overflow-hidden bg-black", className)}>
      {on ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full"
        />
      ) : (
        <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 size-full" aria-label={`Play “${title}”`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail */}
          <img src={youtubeThumb(id).replace("mqdefault", "hqdefault")} alt="" className="absolute inset-0 size-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform group-hover:scale-105">
              <PlayIcon className="size-6 translate-x-px fill-current" aria-hidden />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

let tiktokScript: Promise<void> | null = null;
function loadTikTok() {
  tiktokScript ??= new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://www.tiktok.com/embed.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
  return tiktokScript;
}

/** TikTok's official creator-profile embed (followers, likes, recent videos), drawn by TikTok. */
export function TikTokProfile({ handle }: { handle: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on || !box.current) return;
    box.current.innerHTML = `<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@${handle}" data-unique-id="${handle}" data-embed-type="creator" style="max-width:780px;min-width:288px;margin:0"><section><a target="_blank" rel="noopener" href="https://www.tiktok.com/@${handle}">@${handle}</a></section></blockquote>`;
    // The script draws every blockquote on the page; asking again redraws after a client navigation.
    void loadTikTok().then(() => (window as unknown as { tiktokEmbed?: { lib?: { render?: (els: Element[]) => void } } }).tiktokEmbed?.lib?.render?.([...box.current!.children]));
  }, [on, handle]);
  if (!on)
    return (
      <Button variant="outline" size="sm" onClick={() => setOn(true)} className="w-full">
        Show their TikTok here
      </Button>
    );
  return <div ref={box} className="min-h-[300px] overflow-hidden rounded-[10px] [&_blockquote]:!my-0" />;
}

export function CopyButton({ text, label = "Copy", done = "Copied", className, iconOnly }: { text: string; label?: string; done?: string; className?: string; iconOnly?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("Couldn’t copy. Select the text and copy it yourself.");
    }
  }
  const Icon = copied ? CheckIcon : CopyIcon;
  return iconOnly ? (
    <Button variant="outline" size="icon" className={cn("size-8 rounded-full", className)} onClick={copy} aria-label={copied ? done : label}>
      <Icon className="size-3.5" />
    </Button>
  ) : (
    <Button variant="outline" size="pill" className={className} onClick={copy}>
      <Icon data-icon="inline-start" />
      {copied ? done : label}
    </Button>
  );
}
