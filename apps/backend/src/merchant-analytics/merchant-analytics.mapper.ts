export class MerchantAnalyticsMapper {
  static toSummaryResponse(summary: any) {
    return {
      success: true,
      data: summary,
    };
  }

  static toRevenueTrendResponse(points: any[]) {
    return {
      success: true,
      data: points,
    };
  }

  static toGrowthResponse(growth: any) {
    return {
      success: true,
      data: growth,
    };
  }

  static toOrdersResponse(orders: any[]) {
    return {
      success: true,
      data: orders,
    };
  }

  static toAuditResponse(eventsData: { events: any[]; nextCursor?: string }) {
    return {
      success: true,
      data: {
        events: eventsData.events.map((e) => ({
          id: e.id,
          eventKey: e.eventKey,
          type: e.type,
          source: e.source,
          merchantId: e.merchantId,
          customerId: e.customerId,
          cartId: e.cartId,
          orderId: e.orderId,
          paymentId: e.paymentId,
          productId: e.productId,
          sourceProductId: e.sourceProductId,
          targetProductId: e.targetProductId,
          suggestionType: e.suggestionType,
          potentialUplift: e.potentialUplift ? e.potentialUplift.toString() : null,
          acceptedUplift: e.acceptedUplift ? e.acceptedUplift.toString() : null,
          metadata: e.metadata || {},
          createdAt: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString(),
        })),
        nextCursor: eventsData.nextCursor,
      },
    };
  }
}
