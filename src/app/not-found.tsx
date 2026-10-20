import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-background px-6 py-6">
      <header>
        <Logo />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-mono text-xs tracking-wide text-muted-foreground">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Nothing at this address</h1>
        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          The link may be old, or the workspace may have moved. If someone sent it to you, ask them for a fresh one.
        </p>
        <Link href="/dashboard" className={buttonVariants({ size: "pill", className: "mt-6" })}>
          Go to dashboard
        </Link>
      </main>
    </div>
  );
}
