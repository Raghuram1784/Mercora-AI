import { Request, Response } from "express";
import { MerchantAnalyticsService } from "../merchant-analytics/merchant-analytics.service.js";
import { MerchantAnalyticsMapper } from "../merchant-analytics/merchant-analytics.mapper.js";
import { AnalyticsTimeRange } from "../merchant-analytics/merchant-analytics.types.js";

function parseRange(queryRange: any): AnalyticsTimeRange {
  if (queryRange === "7d" || queryRange === "30d" || queryRange === "all") {
    return queryRange;
  }
  return "30d";
}

export class MerchantController {
  static async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const range = parseRange(req.query.range);
      const startTime = Date.now();
      const summary = await MerchantAnalyticsService.getSummary(range);
      const duration = Date.now() - startTime;
      console.log(`[MerchantController] getDashboardSummary(${range}) completed in ${duration}ms`);

      res.status(200).json(MerchantAnalyticsMapper.toSummaryResponse(summary));
    } catch (error: any) {
      console.error("[MerchantController] getDashboardSummary failed:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "ANALYTICS_ERROR",
          message: error.message || "Failed to load merchant dashboard summary.",
        },
      });
    }
  }

  static async getRevenueTrend(req: Request, res: Response): Promise<void> {
    try {
      const range = parseRange(req.query.range);
      const points = await MerchantAnalyticsService.getRevenueTrend(range);
      res.status(200).json(MerchantAnalyticsMapper.toRevenueTrendResponse(points));
    } catch (error: any) {
      console.error("[MerchantController] getRevenueTrend failed:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "ANALYTICS_ERROR",
          message: error.message || "Failed to load revenue trend.",
        },
      });
    }
  }

  static async getGrowthMetrics(req: Request, res: Response): Promise<void> {
    try {
      const range = parseRange(req.query.range);
      const growth = await MerchantAnalyticsService.getGrowthMetrics(range);
      res.status(200).json(MerchantAnalyticsMapper.toGrowthResponse(growth));
    } catch (error: any) {
      console.error("[MerchantController] getGrowthMetrics failed:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "ANALYTICS_ERROR",
          message: error.message || "Failed to load growth analytics.",
        },
      });
    }
  }

  static async getRecentOrders(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Math.min(Number(req.query.limit) || 10, 50) : 10;
      const orders = await MerchantAnalyticsService.getRecentOrders(limit);
      res.status(200).json(MerchantAnalyticsMapper.toOrdersResponse(orders));
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "ANALYTICS_ERROR",
          message: error.message || "Failed to load recent orders.",
        },
      });
    }
  }

  static async getAuditEvents(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Math.min(Number(req.query.limit) || 20, 100) : 20;
      const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
      const type = typeof req.query.type === "string" ? (req.query.type as any) : undefined;

      const eventsData = await MerchantAnalyticsService.getAuditEvents(limit, cursor, type);
      res.status(200).json(MerchantAnalyticsMapper.toAuditResponse(eventsData));
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "AUDIT_ERROR",
          message: error.message || "Failed to load audit events ledger.",
        },
      });
    }
  }
}
