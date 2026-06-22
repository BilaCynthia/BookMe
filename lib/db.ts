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
import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import ws from "ws"

// Required in Node.js — Neon's driver uses WebSockets instead of TCP
neonConfig.webSocketConstructor = ws

const prismaClientSingleton = () => {
  let connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
      "Please add it to your .env.local file."
    )
  }

  // Strip channel_binding parameter — Neon's WebSocket driver doesn't support it
  // and it causes silent connection failures.
  const url = new URL(connectionString)
  url.searchParams.delete("channel_binding")
  connectionString = url.toString()

  const adapter = new PrismaNeon({ connectionString })

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

