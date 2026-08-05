import { prisma } from './src/services/db';

async function checkAccounts() {
  const accounts = await prisma.account.findMany({
    where: { name: 'ultraviolet-black' }
  });
  console.log('Accounts:');
  console.log(accounts);
}

checkAccounts();
