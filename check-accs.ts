import { prisma } from './src/services/db';

async function main() {
  const accs = await prisma.account.findMany();
  console.log(accs);
}

main();
