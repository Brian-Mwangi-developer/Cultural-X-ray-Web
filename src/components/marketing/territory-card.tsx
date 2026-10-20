import { cn } from "@/lib/utils";

export type Territory = "yours" | "contested" | "theirs";

const LABEL: Record<Territory, string> = {
  yours: "Yours",
  contested: "Contested",
  theirs: "Theirs",
};

/** Territory is a glyph plus a word: filled, half, empty. */
export function TerritoryGlyph({ kind, className }: { kind: Territory; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className={cn("size-3 shrink-0", className)}>
      {kind === "yours" && <circle cx="6" cy="6" r="5" fill="var(--ember)" />}
      {kind === "contested" && (
        <>
          <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6 1.6a4.4 4.4 0 0 1 0 8.8Z" fill="currentColor" />
        </>
      )}
      {kind === "theirs" && <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.2" />}
    </svg>
  );
}

export function TerritoryLabel({ kind }: { kind: Territory }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
      <TerritoryGlyph kind={kind} />
      {LABEL[kind]}
    </span>
  );
}

type Columns = Record<Territory, string[]>;

export function TerritoryColumns({ columns, className }: { columns: Columns; className?: string }) {
  return (
    <div className={cn("grid grid-cols-3 divide-x", className)}>
      {(Object.keys(LABEL) as Territory[]).map((kind) => (
        <div key={kind} className="min-w-0 px-4 py-4 first:pl-5 last:pr-5">
          <TerritoryLabel kind={kind} />
          <ul className="mt-3 space-y-2">
            {columns[kind].map((item) => (
              <li key={item} className="text-[13.5px] leading-snug text-pretty">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const TABS = ["Podcasts", "Films", "TV", "Creators", "Places"];

/** The floating product card in the hero. Data from the Patagonia vs The North Face lab (plan §9). */
export function TerritoryCard({ className }: { className?: string }) {
  return (
    <figure
      aria-label="A Culture Map for Patagonia against The North Face, podcasts tab"
      className={cn(
        "overflow-hidden rounded-2xl bg-card text-card-foreground shadow-[0_40px_80px_-40px_rgb(0_0_0/0.55)] ring-1 ring-black/5 dark:ring-white/10", // ui-ok: neutral depth over a photograph
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b bg-muted/40 px-5 py-3.5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">Culture Map · US</p>
          <p className="mt-0.5 truncate text-[15px] font-medium">
            Patagonia <span className="font-heading font-semibold text-muted-foreground">vs</span> The North Face
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className="size-2 rounded-full bg-ember" aria-hidden />
          Mainstream tier
        </span>
      </div>

      <div className="flex gap-1 overflow-hidden border-b px-3 text-[13px]" role="presentation">
        {TABS.map((t, i) => (
          <span
            key={t}
            className={cn(
              "relative px-2.5 py-2.5",
              i === 0 ? "font-medium text-foreground after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground" : "text-muted-foreground",
            )}
          >
            {t}
          </span>
        ))}
      </div>

      <TerritoryColumns
        columns={{
          yours: ["10% Happier", "The Peter Attia Drive"],
          contested: ["Rich Roll", "Tim Ferriss"],
          theirs: ["Jocko", "The Mark Divine Show"],
        }}
      />

      <figcaption className="border-t px-5 py-3.5 text-[15px] leading-snug text-muted-foreground">
        Environment and wellbeing, against toughness and survival.
      </figcaption>
    </figure>
  );
}
