import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Plain GET form: hands the email to /signup, works without JavaScript. */
export function EmailCapture({ className, id = "hero-email" }: { className?: string; id?: string }) {
  return (
    <form action="/signup" className={cn("flex w-full max-w-[30rem] flex-col gap-2 sm:flex-row", className)}>
      <label htmlFor={id} className="sr-only">
        Work email
      </label>
      <div className="flex flex-1 items-center rounded-full bg-white/12 p-1.5 ring-1 ring-white/25 backdrop-blur-md transition-shadow ring-inset focus-within:ring-white/60">
        <input
          id={id}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Work email"
          className="h-10 min-w-0 flex-1 bg-transparent pr-2 pl-4 text-[15px] text-white outline-none placeholder:text-white/60"
        />
        <button
          type="submit"
          className="group inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4.5 text-[14px] font-medium text-neutral-900 transition-[background-color,transform] duration-150 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 active:scale-[0.97]"
        >
          Map my brand
          <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.75} />
        </button>
      </div>
    </form>
  );
}
