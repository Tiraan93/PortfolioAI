import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { strict as assert } from "node:assert";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, "rcgp-descriptors.json"), "utf8"));

const EXPECTED_CAPABILITY_NAMES = [
  "Fitness to practice",
  "An ethical approach",
  "Communicating and consulting",
  "Data Gathering and interpretation",
  "Clinical examination and procedural skills",
  "Decision-making and Diagnosis",
  "Clinical management",
  "Medical complexity",
  "Team working",
  "Performance, learning and teaching",
  "Organisation, management and leadership",
  "Holistic practice, health promotion and safeguarding",
  "Community health and environmental sustainability",
];

const LEVEL_KEYS = ["needsFurtherDevelopment", "competent", "excellent"];

assert.equal(data.length, 13, "Expected 13 RCGP capabilities");

for (let i = 0; i < EXPECTED_CAPABILITY_NAMES.length; i++) {
  assert.equal(data[i].name, EXPECTED_CAPABILITY_NAMES[i], `Capability ${i + 1} name mismatch`);
}

for (const cap of data) {
  for (const key of LEVEL_KEYS) {
    const list = cap[key];
    assert.ok(Array.isArray(list) && list.length > 0, `${cap.name}.${key} must be non-empty`);
    for (const text of list) {
      assert.equal(typeof text, "string");
      assert.ok(text.trim().length > 0, `${cap.name}.${key} has empty descriptor`);
    }
    const seen = new Set();
    for (const text of list) {
      assert.ok(!seen.has(text), `Duplicate in ${cap.name}.${key}`);
      seen.add(text);
    }
  }
}

console.log("rcgp-descriptors.json: all integrity checks passed.");