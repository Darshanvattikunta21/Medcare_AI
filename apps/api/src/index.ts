import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`MediCare AI API listening on port ${env.port}`);
});

server.on("error", (err: any) => {
  console.error(`API server failed to start on port ${env.port}:`, err?.message ?? err);
  if (err && err.code === "EADDRINUSE") {
    console.error(`Port ${env.port} is already in use. This prevents the API from starting and causes frontend fetches to fail.`);
  }
  // exit with non-zero so process managers / dev tooling notice
  process.exit(1);
});
