import { readFileSync } from "node:fs";

const required = [
  "[SWARM_ORCHESTRATION]",
  "[MODEL_ROUTING — RUFLO]",
  "[AGENT_ASSIGNMENTS]",
  "[OUTPUT_TEMPLATE]",
  "[EXECUTION_LOGIC]"
];

const protocol = readFileSync("protocol.txt", "utf8");
const missing = required.filter((token) => !protocol.includes(token));

if (missing.length) {
  console.error(`protocol.txt is missing required sections: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("protocol.txt validation passed");
