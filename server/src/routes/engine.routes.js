import { Router } from "express";
import { analyze } from "../controllers/engine.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../utils/rate.limiter.js";

const router = Router();

const engineLimiter = createRateLimiter(100);

router.post("/analyze", authMiddleware, engineLimiter, analyze);

export default router;
