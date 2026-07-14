interface Fetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface D1Database {
  prepare(query: string): unknown;
  batch<T = unknown>(statements: unknown[]): Promise<T[]>;
  exec(query: string): Promise<unknown>;
  dump(): Promise<ArrayBuffer>;
}

declare module "cloudflare:workers" {
  // The real binding is injected by Cloudflare at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const env: { DB?: any };
}
