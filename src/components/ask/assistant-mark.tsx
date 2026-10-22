import { cn } from "@/lib/utils";

/** Ask X-Ray's mark: the product's lens with two waves (board X0, option A). Draws in currentColor. */
export function AssistantGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn("size-4", className)}>
      <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6.6 14.2c1.8-1.3 3.6-1.3 5.4 0s3.6 1.3 5.4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6.6 10.4c1.8-1.3 3.6-1.3 5.4 0s3.6 1.3 5.4 0" stroke="currentColor" strokeOpacity=".55" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** The assistant's avatar in a conversation: white mark on an ember disc. */
export function AssistantAvatar({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-ember text-white", className)} style={{ width: size, height: size }} aria-hidden>
      <AssistantGlyph className="size-[68%]" />
    </span>
  );
}
