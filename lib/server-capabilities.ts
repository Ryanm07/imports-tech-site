import { getDatabaseBinding, trustedSitesAuthentication } from "@/db/runtime";

export function privateBackendEnabled() {
  return (
    process.env.ADMIN_ENABLED === "true" &&
    trustedSitesAuthentication &&
    Boolean(getDatabaseBinding())
  );
}
