import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#modes", label: "Owners & agencies" },
];

/** Sits over the hero photo, so it is always light-on-dark. */
export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="flex h-20 items-center justify-between gap-6 px-5 text-white sm:px-8">
        <Logo className="text-white" />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-[14px] text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle className="text-white/80 hover:bg-white/10 hover:text-white" />
          <Link
            href="/login"
            className="hidden rounded-full px-3.5 py-2 text-[14px] text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center rounded-full bg-white px-4.5 text-[14px] font-medium text-neutral-900 transition-[background-color,transform] duration-150 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 active:scale-[0.97]"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
