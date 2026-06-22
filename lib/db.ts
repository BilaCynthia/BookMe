// lib/db.ts
// Prisma Client Singleton
//
// This is the ONLY place PrismaClient is instantiated in the entire codebase.
// Import { prisma } from "@/lib/db" everywhere else.
// Never call `new PrismaClient()` directly in any other file.
//
// Uses the standard Prisma Rust engine with Neon pooler (pgbouncer=true).
//
// The global cache (`globalThis.prismaGlobal`) persists across hot reloads in dev.

import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const prismaClientSingleton = () => {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
      "Please add it to your .env.local file."
    )
  }

  const pool = new Pool({ connectionString: dbUrl })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  })
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma
}

