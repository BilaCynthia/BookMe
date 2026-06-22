const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = env.match(/DATABASE_URL="?([^"\r\n]+)"?/);
if (dbUrlMatch) {
  process.env.DATABASE_URL = dbUrlMatch[1].trim();
}

const { PrismaClient } = require('@prisma/client');
const { neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL.replace('?channel_binding=require', '');
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const vendors = await prisma.vendor.findMany({
    select: { id: true, email: true, name: true, passwordHash: true }
  });
  console.log("VENDORS IN DB:");
  vendors.forEach(v => {
    console.log(`Email: |${v.email}| PasswordHash length: ${v.passwordHash?.length}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
