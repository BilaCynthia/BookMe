// lib/db.ts (reloaded)
// Prisma Client Singleton
//
// This is the ONLY place PrismaClient is instantiated in the entire codebase.
// Import { prisma } from "@/lib/db" everywhere else.
// Never call `new PrismaClient()` directly in any other file.
//
// In serverless environments (Vercel), each function invocation can create a new
// module instance. Without this singleton pattern, each cold start would open a
// new database connection, quickly exhausting the PostgreSQL connection limit.
// The global cache (`globalThis.__prisma`) persists across hot reloads in dev.

import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const prismaClientSingleton = () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
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
