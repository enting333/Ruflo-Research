import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const requiredEnv = [
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
  "OPENAI_API_KEY",
  "TAVILY_API_KEY",
  "SERPAPI_API_KEY"
];

const missing = requiredEnv.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing required GitHub secrets/env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const now = new Date().toISOString();
const protocol = readFileSync("protocol.txt", "utf8").replaceAll("{{now}}", now);

const prompt = `
Read and execute the following protocol exactly. Return BOTH Mode_A Markdown and Mode_B JSON.
Do not send email. Save results in the requested output file if supported.

${protocol}
`.trim();

const args = [
  "ruflo@latest",
  "swarm",
  prompt,
  "--agents", "6",
  "--output-format", "json",
  "--output-file", "ruflo-output.json"
];

console.log("Starting RuFlo protocol run...");
console.log("Protocol timestamp:", now);

const result = spawnSync("npx", args, {
  stdio: "inherit",
  env: process.env,
  shell: false,
  maxBuffer: 1024 * 1024 * 20
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`RuFlo exited with status ${result.status}`);
  process.exit(result.status ?? 1);
}

writeFileSync("ruflo-run-metadata.json", JSON.stringify({ executed_at: now }, null, 2));
console.log("RuFlo protocol run completed");
