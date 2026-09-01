import { Request, Response, NextFunction } from "express";
import { AgentService } from "../agent/agent.service.js";

export class AgentController {
  static async chat(req: Request, res: Response, next: NextFunction) {
    const { message, customerId, cartId, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "The message parameter is required and must be a string.",
        },
      });
    }

    // Set a timeout of 20 seconds for the entire agent chat processing loop
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      // Execute agent loop
      const result = await Promise.race([
        AgentService.processMessage({ message, customerId, cartId, history }),
        new Promise((_, reject) =>
          controller.signal.addEventListener("abort", () =>
            reject(new Error("Timeout: Agent took too long to respond."))
          )
        ),
      ]) as any;

      clearTimeout(timeoutId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("[AgentController] Chat loop error caught:", err);

      // Distinguish between specific service errors and raw SDK/system connection failures
      const errMessage = err.message || "";
      let code = "AGENT_REQUEST_FAILED";
      let status = 500;
      let displayMessage = "Mercora AI could not complete the request.";

      if (errMessage.includes("Cart ownership")) {
        code = "UNAUTHORIZED_CART";
        status = 403;
        displayMessage = errMessage;
      } else if (err?.status === 429 || errMessage.includes("429") || errMessage.toLowerCase().includes("rate limit")) {
        code = "AI_RATE_LIMIT_EXCEEDED";
        status = 503;
        displayMessage = "Mercora AI is temporarily busy. Please try again shortly.";
      } else if (err?.status === 401 || errMessage.includes("401") || errMessage.toLowerCase().includes("api key")) {
        code = "AI_CONFIG_ERROR";
        status = 503;
        displayMessage = "AI assistance is temporarily unavailable.";
      } else if (errMessage.includes("Timeout") || errMessage.includes("timed out")) {
        code = "AI_TIMEOUT";
        status = 504;
        displayMessage = "Mercora AI is taking longer than expected. Please try again.";
      } else if (errMessage.includes("tool execution exceeded")) {
        code = "MAX_ROUNDS_EXCEEDED";
        status = 508;
        displayMessage = "The agent request exceeded processing limits.";
      }

      return res.status(status).json({
        success: false,
        error: {
          code,
          message: displayMessage,
        },
      });
    }
  }
}
