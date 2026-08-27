const { spawn } = require("node:child_process");
const path = require("node:path");

const args = process.argv.slice(2);
const workspaceRoot = path.resolve(__dirname, "..", "..", "..");
const expoHome = path.join(workspaceRoot, ".expo-home");
const cliPath = require.resolve("expo/bin/cli", {
  paths: [path.resolve(__dirname, "..")]
});

const env = {
  ...process.env,
  EXPO_NO_TELEMETRY: "1",
  EXPO_NO_TYPESCRIPT_SETUP: "1",
  HOME: expoHome,
  USERPROFILE: expoHome
};

const child = spawn(process.execPath, [cliPath, ...args], {
  cwd: path.resolve(__dirname, ".."),
  env,
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
