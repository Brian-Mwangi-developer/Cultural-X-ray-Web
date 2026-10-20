import { CultureReel } from "@/components/auth/culture-reel";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh bg-card lg:grid-cols-[minmax(0,1fr)_minmax(0,1.04fr)]">
      <div className="hidden p-3 lg:block">
        <div className="sticky top-3 h-[calc(100svh-1.5rem)] min-h-155">
          <CultureReel className="h-full" />
        </div>
      </div>

      <main className="relative flex min-h-svh flex-col px-5 py-6 sm:px-10">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center">
          <span />
          <Logo />
          <ThemeToggle className="justify-self-end" />
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-106">{children}</div>
        </div>

        <footer className="text-center text-xs text-muted-foreground">
          Culture data from Qloo&rsquo;s taste graph.
        </footer>
      </main>
    </div>
  );
}
