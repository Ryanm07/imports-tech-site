import { env } from "cloudflare:workers";

// Vinext runs inside the Sites/Cloudflare worker and receives a real D1 binding.
// Native Next.js replaces this module with runtime-node.ts at build time.
export function getDatabaseBinding(): D1Database | undefined {
  return env.DB;
}

export const trustedSitesAuthentication = true;
