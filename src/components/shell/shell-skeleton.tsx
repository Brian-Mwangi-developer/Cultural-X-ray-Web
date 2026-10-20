import { Skeleton } from "@/components/ui/skeleton";

/** What the app looks like while the workspace loads: the same frame, quietly empty. */
export function ShellSkeleton() {
  return (
    <div className="flex min-h-svh" aria-busy="true" aria-label="Loading your workspace">
      <div className="hidden w-[16.5rem] shrink-0 flex-col gap-3 bg-sidebar p-3.5 lg:flex">
        <div className="flex items-center gap-2.5 p-1.5">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-9 rounded-[10px]" />
        <div className="mt-2 space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 rounded-[10px]" />
          ))}
        </div>
        <div className="mt-auto space-y-2">
          <Skeleton className="h-[78px] rounded-[12px]" />
          <Skeleton className="h-[50px] rounded-[12px]" />
        </div>
      </div>
      <div className="flex-1 border-l">
        <div className="h-[52px] border-b" />
        <div className="mx-auto max-w-[1320px] space-y-4 px-4 py-9 md:px-7 lg:px-10">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-9 w-2/3 max-w-xl" />
          <div className="grid gap-4 pt-4 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 rounded-[14px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
