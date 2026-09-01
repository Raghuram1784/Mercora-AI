import Groq from "groq-sdk";
import { config } from "../config/env.js";

if (config.LLM_PROVIDER === "groq" && !config.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY environment variable is required when LLM_PROVIDER is groq.");
}

export const groq = new Groq({
  apiKey: config.GROQ_API_KEY,
});
