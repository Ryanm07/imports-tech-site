import { drizzle } from "drizzle-orm/d1";
import { getDatabaseBinding } from "@/db/runtime";
import * as schema from "./schema";

export function getDb() {
  const binding = getDatabaseBinding();
  if (!binding) {
    throw new Error(
      "Database unavailable. Cloudflare deployments require the D1 binding `DB`; native Next.js/Vercel currently serves versioned public content without a database.",
    );
  }

  return drizzle(binding, { schema });
}

export type D1PreparedLike = {
  bind(...values: unknown[]): D1PreparedLike;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
};

export type D1DatabaseLike = {
  prepare(query: string): D1PreparedLike;
};

export function getD1(): D1DatabaseLike {
  const binding = getDatabaseBinding();
  if (!binding) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  return binding as D1DatabaseLike;
}
