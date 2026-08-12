import { drizzle } from "drizzle-orm/d1";
import * as schema from "@workspace/db";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function setDatabaseBinding(binding: D1Database): void {
  if (!database) database = drizzle(binding, { schema });
}

function getDatabase() {
  if (!database) throw new Error("D1 database binding is not initialized");
  return database;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, property) {
    const value = (getDatabase() as any)[property];
    return typeof value === "function" ? value.bind(getDatabase()) : value;
  },
});
