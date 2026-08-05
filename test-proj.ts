import { prisma } from './src/services/db';

async function testProjection(monthParam: string) {
  const [paramYear, paramMonth] = monthParam.split('-').map(Number);
  const paramDate = new Date(paramYear, paramMonth - 1, 1);

  const txs = await prisma.transaction.findMany({
    where: { 
      account: { name: { contains: 'SANTANDER UNIQUE' } },
      totalInstallments: { gt: 1 }
    }
  });

  const getMonthStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const groups: Record<string, any> = {};
  for (const tx of txs) {
    if (!tx.installmentNumber) continue;
    // Group by rounded amount to avoid first-installment rounding issues
    const roundedAmount = Math.round(tx.amount);
    const key = `${tx.description.trim()}_${roundedAmount}_${tx.totalInstallments}`;
    const txMonth = getMonthStr(tx.date);

    if (!groups[key] || tx.installmentNumber > groups[key].installmentNumber) {
      groups[key] = { ...tx, txMonth };
    }
  }

  const projectedTxns = [];
  for (const key in groups) {
    const highest = groups[key];
    const [hYear, hMonth] = highest.txMonth.split('-').map(Number);
    const hDate = new Date(hYear, hMonth - 1, 1);
    
    let diff = (paramDate.getFullYear() - hDate.getFullYear()) * 12 + (paramDate.getMonth() - hDate.getMonth());
    
    if (diff > 0) {
      const projectedInst = highest.installmentNumber + diff;
      if (projectedInst <= highest.totalInstallments) {
        projectedTxns.push({
          description: highest.description,
          amount: highest.amount,
          projectedInstallment: projectedInst,
          totalInstallments: highest.totalInstallments
        });
      }
    }
  }

  console.log(`Projected for ${monthParam}:`, projectedTxns);
}

testProjection('2026-08');
