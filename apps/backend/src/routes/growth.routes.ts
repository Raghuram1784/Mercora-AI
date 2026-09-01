import { Router } from "express";
import { getSuggestions } from "../controllers/growth.controller.js";

const router = Router();

router.post("/suggestions", getSuggestions);

export default router;
