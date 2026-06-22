import { prisma } from "./lib/db.js"

async function test() {
  try {
    const v = await prisma.vendor.findFirst()
    console.log("DB Success:", v ? v.email : "No vendors")
  } catch(e) {
    console.error("DB Error:", e)
  }
}
test()
