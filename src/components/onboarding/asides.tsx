import { Building2Icon, HouseIcon, InboxIcon, LinkIcon, MessageSquareIcon, PlusIcon, ShieldCheckIcon } from "lucide-react";
import { BrandMark } from "@/components/app/parts";
import { PanelAside } from "@/components/app/split-shell";
import { ROLE_COPY } from "@/lib/roles";

/** c1: a live preview of the agency's sidebar as they type. */
export function AgencyPreview({ name }: { name: string }) {
  const shown = name.trim() || "Your agency";
  return (
    <PanelAside>
      <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Preview</p>
      <div className="mt-4 grid grid-cols-[0.82fr_1fr] overflow-hidden rounded-[14px] border bg-card shadow-xs">
        <div className="space-y-1 border-r bg-sidebar p-3">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <BrandMark name={shown} tone="ember" size="xs" />
            <span className="truncate text-[13px] font-semibold">{shown}</span>
          </div>
          {[
            { icon: HouseIcon, label: "Home", active: true },
            { icon: InboxIcon, label: "Inbox" },
            { icon: MessageSquareIcon, label: "Ask X-Ray" },
          ].map((item) => (
            <div key={item.label} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] ${item.active ? "border bg-card font-medium" : "text-foreground/80"}`}>
              <item.icon className="size-3.5" strokeWidth={1.75} aria-hidden />
              {item.label}
            </div>
          ))}
          <p className="px-2 pt-4 text-[10.5px] tracking-[0.1em] text-muted-foreground uppercase">Clients</p>
          <div className="space-y-2 px-2 pt-1" aria-hidden>
            <div className="h-1.5 w-4/5 rounded-full bg-soft" />
            <div className="h-1.5 w-3/5 rounded-full bg-soft" />
            <div className="h-1.5 w-2/3 rounded-full bg-soft" />
          </div>
          <div className="h-40" />
        </div>
        <div className="p-5">
          <p className="text-[17px] font-semibold tracking-[-0.02em]">No clients yet</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">Add your first client in step 3, or later from Home.</p>
          <span className="mt-4 inline-flex h-7 items-center gap-1.5 rounded-full bg-ember px-3 text-[12px] font-semibold text-white">
            <PlusIcon className="size-3" strokeWidth={2.5} aria-hidden />
            Add client
          </span>
        </div>
      </div>
      <ul className="mt-6 space-y-2.5 text-[14px]">
        {[
          { icon: Building2Icon, text: "Your agency holds your team and your pooled Qloo queries." },
          { icon: LinkIcon, text: "Clients own their workspaces. You connect at the access they grant." },
          { icon: ShieldCheckIcon, text: "If a client leaves, they keep everything and your access ends." },
        ].map((point) => (
          <li key={point.text} className="flex items-start gap-3">
            <point.icon className="mt-0.5 size-4 shrink-0 text-ember" strokeWidth={1.75} aria-hidden />
            {point.text}
          </li>
        ))}
      </ul>
    </PanelAside>
  );
}

/** c2: who can do what. */
export function RolesAside() {
  const rows = (["owner", "admin", "strategist", "viewer"] as const).map((r) => ({ role: ROLE_COPY[r].label, can: ROLE_COPY[r].can }));
  return (
    <PanelAside>
      <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Roles</p>
      <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.03em]">Who can do what</h2>
      <dl className="mt-5 divide-y rounded-[14px] border bg-card">
        {rows.map((row) => (
          <div key={row.role} className="grid grid-cols-[110px_1fr] gap-4 px-5 py-4">
            <dt className="text-[14px] font-semibold">{row.role}</dt>
            <dd className="text-[13.5px] leading-relaxed text-foreground/80">{row.can}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 flex items-start gap-3 text-[13.5px] leading-relaxed text-foreground/80">
        <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-ember" strokeWidth={1.75} aria-hidden />
        Agency roles never exceed the access a client grants. A Strategist on a client that gave you View access can only view.
      </p>
    </PanelAside>
  );
}

/** Agency step 3: how client ownership works. */
export function ClientsAside() {
  const steps = [
    { n: "01", title: "You set it up", body: "Brand, rivals and market. We build the first map while you wait." },
    { n: "02", title: "Held in trust", body: "Your agency looks after it and pays for it until the client claims it." },
    { n: "03", title: "They claim it", body: "One email. They become the owner and choose your access." },
    { n: "04", title: "They keep everything", body: "If you part ways, every map and brief stays with them." },
  ];
  return (
    <PanelAside>
      <p className="text-[11.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">How clients work</p>
      <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-balance">The brand owns the workspace. You&rsquo;re a trusted guest.</h2>
      <ol className="mt-6 space-y-3">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-4 rounded-[14px] border bg-card px-5 py-4">
            <span className="font-mono text-[12px] text-ember-ink">{s.n}</span>
            <span>
              <span className="block text-[14px] font-semibold">{s.title}</span>
              <span className="mt-0.5 block text-[13px] leading-relaxed text-muted-foreground">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </PanelAside>
  );
}
