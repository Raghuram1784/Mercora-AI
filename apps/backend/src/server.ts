import app from "./app.js";
import { config } from "./config/env.js";

const PORT = config.PORT;

const server = app.listen(PORT, () => {
  console.log(`[Server] Mercora backend running on http://localhost:${PORT}`);
  console.log(`[Server] Environment: ${config.NODE_ENV}`);
});

process.on("unhandledRejection", (err: Error) => {
  console.error(`[Server] Unhandled Rejection: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err: Error) => {
  console.error(`[Server] Uncaught Exception: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});
