import { prisma } from "../apps/backend/src/config/database.js";

async function resetDemoData() {
  console.log("=================================================================");
  console.log("             MERCORA AI DEMO DATA CLEANUP & RESET               ");
  console.log("=================================================================\n");

  console.log("--- CLEANUP SUMMARY OF WHAT WILL BE RESET ---");
  console.log("1. PRESERVED:");
  console.log("   - Merchant catalog, Products, ProductVariants, ProductRelations");
  console.log("   - Seed Demo Customer (customer@mercora.ai)");
  console.log("\n2. TRANSACTIONAL DATA TO BE DELETED:");
  console.log("   - All CommerceEvent records");
  console.log("   - All Payment records");
  console.log("   - All OrderItem records");
  console.log("   - All Order records");
  console.log("   - All CartItem records");
  console.log("   - All Cart records");
  console.log("   - Non-seed test customers (phase7a-test, phase7b-test, phase8-test, etc.)");
  console.log("-----------------------------------------------------------------\n");

  try {
    const deletedEvents = await prisma.commerceEvent.deleteMany({});
    console.log(`Deleted ${deletedEvents.count} CommerceEvent records.`);

    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`Deleted ${deletedPayments.count} Payment records.`);

    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`Deleted ${deletedOrderItems.count} OrderItem records.`);

    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`Deleted ${deletedOrders.count} Order records.`);

    const deletedCartItems = await prisma.cartItem.deleteMany({});
    console.log(`Deleted ${deletedCartItems.count} CartItem records.`);

    const deletedCarts = await prisma.cart.deleteMany({});
    console.log(`Deleted ${deletedCarts.count} Cart records.`);

    const deletedTestCustomers = await prisma.customer.deleteMany({
      where: {
        OR: [
          { email: { contains: "test" } },
          { email: { contains: "phase" } },
          { email: { contains: "regression" } },
        ],
      },
    });
    console.log(`Deleted ${deletedTestCustomers.count} automated test customer accounts.`);

    // Re-establish clean seed demo customer and one ACTIVE cart
    let seedCustomer = await prisma.customer.findUnique({
      where: { email: "customer@mercora.ai" },
    });

    if (!seedCustomer) {
      seedCustomer = await prisma.customer.create({
        data: {
          email: "customer@mercora.ai",
          name: "Demo Customer",
        },
      });
      console.log(`Re-created seed demo customer: ${seedCustomer.email}`);
    }

    const cleanCart = await prisma.cart.create({
      data: {
        customerId: seedCustomer.id,
        status: "ACTIVE",
      },
    });
    console.log(`Re-established clean ACTIVE cart [ID: ${cleanCart.id}] for ${seedCustomer.email}.`);

    console.log("\n=========================================================");
    console.log("            DEMO DATA RESET COMPLETED CLEANLY             ");
    console.log("=========================================================\n");
  } catch (error) {
    console.error("Error during demo data reset:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// To run the cleanup explicitly, uncomment the invocation below or execute via tsx
resetDemoData();
