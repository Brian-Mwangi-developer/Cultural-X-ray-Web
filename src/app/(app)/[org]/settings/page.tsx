import { Suspense } from "react";
import { redirect } from "next/navigation";

export default function SettingsIndex({ params }: PageProps<"/[org]/settings">) {
  return (
    <Suspense>
      <Go params={params} />
    </Suspense>
  );
}

async function Go({ params }: { params: PageProps<"/[org]/settings">["params"] }): Promise<null> {
  const { org } = await params;
  redirect(`/${org}/settings/general`);
}
