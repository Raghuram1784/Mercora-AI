import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.js";
import productRouter from "./routes/product.routes.js";
import customerRouter from "./routes/customer.routes.js";
import cartRouter from "./routes/cart.routes.js";
import agentRouter from "./routes/agent.routes.js";
import recommendationRouter from "./routes/recommendation.routes.js";
import growthRouter from "./routes/growth.routes.js";
import orderRouter from "./routes/order.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import merchantRouter from "./routes/merchant.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { config } from "./config/env.js";

const app = express();

// Middleware configuration
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// API Routing
app.use("/api", healthRouter);
app.use("/api/products", productRouter);
app.use("/api/customers", customerRouter);
app.use("/api/carts", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/merchant", merchantRouter);
app.use("/api/agent", agentRouter);
app.use("/api/recommendations", recommendationRouter);
app.use("/api/growth", growthRouter);

// Fallback handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
