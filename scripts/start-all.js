import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function startService(name, relativeScriptPath) {
  const fullPath = path.resolve(rootDir, relativeScriptPath);
  console.log(`[Flowify] Starting ${name} from ${fullPath}...`);

  const proc = spawn(process.execPath, [fullPath], {
    stdio: "inherit",
    env: process.env,
    cwd: rootDir,
  });

  proc.on("error", (err) => {
    console.error(`[Flowify] Failed to start ${name}:`, err);
  });

  proc.on("exit", (code, signal) => {
    console.warn(`[Flowify] ${name} exited with code ${code} / signal ${signal}`);
  });

  return proc;
}

console.log("==================================================");
console.log("🚀 Starting Flowify All-in-One Engine for Render");
console.log("==================================================");

// 1. Primary Backend (Handles API & Webhooks on PORT)
startService("Backend & Webhooks", "primary-backend/dist/index.js");

// 2. Transactional Outbox Processor
startService("Outbox Processor", "processor/dist/index.js");

// 3. Kafka Action Worker
startService("Action Workers", "workers/dist/index.js");

// Forward termination signals cleanly
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

