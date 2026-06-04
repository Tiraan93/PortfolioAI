const BANNED_WORDS = [
  "delve",
  "tapestry",
  "navigate",
  "landscape",
  "pivotal",
  "nuanced",
  "comprehensive",
  "foster",
  "demystify",
  "transformative",
];

export function removeHyphens(text: string): string {
  return text.replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

export function sanitizeGeneratedText(text: string): string {
  let result = removeHyphens(text);

  for (const word of BANNED_WORDS) {
    const pattern = new RegExp(`\\b${word}\\b`, "gi");
    result = result.replace(pattern, "");
  }

  return result.replace(/\s+/g, " ").trim();
}

export const BANNED_WORDS_LIST = BANNED_WORDS;
