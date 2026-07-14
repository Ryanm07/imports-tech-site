export const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie, Authorization, OAI-Authenticated-User-Email",
};

export function privateJson(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      ...PRIVATE_NO_STORE_HEADERS,
      ...init.headers,
    },
  });
}
