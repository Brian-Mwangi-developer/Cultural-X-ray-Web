import { Skeleton } from "@/components/ui/skeleton";

/** A page loading inside the shell: top bar, title, then content blocks. */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="h-[52px] border-b" />
      <div className="mx-auto max-w-[1320px] space-y-4 px-4 py-9 md:px-7 lg:px-10">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-2/3 max-w-xl" />
        <div className="grid gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-[14px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
