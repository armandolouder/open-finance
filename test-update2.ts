import { prisma } from "./src/services/db.js";

async function run() {
  try {
    const expense = await prisma.expense.findFirst({
      where: { seriesId: { not: null } }
    });
    
    if (!expense) {
      console.log("No recurring expense found");
      return;
    }

    console.log("Testing update for expense series:", expense.seriesId);
    
    // Simulate what the API does for ALL
    const updateData = {
      title: expense.title, 
      amount: expense.amount, 
      dueDate: undefined,
      competenceDate: null,
      categoryId: expense.categoryId, 
      subcategoryId: expense.subcategoryId, 
      tags: null, supplier: null, costCenter: null, project: null,
      paymentMethod: null, 
      accountId: expense.accountId, 
      creditCardId: expense.creditCardId, 
      notes: null
    };

    console.log("Attempting Series update...");
    await prisma.expenseSeries.update({
      where: { id: expense.seriesId },
      data: {
        title: expense.title, 
        description: undefined, 
        categoryId: expense.categoryId, 
        subcategoryId: expense.subcategoryId, 
        tags: null, 
        supplier: null, 
        costCenter: null, 
        project: null, 
        paymentMethod: null, 
        accountId: expense.accountId, 
        creditCardId: expense.creditCardId
      }
    });
    console.log("Series update success");

  } catch (error) {
    console.error("Crash during update:", error);
  }
}

run();
