import { PrismaClient } from "@prisma/client"
import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import ws from "ws"

neonConfig.webSocketConstructor = ws

const connectionString = process.env.DATABASE_URL.replace("?channel_binding=require", "")
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const vendors = await prisma.vendor.findMany({
    select: { id: true, email: true, name: true }
  })
  console.log(JSON.stringify(vendors, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
