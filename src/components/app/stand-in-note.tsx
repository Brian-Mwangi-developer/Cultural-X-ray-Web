import { InfoIcon } from "lucide-react";
import { type Basis, lookalike } from "@/lib/basis";
import { cn } from "@/lib/utils";

const names = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

/**
 * Said wherever a map is read through brands like this one, because Qloo doesn't know the brand yet.
 * Without it, "what your customers watch" for a brand nobody has heard of reads as made up.
 */
export function StandInNote({ basis, brand, className }: { basis: Basis | null | undefined; brand: string; className?: string }) {
  if (!lookalike(basis)) return null;
  return (
    <p className={cn("flex items-start gap-2.5 rounded-[14px] border bg-muted/60 px-4 py-3 text-[13.5px] leading-relaxed", className)}>
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span>
        <span className="font-medium">Qloo doesn’t know {brand} yet, so this reads {names(basis.through)} customers instead.</span>{" "}
        They stand in for the customers you’re after: what they already watch, follow and visit points to openings worth testing. It isn’t a record of your own customers.
      </span>
    </p>
  );
}
