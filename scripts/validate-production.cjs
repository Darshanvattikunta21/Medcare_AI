const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
let errors = 0;

function pass(message) {
  console.log(`[ok] ${message}`);
}

function fail(message) {
  console.log(`[fail] ${message}`);
  errors += 1;
}

function warn(message) {
  console.log(`[warn] ${message}`);
}

function commandExists(command) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore", shell: true });
  return result.status === 0;
}

function fileExists(relativePath, label) {
  if (fs.existsSync(path.join(root, relativePath))) {
    pass(label);
  } else {
    fail(label);
  }
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function contains(relativePath, pattern, label) {
  const content = readFile(relativePath);
  if (pattern.test(content)) {
    pass(label);
  } else {
    fail(label);
  }
}

console.log("MediCare AI - Production Environment Validation");
console.log("==================================================");

commandExists("node") ? pass("Node.js installed") : fail("Node.js installed");
commandExists("pnpm") ? pass("pnpm installed") : fail("pnpm installed");
commandExists("docker") ? pass("Docker installed") : warn("Docker not installed on this machine");

fileExists(".env.production", ".env.production exists");
fileExists(".env.staging", ".env.staging exists");
fileExists("Dockerfile", "Dockerfile exists");
fileExists("docker-compose.yml", "docker-compose.yml exists");
fileExists("DEPLOYMENT.md", "DEPLOYMENT.md exists");
fileExists("apps/api/package.json", "API package.json exists");
fileExists("apps/web/package.json", "Web package.json exists");
fileExists("packages/core/package.json", "Core package.json exists");
fileExists("packages/api-client/package.json", "API client package.json exists");

contains("apps/api/package.json", /"express"/, "API has express");
contains("apps/web/package.json", /"next"/, "Web has Next.js");
contains("packages/core/package.json", /"build"/, "Core package has build script");
contains("packages/api-client/package.json", /"build"/, "API client package has build script");
contains(".env.production", /^CORS_ORIGIN=https:\/\/.+/m, ".env.production restricts CORS origin");
contains(".env.production", /^NEXT_PUBLIC_API_BASE_URL=https:\/\/.+/m, ".env.production uses HTTPS API URL for web");
contains(".env.production", /^EXPO_PUBLIC_API_BASE_URL=https:\/\/.+/m, ".env.production uses HTTPS API URL for mobile");
contains(".env.production", /^API_BASE_URL=https:\/\/.+/m, ".env.production uses HTTPS API URL");
contains(".env.production", /^AUTH_SECRET=.+/m, ".env.production defines AUTH_SECRET");

console.log("");
if (errors === 0) {
  console.log("All validations passed");
  process.exit(0);
}

console.log(`${errors} validation(s) failed`);
process.exit(1);
