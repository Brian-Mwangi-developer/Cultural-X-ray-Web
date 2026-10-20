import { LockIcon } from "lucide-react";
import { TopBar } from "@/components/shell/top-bar";
import { cn } from "@/lib/utils";

/** Every settings page: breadcrumb bar, title and one line of context, then sections. */
export function SettingsPage({
  slug,
  title,
  description,
  actions,
  children,
  wide,
}: {
  slug: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <>
      <TopBar crumbs={[{ label: "Settings", href: `/${slug}/settings/general` }, { label: title }]} actions={actions} />
      <div className={cn("w-full px-4 py-8 md:px-8 lg:px-14 lg:py-11", wide ? "max-w-[1180px]" : "max-w-[960px]")}>
        <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.03em] lg:text-[34px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
        <div className="mt-8 space-y-10">{children}</div>
      </div>
    </>
  );
}

export function SettingsSection({ title, description, children, action }: { title: string; description?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.015em]">{title}</h2>
          {description && <p className="mt-0.5 text-[13.5px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** c5 row: what the setting is on the left, its control on the right, a hairline between. */
export function SettingRow({ label, description, children, htmlFor }: { label: string; description?: React.ReactNode; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-3 border-b py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="text-[14.5px] font-medium">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Shown to members who can see a setting but not change it. */
export function ReadOnlyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 rounded-[12px] border border-dashed px-4 py-3 text-[13.5px] text-muted-foreground">
      <LockIcon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      {children}
    </p>
  );
}
