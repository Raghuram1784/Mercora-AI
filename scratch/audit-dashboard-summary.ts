import { MerchantAnalyticsService } from "../apps/backend/src/merchant-analytics/merchant-analytics.service.js";
import { prisma } from "../apps/backend/src/config/database.js";

async function main() {
  const summary = await MerchantAnalyticsService.getSummary("30d");
  const growth = await MerchantAnalyticsService.getGrowthMetrics("30d");
  const orders = await MerchantAnalyticsService.getRecentOrders(5);

  console.log("=== CURRENT DASHBOARD SUMMARY METRICS ===");
  console.log("Paid Revenue:                  ₹" + summary.revenue);
  console.log("Paid Orders:                   " + summary.paidOrders);
  console.log("Average Order Value:           ₹" + summary.averageOrderValue);
  console.log("Payment Completion Rate:       " + summary.paymentCompletionRate + "%");
  console.log("AI-Assisted Orders:            " + summary.aiAssistedOrders);
  console.log("Revenue from AI-Assisted Orders: ₹" + summary.aiAssistedRevenue);
  console.log("Accepted Growth Uplift:        ₹" + summary.acceptedGrowthValue);
  console.log("=========================================\n");

  console.log("Recent Orders:");
  for (const o of orders) {
    console.log(`- Order #${o.orderNumber}: Status=${o.status}, Total=₹${o.total}, AI-Assisted=${o.isAiAssisted}`);
  }

  await prisma.$disconnect();
}

main();
