import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { ac, roles } from "@/lib/roles";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
  plugins: [
    organizationClient({
      ac,
      roles,
      schema: {
        organization: {
          additionalFields: {
            kind: { type: "string", required: true },
            hqCountry: { type: "string", required: false },
            teamSize: { type: "string", required: false },
            billingEmail: { type: "string", required: false },
          },
        },
        member: { additionalFields: { allClients: { type: "boolean", required: false } } },
        invitation: { additionalFields: { allClients: { type: "boolean", required: false } } },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
