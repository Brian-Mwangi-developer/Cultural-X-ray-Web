import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export type Membership = {
  id: string;
  name: string;
  slug: string;
  kind: "AGENCY" | "WORKSPACE";
  logo: string | null;
  role: string;
  allClients: boolean;
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  activeOrganizationId: string | null;
  memberships: Membership[];
};

/** The signed-in user from the backend, or a redirect to /login. Call inside a Suspense boundary. */
export async function requireUser(): Promise<CurrentUser> {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetch(`${backendUrl}/api/v1/me`, { headers: { cookie }, cache: "no-store" });

  if (res.status === 401) redirect("/login");
  if (!res.ok) throw new Error(`Backend /api/v1/me failed with ${res.status}`);

  const body = (await res.json()) as {
    user: Omit<CurrentUser, "activeOrganizationId" | "memberships">;
    activeOrganizationId: string | null;
    memberships: Membership[];
  };
  return { ...body.user, activeOrganizationId: body.activeOrganizationId, memberships: body.memberships };
}
