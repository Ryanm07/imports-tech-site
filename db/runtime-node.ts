// Node/Vercel has no Cloudflare bindings or Sites authentication proxy.
// Public versioned content remains available; database operations fail closed.
export function getDatabaseBinding(): D1Database | undefined {
  return undefined;
}

export const trustedSitesAuthentication = false;
