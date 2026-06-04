import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = join(root, "lib", "rcgp-descriptors.json");
const pdfPath = join(root, "docs", "RCGP-Word-Descriptors.pdf");

const data = JSON.parse(readFileSync(jsonPath, "utf8"));
let descriptorCount = 0;

for (const cap of data) {
  for (const key of ["needsFurtherDevelopment", "competent", "excellent"]) {
    descriptorCount += cap[key].length;
  }
}

console.log(`Capabilities: ${data.length}`);
console.log(`Total descriptors: ${descriptorCount}`);
console.log(`JSON path: ${jsonPath}`);

if (!existsSync(pdfPath)) {
  console.warn(`PDF not found at ${pdfPath}.`);
  process.exit(0);
}

try {
  const pdfParse = (await import("pdf-parse")).default;
  const buffer = readFileSync(pdfPath);
  const parsed = await pdfParse(buffer);
  const text = parsed.text ?? "";
  console.log(`PDF pages: ${parsed.numpages}, extracted chars: ${text.length}`);
  if (text.length < 500) {
    console.warn("PDF text extraction returned little text. Verify descriptors manually against the PDF.");
  }
} catch {
  console.log("Optional: npm install -D pdf-parse then re-run to compare JSON against docs/RCGP-Word-Descriptors.pdf");
}