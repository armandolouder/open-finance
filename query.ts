import { prisma } from "./src/services/db";

async function run() {
  const txs = await prisma.transaction.findMany({
    where: {
      originalDescription: { contains: "ISAAC" }
    }
  });
  console.log(JSON.stringify(txs, null, 2));
}
run();
