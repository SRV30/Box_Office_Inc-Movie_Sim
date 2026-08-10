import app from "./src/app.js";
import env from "./src/config/envConfig.js";
import { connectDB, disconnectDB } from "./src/config/db.js";

import "./src/models/index.js";

const signals = ["SIGTERM", "SIGINT"];

const gracefulShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => { disconnectDB().then(() => process.exit(0)) });
};

for (const signal of signals) {
  process.on(signal, () => gracefulShutdown(signal));
}

process.on("uncaughtException", (error) => {
  console.error("[Server] Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled Rejection:", reason);
});

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`\n  🎬  Box Office Inc API`);
      console.log(`  ─────────────────────`);
      console.log(`  Environment : ${env.NODE_ENV}`);
      console.log(`  Port        : ${env.PORT}`);
      console.log(`  Database    : ${env.MONGO_URI ? "Configured" : "Not Set"}`);
      console.log(`\n`);
    });

    server.timeout = env.REQUEST_TIMEOUT_MS;
  } catch (error) {
    console.error("[Server] Failed to start:", error.message);
    process.exit(1);
  }
};

startServer();
