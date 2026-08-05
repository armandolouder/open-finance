import { prisma } from './src/services/db';

async function main() {
  const txs = await prisma.transaction.findMany({ where: { totalInstallments: { gt: 1 } } });
  const regex = /\s*(?:-\s*)?(?:PARC\.?\s*)?\(?\d{1,2}\/\d{1,2}\)?$/i;
  const unique = new Set(txs.map(t => t.description));
  
  [...unique].slice(0, 20).forEach(d => {
    console.log(d, '->', d.replace(regex, '').trim());
  });
}
main();
