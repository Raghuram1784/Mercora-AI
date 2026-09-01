import { Router } from "express";
import { MerchantController } from "../controllers/merchant.controller.js";

const router = Router();

router.get("/dashboard/summary", MerchantController.getDashboardSummary);
router.get("/dashboard/revenue-trend", MerchantController.getRevenueTrend);
router.get("/dashboard/growth", MerchantController.getGrowthMetrics);
router.get("/dashboard/orders", MerchantController.getRecentOrders);
router.get("/audit-events", MerchantController.getAuditEvents);

export default router;
