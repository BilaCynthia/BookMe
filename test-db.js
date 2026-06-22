require("ts-node").register();
const { prisma } = require("./lib/db.ts");

async function main() {
  try {
    const v = await prisma.vendor.findFirst();
    console.log("Success:", v);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
