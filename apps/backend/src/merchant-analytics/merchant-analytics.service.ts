import { prisma } from "../config/database.js";
import {
  AnalyticsTimeRange,
  MerchantDashboardSummary,
  RevenueTrendPoint,
  GrowthMetrics,
  RecentOrderSummary,
} from "./merchant-analytics.types.js";
import { CommerceEventType } from "../generated/prisma/index.js";

function getStartDateForRange(range: AnalyticsTimeRange): Date {
  const now = Date.now();
  if (range === "7d") {
    return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }
  if (range === "30d") {
    return new Date(now - 30 * 24 * 60 * 60 * 1000);
  }
  return new Date(0); // "all"
}

export class MerchantAnalyticsService {
  /**
   * Retrieves server-side seeded Mercora Merchant ID.
   */
  static async getDefaultMerchantId(): Promise<string | null> {
    const merchant = await prisma.merchant.findFirst({
      where: { active: true },
    });
    return merchant?.id || null;
  }

  /**
   * Calculates high-level financial, payment completion, AI influence, and growth metrics.
   */
  static async getSummary(range: AnalyticsTimeRange = "30d"): Promise<MerchantDashboardSummary> {
    const startDate = getStartDateForRange(range);

    const [
      paidOrders,
      verifiedPaymentsCount,
      paymentSessionsCount,
      growthEvents,
      recRequestedCount,
      recReturnedCount,
    ] = await Promise.all([
      // 1. Authoritative Paid Orders with OrderItems
      prisma.order.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: startDate },
        },
        include: {
          items: true,
        },
      }),

      // 2. Verified Payments in range
      prisma.payment.count({
        where: {
          status: "VERIFIED",
          createdAt: { gte: startDate },
        },
      }),

      // 3. Payment Sessions / PAYMENT_STARTED events in range (Denominator for completion rate)
      prisma.commerceEvent.count({
        where: {
          type: CommerceEventType.PAYMENT_STARTED,
          createdAt: { gte: startDate },
        },
      }),

      // 4. Growth Commerce Events in range
      prisma.commerceEvent.findMany({
        where: {
          createdAt: { gte: startDate },
          type: {
            in: [
              CommerceEventType.UPSELL_SHOWN,
              CommerceEventType.CROSS_SELL_SHOWN,
              CommerceEventType.ACCESSORY_SHOWN,
              CommerceEventType.UPSELL_ACCEPTED,
              CommerceEventType.CROSS_SELL_ACCEPTED,
              CommerceEventType.ACCESSORY_ACCEPTED,
            ],
          },
        },
      }),

      // 5. Recommendation Requests
      prisma.commerceEvent.count({
        where: {
          type: CommerceEventType.AI_RECOMMENDATION_REQUESTED,
          createdAt: { gte: startDate },
        },
      }),

      // 6. Recommendation Results Returned
      prisma.commerceEvent.count({
        where: {
          type: CommerceEventType.AI_RECOMMENDATION_RETURNED,
          createdAt: { gte: startDate },
        },
      }),
    ]);

    // Financial Metrics
    let totalRevenueNum = 0;
    let aiAssistedOrdersCount = 0;
    let aiAssistedRevenueNum = 0;

    for (const order of paidOrders) {
      const orderTotal = Number(order.total);
      totalRevenueNum += orderTotal;

      const hasAiItem = order.items.some((item) => item.source !== "DIRECT");
      if (hasAiItem) {
        aiAssistedOrdersCount++;
        aiAssistedRevenueNum += orderTotal;
      }
    }

    const paidOrdersCount = paidOrders.length;
    const aovNum = paidOrdersCount > 0 ? totalRevenueNum / paidOrdersCount : 0;

    // Payment Completion Rate: VERIFIED payments / Payment sessions started
    const totalSessions = Math.max(paymentSessionsCount, verifiedPaymentsCount);
    const paymentCompletionRate =
      totalSessions > 0 ? Math.round((verifiedPaymentsCount / totalSessions) * 100) : null;

    // Potential & Accepted Growth Uplifts
    let potentialGrowthNum = 0;
    let acceptedGrowthNum = 0;

    for (const event of growthEvents) {
      if (event.potentialUplift) {
        potentialGrowthNum += Number(event.potentialUplift);
      }
      if (event.acceptedUplift) {
        acceptedGrowthNum += Number(event.acceptedUplift);
      }
    }

    return {
      range,
      revenue: totalRevenueNum.toFixed(2),
      paidOrders: paidOrdersCount,
      averageOrderValue: aovNum.toFixed(2),
      paymentCompletionRate,
      aiAssistedOrders: aiAssistedOrdersCount,
      aiAssistedRevenue: aiAssistedRevenueNum.toFixed(2),
      potentialGrowthValue: potentialGrowthNum.toFixed(2),
      acceptedGrowthValue: acceptedGrowthNum.toFixed(2),
      totalRecommendationRequests: recRequestedCount,
      totalRecommendationsReturned: recReturnedCount,
    };
  }

  /**
   * Computes daily UTC revenue and paid order trends for the selected range.
   */
  static async getRevenueTrend(range: AnalyticsTimeRange = "30d"): Promise<RevenueTrendPoint[]> {
    const startDate = getStartDateForRange(range);

    const paidOrders = await prisma.order.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: startDate },
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const dailyMap = new Map<string, { revenue: number; orders: number }>();

    for (const order of paidOrders) {
      // Consistent UTC date formatting (YYYY-MM-DD)
      const dateKey = order.createdAt.toISOString().slice(0, 10);
      const existing = dailyMap.get(dateKey) || { revenue: 0, orders: 0 };
      existing.revenue += Number(order.total);
      existing.orders += 1;
      dailyMap.set(dateKey, existing);
    }

    const points: RevenueTrendPoint[] = [];
    for (const [date, data] of dailyMap.entries()) {
      points.push({
        date,
        revenue: data.revenue.toFixed(2),
        orders: data.orders,
      });
    }

    return points;
  }

  /**
   * Retrieves detailed AI growth & suggestion metrics.
   */
  static async getGrowthMetrics(range: AnalyticsTimeRange = "30d"): Promise<GrowthMetrics> {
    const startDate = getStartDateForRange(range);

    const events = await prisma.commerceEvent.findMany({
      where: {
        createdAt: { gte: startDate },
        type: {
          in: [
            CommerceEventType.AI_RECOMMENDATION_REQUESTED,
            CommerceEventType.AI_RECOMMENDATION_RETURNED,
            CommerceEventType.UPSELL_SHOWN,
            CommerceEventType.UPSELL_ACCEPTED,
            CommerceEventType.CROSS_SELL_SHOWN,
            CommerceEventType.CROSS_SELL_ACCEPTED,
            CommerceEventType.ACCESSORY_SHOWN,
            CommerceEventType.ACCESSORY_ACCEPTED,
          ],
        },
      },
    });

    let recommendationRequests = 0;
    let recommendationsReturned = 0;
    let upsellsShown = 0;
    let upsellsAccepted = 0;
    let crossSellsShown = 0;
    let crossSellsAccepted = 0;
    let accessoriesShown = 0;
    let accessoriesAccepted = 0;
    let potentialGrowthNum = 0;
    let acceptedGrowthNum = 0;

    for (const e of events) {
      switch (e.type) {
        case CommerceEventType.AI_RECOMMENDATION_REQUESTED:
          recommendationRequests++;
          break;
        case CommerceEventType.AI_RECOMMENDATION_RETURNED:
          recommendationsReturned++;
          break;
        case CommerceEventType.UPSELL_SHOWN:
          upsellsShown++;
          if (e.potentialUplift) potentialGrowthNum += Number(e.potentialUplift);
          break;
        case CommerceEventType.UPSELL_ACCEPTED:
          upsellsAccepted++;
          if (e.acceptedUplift) acceptedGrowthNum += Number(e.acceptedUplift);
          break;
        case CommerceEventType.CROSS_SELL_SHOWN:
          crossSellsShown++;
          if (e.potentialUplift) potentialGrowthNum += Number(e.potentialUplift);
          break;
        case CommerceEventType.CROSS_SELL_ACCEPTED:
          crossSellsAccepted++;
          if (e.acceptedUplift) acceptedGrowthNum += Number(e.acceptedUplift);
          break;
        case CommerceEventType.ACCESSORY_SHOWN:
          accessoriesShown++;
          if (e.potentialUplift) potentialGrowthNum += Number(e.potentialUplift);
          break;
        case CommerceEventType.ACCESSORY_ACCEPTED:
          accessoriesAccepted++;
          if (e.acceptedUplift) acceptedGrowthNum += Number(e.acceptedUplift);
          break;
      }
    }

    return {
      recommendationRequests,
      recommendationsReturned,
      upsellsShown,
      upsellsAccepted,
      crossSellsShown,
      crossSellsAccepted,
      accessoriesShown,
      accessoriesAccepted,
      potentialGrowthValue: potentialGrowthNum.toFixed(2),
      acceptedGrowthValue: acceptedGrowthNum.toFixed(2),
    };
  }

  /**
   * Retrieves recent orders with AI attribution badge flags.
   */
  static async getRecentOrders(limit = 10): Promise<RecentOrderSummary[]> {
    const orders = await prisma.order.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: true,
      },
    });

    return orders.map((o) => {
      const aiItem = o.items.find((item) => item.source !== "DIRECT");
      const isAiAssisted = !!aiItem;

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total.toString(),
        currency: o.currency,
        itemCount: o.items.length,
        isAiAssisted,
        aiAttributionType: aiItem ? aiItem.source : undefined,
        createdAt: o.createdAt.toISOString(),
        paidAt: o.paidAt ? o.paidAt.toISOString() : null,
      };
    });
  }

  /**
   * Retrieves paginated audit event timeline from the CommerceEvent ledger.
   */
  static async getAuditEvents(limit = 20, cursor?: string, type?: CommerceEventType) {
    const whereClause: any = {};
    if (type) {
      whereClause.type = type;
    }

    const events = await prisma.commerceEvent.findMany({
      take: limit + 1,
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    let nextCursor: string | undefined = undefined;
    if (events.length > limit) {
      const nextItem = events.pop();
      nextCursor = nextItem?.id;
    }

    return {
      events,
      nextCursor,
    };
  }
}
