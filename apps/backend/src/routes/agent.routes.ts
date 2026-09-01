import { Router } from "express";
import { AgentController } from "../controllers/agent.controller.js";

const router = Router();

router.post("/chat", AgentController.chat);

export default router;
