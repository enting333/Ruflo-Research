import fs from "node:fs";
import { execFileSync } from "node:child_process";

const protocolPath = "protocol.txt";

if (!fs.existsSync(protocolPath)) {
  throw new Error("protocol.txt not found");
}

const requiredSecrets = [
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
  "OPENAI_API_KEY",
  "TAVILY_API_KEY",
  "SERPAPI_API_KEY"
];

const missing = requiredSecrets.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing GitHub Secrets: ${missing.join(", ")}`);
}

const protocol = fs.readFileSync(protocolPath, "utf8");

const prompt = `
Use the following protocol.txt as strict instructions.
Return BOTH Markdown and Make.com-compatible JSON.

--- protocol.txt ---
${protocol}
`;

fs.writeFileSync("ruflo_prompt.txt", prompt);

execFileSync(
  "npx",
  [
    "-y",
    "ruflo@latest",
    "swarm",
    prompt,
    "--output-format",
    "json",
    "--output-file",
    "ruflo-output.json"
  ],
  {
    stdio: "inherit",
    env: process.env
  }
);
