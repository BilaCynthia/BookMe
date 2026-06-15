// prisma.config.ts
// Prisma 7 configuration file.
// Connection URLs are defined here — not in schema.prisma.
//
// DATABASE_URL  — pooled connection (PgBouncer) — used by the app at runtime
// DIRECT_URL    — direct connection — used by prisma migrate (bypasses pooling)

import { config } from "dotenv"
import { existsSync } from "fs"

if (existsSync(".env.local")) {
  config({ path: ".env.local" })
} else {
  config()
}

import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] as string,
  },
})
