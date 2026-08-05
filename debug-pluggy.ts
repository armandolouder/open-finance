import { getPluggyClient } from './src/services/pluggy/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const pluggy = getPluggyClient();
  const itemIdsStr = process.env.PLUGGY_ITEM_IDS || '';
  const itemIds = itemIdsStr.split(',').filter(Boolean);
  
  for (const itemId of itemIds) {
    const accounts = await pluggy.fetchAccounts(itemId);
    for (const acc of accounts) {
      if (acc.name === 'ultraviolet-black') {
        const { transactions } = await pluggy.fetchTransactions(acc.id, 500);
        
        let missingDebits = transactions.filter(tx => !tx.creditCardMetadata?.billForecastDate && tx.type !== 'CREDIT' && tx.category !== 'Credit card payment');
        console.log(`Missing DEBITS count: ${missingDebits.length}`);
        let missingTotal = missingDebits.reduce((s, t) => s + Math.abs(t.amount), 0);
        console.log(`Missing DEBITS total: ${missingTotal}`);
        
        // Em src/app/api/cards/route.ts temos a lógica:
        const currentClosingDay = 17; // do print
        let fallbackSum = 0;
        let augustFoundInMissing = 0;
        
        for (const tx of missingDebits) {
            const txDate = new Date(tx.date);
            const txYear = txDate.getFullYear();
            const txMonth = txDate.getMonth();
            const txDay = txDate.getDate();
            
            let m = '';
            if (txDay > currentClosingDay) {
              const nextMonth = new Date(txYear, txMonth + 1, 1);
              m = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
            } else {
              m = `${txYear}-${String(txMonth + 1).padStart(2, '0')}`;
            }
            
            if (m === '2026-08') {
               augustFoundInMissing += Math.abs(tx.amount);
            }
        }
        
        console.log(`Fallback August total from missing: ${augustFoundInMissing}`);
      }
    }
  }
}
run().catch(console.error);
