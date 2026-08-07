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

    console.log("Testing updateMany for expense series:", expense.seriesId);
    
    // Simulate what the API does for ALL
    const updateData = {
      title: "LIGHT", 
      amount: 346.83, 
      dueDate: new Date("2026-08-06"),
      competenceDate: null,
      categoryId: null, subcategoryId: null, tags: null, supplier: null, costCenter: null, project: null,
      paymentMethod: null, accountId: null, creditCardId: null, notes: null
    };

    console.log("Attempting updateMany...");
    const updated = await prisma.expense.updateMany({
      where: { seriesId: expense.seriesId },
      data: updateData
    });
    console.log("updateMany success", updated.count);

    console.log("Attempting Series update...");
    await prisma.expenseSeries.update({
      where: { id: expense.seriesId },
      data: {
        title: "LIGHT", description: null, categoryId: null, subcategoryId: null, tags: null, 
        supplier: null, costCenter: null, project: null, paymentMethod: null, accountId: null, creditCardId: null
      }
    });
    console.log("Series update success");

  } catch (error) {
    console.error("Crash during update:", error);
  }
}

run();
