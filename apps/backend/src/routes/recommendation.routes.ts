import { Router } from "express";
import { getRecommendations } from "../controllers/recommendation.controller.js";

const router = Router();

router.post("/", getRecommendations);

export default router;
