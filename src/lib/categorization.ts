import { prisma } from '@/services/db';

export async function applyCategoriesToTransactions(transactions: any[]) {
  if (!transactions || transactions.length === 0) return transactions;

  // 1. Fetch all categories with rules
  const categories = await prisma.category.findMany({
    include: { rules: true }
  });

  const categoryMap = new Map();
  for (const c of categories) categoryMap.set(c.id, c);

  // 2. Fetch overrides for these specific transactions
  const txIds = transactions.map(t => t.id).filter(Boolean);
  let overrides: any[] = [];
  
  if (txIds.length > 0) {
    overrides = await prisma.transactionOverride.findMany({
      where: { externalId: { in: txIds } },
      include: { category: true }
    });
  }

  const overrideMap = new Map();
  for (const o of overrides) {
    overrideMap.set(o.externalId, o.category);
  }

  // 3. Process transactions
  for (const tx of transactions) {
    // Preserve original category from Pluggy in a different field if needed,
    // but usually tx.category is the Pluggy one.
    tx.originalCategory = tx.category;
    
    let matchedCat = null;

    // Check override first
    if (tx.id && overrideMap.has(tx.id)) {
      matchedCat = overrideMap.get(tx.id);
    } else {
      // Check rules
      const desc = (tx.description || '').toLowerCase();
      for (const cat of categories) {
        for (const rule of cat.rules) {
          const pattern = rule.pattern.toLowerCase();
          // Exact match or includes
          if (desc.includes(pattern)) {
            matchedCat = cat;
            break;
          }
        }
        if (matchedCat) break;
      }
    }

    if (matchedCat) {
      tx.category = matchedCat.name;
      tx.categoryId = matchedCat.id;
      tx.categoryType = matchedCat.type;
      tx.categoryColor = matchedCat.color;
      
      if (matchedCat.parentId) {
        const parent = categoryMap.get(matchedCat.parentId);
        if (parent) {
          tx.parentCategory = parent.name;
          tx.parentCategoryId = parent.id;
        }
      }
    } else {
       // Fallback
       tx.categoryType = 'UNCATEGORIZED';
    }
  }

  return transactions;
}
