import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const requiredSecrets = [
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
  "OPENAI_API_KEY",
  "TAVILY_API_KEY",
  "SERPAPI_API_KEY"
];

function run(command, args, options = {}) {
  const printable = [command, ...args].join(" ");
  console.log(`\n$ ${printable}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
    ...options
  });
  return result.status ?? 1;
}

function runCapture(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: process.platform === "win32",
    env: process.env
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}

function assertSecrets() {
  const missing = requiredSecrets.filter((name) => !process.env[name]);
  if (missing.length) {
    console.error(`Missing GitHub Actions secrets: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log("All required provider secrets are present. Values are not printed.");
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function buildPrompt(protocolText) {
  const now = todayUtc();
  const normalizedProtocol = protocolText.replaceAll("{{now}}", now);
  return `You are Ruflo running a delegated multi-agent technical research swarm.\n\nUse Ruflo model routing for every agent and print logs exactly like:\n[Agent_X] Model selected via ruflo: <model_name> | Reason: <selection_basis>\n\nFollow this protocol exactly. Enforce the strict 7-day window relative to ${now}. Return BOTH outputs: Markdown digest first, then Make.com-compatible JSON. Do not send email.\n\n${normalizedProtocol}`;
}

function writeFailureArtifacts(reason) {
  mkdirSync("dist", { recursive: true });
  writeFileSync("dist/ruflo-research.md", `# Ruflo research run failed\n\n${reason}\n`, "utf8");
  writeFileSync("dist/ruflo-research.json", JSON.stringify({ error: reason }, null, 2), "utf8");
}

assertSecrets();
mkdirSync("dist", { recursive: true });

const protocolPath = resolve(process.argv[2] ?? "protocol.txt");
if (!existsSync(protocolPath)) {
  writeFailureArtifacts(`Protocol file not found: ${protocolPath}`);
  process.exit(1);
}

const prompt = buildPrompt(readFileSync(protocolPath, "utf8"));
writeFileSync("dist/ruflo-prompt.txt", prompt, "utf8");

// Ruflo's public setup guide documents npx ruflo@latest init/start. CI must be non-interactive.
run("npx", ["-y", "ruflo@latest", "--version"]);
run("npx", ["-y", "ruflo@latest", "doctor"]);
run("npx", ["-y", "ruflo@latest", "init", "--force"]);

const outputFile = "dist/ruflo-research.md";
const jsonFile = "dist/ruflo-research.raw.json";

const rufloAttempts = [
  ["npx", ["-y", "ruflo@latest", "swarm", prompt, "--agents", "6", "--topology", "hierarchical", "--parallel", "--output-format", "markdown", "--output-file", outputFile]],
  ["npx", ["-y", "ruflo@latest", "orchestrate", prompt, "--agents", "6", "--topology", "hierarchical", "--parallel", "--output-file", outputFile]],
  ["npx", ["-y", "@claude-flow/cli@latest", "swarm", prompt, "--agents", "6", "--topology", "hierarchical", "--parallel", "--output-format", "json", "--output-file", jsonFile]]
];

let ok = false;
for (const [cmd, args] of rufloAttempts) {
  const status = run(cmd, args);
  if (status === 0) {
    ok = true;
    break;
  }
  console.warn(`Attempt failed with exit code ${status}; trying next documented Ruflo/Claude-Flow entrypoint.`);
}

if (!ok) {
  writeFailureArtifacts("All Ruflo/Claude-Flow CLI execution attempts failed. Check current Ruflo CLI command names and authentication logs in GitHub Actions.");
  process.exit(1);
}

if (existsSync(jsonFile) && !existsSync(outputFile)) {
  const raw = readFileSync(jsonFile, "utf8");
  writeFileSync(outputFile, `# Ruflo Research Digest\n\n\`\`\`json\n${raw}\n\`\`\`\n`, "utf8");
}

console.log("Research artifacts written to dist/.");
