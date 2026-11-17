const { spawn } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const serverDirectory = path.join(projectRoot, "server");
const clientDirectory = path.join(projectRoot, "client");

const services = {
  backend: {
    name: "Backend",
    directory: serverDirectory,
    script: path.join(serverDirectory, "node_modules", "nodemon", "bin", "nodemon.js"),
    args: ["server.js"]
  },
  frontend: {
    name: "Frontend",
    directory: clientDirectory,
    script: path.join(clientDirectory, "node_modules", "vite", "bin", "vite.js"),
    args: []
  }
};

const mode = process.argv[2] || "all";
const selectedServices = mode === "all"
  ? Object.values(services)
  : services[mode] ? [services[mode]] : null;

if (!selectedServices) {
  console.error("Usage: node scripts/dev.js [backend|frontend]");
  process.exit(1);
}

const missingScript = selectedServices.find((service) => !existsSync(service.script));
if (missingScript) {
  console.error(`${missingScript.name} dependencies are missing. Run "npm run install:all" from the project folder.`);
  process.exit(1);
}

const children = [];
const closedChildren = new Set();
let stopping = false;
let shutdownCode = 0;

const finishIfStopped = () => {
  if (stopping && closedChildren.size === children.length) {
    process.exitCode = shutdownCode;
  }
};

const stopServices = (code) => {
  if (stopping) return;
  stopping = true;
  shutdownCode = code;
  children.forEach((child) => {
    if (!closedChildren.has(child)) child.kill();
  });
  finishIfStopped();
};

process.on("SIGINT", () => stopServices(0));
process.on("SIGTERM", () => stopServices(0));

for (const service of selectedServices) {
  const child = spawn(process.execPath, [service.script, ...service.args], {
    cwd: service.directory,
    stdio: "inherit",
    windowsHide: true
  });
  children.push(child);

  child.on("error", (error) => {
    console.error(`${service.name} could not start: ${error.message}`);
    stopServices(1);
  });

  child.on("close", (code, signal) => {
    closedChildren.add(child);
    if (!stopping) {
      console.error(`${service.name} stopped (${signal || `exit code ${code}`}); stopping the other service.`);
      stopServices(code ?? 1);
    }
    finishIfStopped();
  });
}
