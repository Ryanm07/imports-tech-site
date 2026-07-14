export function parseOwnerEmails(value: string | undefined) {
  return new Set(
    (value || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isConfiguredOwnerEmail(
  email: string,
  ownerEmails = process.env.OWNER_EMAILS,
) {
  return parseOwnerEmails(ownerEmails).has(email.trim().toLowerCase());
}

// Owner recovery is always driven by OWNER_EMAILS. No application action may
// remove, demote or block the configured owner.
export function canTargetOwnerAccount() {
  return false;
}

export const PUBLIC_OWNER = {
  displayName: "Ryan — Imports Tech",
  isOfficial: true as const,
};

export async function ownerRateLimitIdentity(ownerId: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`owner:${ownerId}`),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
