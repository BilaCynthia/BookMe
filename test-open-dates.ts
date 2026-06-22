import { prisma } from "./lib/db"

async function main() {
  try {
    const vendor = await prisma.vendor.findFirst()
    if (!vendor) {
        console.log("No vendor found");
        return;
    }
    const vendorId = vendor.id;
    console.log("Using vendorId:", vendorId)
    
    const result = await prisma.availabilitySlot.createMany({
      data: [
        {
          vendorId,
          date: new Date(),
          status: "OPEN"
        }
      ],
      skipDuplicates: true
    })
    console.log(result)
  } catch(e) {
    console.error(e)
  } finally {
    prisma.$disconnect()
  }
}
main()
