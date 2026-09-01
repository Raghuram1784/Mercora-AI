import assert from "assert";
import { MerchantAnalyticsService } from "../apps/backend/src/merchant-analytics/merchant-analytics.service.js";
import { prisma } from "../apps/backend/src/config/database.js";

async function runTrendVisualizationTests() {
  console.log("=================================================================");
  console.log("      TESTING REVENUE & PAID ORDER TREND VISUALIZATION DATA       ");
  console.log("=================================================================\n");

  // 1. Fetch real trend data for 30d range
  const trendPoints = await MerchantAnalyticsService.getRevenueTrend("30d");
  const summary = await MerchantAnalyticsService.getSummary("30d");

  console.log(`Fetched ${trendPoints.length} trend point(s) from backend.`);
  console.log("Backend Trend Data Points:", JSON.stringify(trendPoints, null, 2));

  if (trendPoints.length < 2) {
    console.log("✅ Trend data contains < 2 distinct dates. Frontend will render the Single-Day Performance Summary.");
    const singlePoint = trendPoints.length === 1 ? trendPoints[0] : null;
    const todayRev = singlePoint ? singlePoint.revenue : summary.revenue;
    const todayOrders = singlePoint ? singlePoint.orders : summary.paidOrders;
    console.log(`Single-Day Values: Revenue = ₹${todayRev}, Paid Orders = ${todayOrders}`);
  } else {
    console.log(`✅ Trend data contains ${trendPoints.length} distinct dates. Frontend will render the Combined Chart.`);
    trendPoints.forEach((pt, i) => {
      assert(pt.date, `Point ${i} has date string`);
      assert(pt.revenue !== undefined, `Point ${i} has revenue string`);
      assert(typeof pt.orders === "number", `Point ${i} has numeric order count`);
    });
  }

  console.log("\n=========================================================");
  console.log("        REVENUE TREND VISUALIZATION DATA TEST PASSED     ");
  console.log("=========================================================\n");

  await prisma.$disconnect();
}

runTrendVisualizationTests();
