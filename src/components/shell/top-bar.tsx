import Link from "next/link";
import { Fragment } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/**
 * The 52px bar above every page: where you are, and the page's actions.
 * Below laptop width it also carries the button that opens the sidebar.
 */
export function TopBar({ crumbs, actions, className }: { crumbs: Crumb[]; actions?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("sticky top-0 z-20 flex h-[52px] shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-md lg:px-7", className)}>
      <SidebarTrigger className="-ml-1 lg:hidden" />
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-2 text-[13.5px]">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <Fragment key={`${c.label}-${i}`}>
                {i > 0 && (
                  <li aria-hidden className={cn("text-faint", i <= crumbs.length - 2 && "hidden md:block")}>
                    /
                  </li>
                )}
                <li className={cn("truncate", last ? "font-medium text-foreground" : "text-muted-foreground", i < crumbs.length - 2 && "hidden md:block")}>
                  {c.href && !last ? (
                    <Link href={c.href} className="transition-colors hover:text-foreground">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? "page" : undefined}>{c.label}</span>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Page body: consistent gutters and a readable max width for the dashboards. */
export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1320px] px-4 py-7 md:px-7 lg:px-10 lg:py-9", className)}>{children}</div>;
}
