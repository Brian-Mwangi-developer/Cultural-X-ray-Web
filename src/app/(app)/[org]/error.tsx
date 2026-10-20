"use client";

import { ErrorState } from "@/components/error-state";

export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState error={error} reset={reset} where="route.workspace" title="This part of your workspace didn't load" />;
}
