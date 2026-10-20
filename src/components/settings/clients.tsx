"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreHorizontalIcon, ShieldCheckIcon } from "lucide-react";
import { BrandMark, WideOnly } from "@/components/app/parts";
import { accessText, ClientStatus } from "@/components/views/agency-home";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ClientSummary } from "@/lib/session";
import { cn } from "@/lib/utils";

type Filter = "all" | "connected" | "pending";

export function ClientsTable({ slug, clients }: { slug: string; clients: ClientSummary[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const connected = clients.filter((c) => c.status === "ACTIVE" && c.owner);
  const pending = clients.filter((c) => !(c.status === "ACTIVE" && c.owner));
  const shown = filter === "all" ? clients : filter === "connected" ? connected : pending;

  const chip = (value: Filter, label: string, count: number, dot?: boolean) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px]", filter === value ? "border-foreground/40 bg-card font-medium" : "text-muted-foreground hover:text-foreground")}
    >
      {dot && <span className="size-1.5 rounded-full bg-ember" aria-hidden />}
      {label} <span className="tabular-nums">{count}</span>
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {chip("all", "All", clients.length)}
        {chip("connected", "Connected", connected.length, true)}
        {chip("pending", "Pending", pending.length)}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-[14px] border border-dashed px-5 py-8 text-center text-[14px] text-muted-foreground">
          {clients.length ? "Nothing here with this filter." : "No clients yet. Add one to set up their workspace or connect to it."}
        </p>
      ) : (
        <WideOnly what="The client table">
          <div className="overflow-x-auto rounded-[14px] border bg-card">
            <table className="w-full min-w-[760px] text-left text-[14px]">
              <thead className="bg-muted/60 text-[12.5px] text-muted-foreground">
                <tr className="border-b">
                  <th className="px-5 py-3 font-normal">Client</th>
                  <th className="px-3 py-3 font-normal">Status</th>
                  <th className="px-3 py-3 font-normal">Your access</th>
                  <th className="px-3 py-3 font-normal">Client owner</th>
                  <th className="px-3 py-3 font-normal">Your team</th>
                  <th className="px-3 py-3 font-normal">Billed to</th>
                  <th className="w-12 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-soft">
                {shown.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-[var(--row-y)]">
                      <span className="flex items-center gap-2.5 font-medium">
                        <BrandMark name={c.workspace.name} size="xs" />
                        {c.workspace.name}
                      </span>
                    </td>
                    <td className="px-3">
                      <ClientStatus client={c} />
                    </td>
                    <td className="px-3">{accessText(c)}</td>
                    <td className="max-w-[180px] truncate px-3 text-foreground/85">{c.owner?.name ?? c.claim?.email ?? "—"}</td>
                    <td className="px-3 text-foreground/85">{c.team ? `${c.team} ${c.team === 1 ? "person" : "people"}` : "—"}</td>
                    <td className="px-3 text-muted-foreground">{c.billedTo ?? "—"}</td>
                    <td className="px-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`More for ${c.workspace.name}`} />}>
                          <MoreHorizontalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-[12px] p-1.5">
                          {c.status === "ACTIVE" && (
                            <DropdownMenuItem render={<Link href={`/${slug}/clients/${c.workspace.slug}`} />}>Open Culture Map</DropdownMenuItem>
                          )}
                          <DropdownMenuItem render={<Link href={`/${slug}/settings/danger?disconnect=${c.id}`} />} variant="destructive">
                            Disconnect…
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WideOnly>
      )}

      <div className="flex items-start gap-3 rounded-[14px] border bg-muted/60 px-5 py-4">
        <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-ember" strokeWidth={1.75} aria-hidden />
        <div>
          <p className="text-[14px] font-medium">What a client can always do</p>
          <p className="mt-0.5 text-[13.5px] text-foreground/80">Lower or raise your access, remove your agency, or take over billing. You can&rsquo;t delete a claimed workspace or remove its owner.</p>
        </div>
      </div>
    </div>
  );
}
