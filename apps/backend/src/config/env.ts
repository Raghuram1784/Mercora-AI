import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from both root .env and backend-specific .env
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export interface Config {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  FRONTEND_URL: string;
  LLM_PROVIDER: string;
  GROQ_API_KEY?: string;
  GROQ_MODEL: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required but was not provided.`);
  }
  return value;
};

const getEnvOptional = (key: string): string | undefined => {
  return process.env[key];
};

const llmProvider = getEnv("LLM_PROVIDER", "groq");
const groqApiKey = getEnvOptional("GROQ_API_KEY");

if (llmProvider === "groq" && !groqApiKey) {
  throw new Error("Environment variable GROQ_API_KEY is required when LLM_PROVIDER is groq.");
}

const razorpayKeyId = getEnvOptional("RAZORPAY_KEY_ID");
const razorpayKeySecret = getEnvOptional("RAZORPAY_KEY_SECRET");

if (razorpayKeyId && razorpayKeySecret) {
  console.log("Razorpay configuration loaded ✅");
} else {
  console.warn("⚠️ Razorpay credentials missing or incomplete in environment.");
}

export const config: Config = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: parseInt(getEnv("PORT", "5000"), 10),
  DATABASE_URL: getEnv("DATABASE_URL"),
  FRONTEND_URL: getEnv("FRONTEND_URL", "http://localhost:5173"),
  LLM_PROVIDER: llmProvider,
  GROQ_API_KEY: groqApiKey,
  GROQ_MODEL: getEnv("GROQ_MODEL", "openai/gpt-oss-20b"),
  RAZORPAY_KEY_ID: razorpayKeyId,
  RAZORPAY_KEY_SECRET: razorpayKeySecret,
};
