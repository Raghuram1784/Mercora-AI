import { prisma } from "../apps/backend/src/config/database.js";

async function auditDatabase() {
  console.log("=================================================================");
  console.log("            MERCORA AI DATABASE TRANSACTION AUDIT               ");
  console.log("=================================================================\n");

  const [
    customerCount,
    cartCount,
    cartItemCount,
    orderCount,
    orderItemCount,
    paymentCount,
    commerceEventCount,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.cart.count(),
    prisma.cartItem.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.payment.count(),
    prisma.commerceEvent.count(),
  ]);

  console.log("--- TABLE RECORD COUNTS ---");
  console.log(`Customers:      ${customerCount}`);
  console.log(`Carts:          ${cartCount}`);
  console.log(`CartItems:      ${cartItemCount}`);
  console.log(`Orders:         ${orderCount}`);
  console.log(`OrderItems:     ${orderItemCount}`);
  console.log(`Payments:       ${paymentCount}`);
  console.log(`CommerceEvents: ${commerceEventCount}`);
  console.log("---------------------------\n");

  // Breakdown of Orders by Customer / IdempotencyKey prefix
  const orders = await prisma.order.findMany({
    include: {
      customer: { select: { email: true, name: true } },
      payments: { select: { provider: true, status: true, razorpayPaymentId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("--- ORDERS BREAKDOWN BY ORIGIN ---");
  const originCounts: Record<string, { count: number; totalRev: number; paidCount: number }> = {};

  for (const o of orders) {
    let origin = "Manual Demo / Web Customer";
    const ik = o.idempotencyKey || "";
    const email = o.customer.email;

    if (email.includes("phase") || email.includes("test") || ik.includes("p8-test") || ik.includes("p7") || ik.includes("p6")) {
      origin = `Automated Test Script (${email})`;
    } else if (ik.startsWith("test-") || ik.includes("regression")) {
      origin = `Automated Regression Test (${ik})`;
    }

    if (!originCounts[origin]) {
      originCounts[origin] = { count: 0, totalRev: 0, paidCount: 0 };
    }
    originCounts[origin].count += 1;
    if (o.status === "PAID") {
      originCounts[origin].paidCount += 1;
      originCounts[origin].totalRev += Number(o.total);
    }
  }

  for (const [origin, data] of Object.entries(originCounts)) {
    console.log(`Origin: ${origin}`);
    console.log(`  - Total Orders: ${data.count} (${data.paidCount} PAID)`);
    console.log(`  - Paid Revenue Contribution: ₹${data.totalRev.toFixed(2)}`);
  }

  // Customers detailed list
  console.log("\n--- CUSTOMERS IN DATABASE ---");
  const customers = await prisma.customer.findMany({
    select: { id: true, email: true, name: true, createdAt: true },
  });
  for (const c of customers) {
    console.log(`- ${c.name} (${c.email}) [ID: ${c.id}]`);
  }

  // CommerceEvents Breakdown
  console.log("\n--- COMMERCE EVENTS BY TYPE ---");
  const eventGroup = await prisma.commerceEvent.groupBy({
    by: ["type"],
    _count: true,
  });
  for (const eg of eventGroup) {
    console.log(`- ${eg.type}: ${eg._count}`);
  }

  await prisma.$disconnect();
}

auditDatabase();
