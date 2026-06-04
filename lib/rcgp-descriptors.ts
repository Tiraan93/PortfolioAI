import descriptorsData from "@/lib/rcgp-descriptors.json";
import type { DescriptorLevel } from "@/lib/schema";

export type { DescriptorLevel };

export const DESCRIPTOR_LEVEL_LABELS: Record<
  DescriptorLevel,
  { short: string; column: string }
> = {
  needs_further_development: {
    short: "Needs further development",
    column: "Needs further development",
  },
  competent: {
    short: "Competent",
    column: "Competent",
  },
  excellent: {
    short: "Excellent",
    column: "Excellent",
  },
};

export interface RCGPCapability {
  name: string;
  needsFurtherDevelopment: string[];
  competent: string[];
  excellent: string[];
}

/** RCGP capability word descriptors (Complete RCGP Word descriptors PDF). */
export const RCGP_CAPABILITIES: RCGPCapability[] = descriptorsData as RCGPCapability[];

export const RCGP_CAPABILITY_NAMES = RCGP_CAPABILITIES.map((c) => c.name);

const LEVEL_KEY: Record<
  DescriptorLevel,
  keyof Pick<RCGPCapability, "needsFurtherDevelopment" | "competent" | "excellent">
> = {
  needs_further_development: "needsFurtherDevelopment",
  competent: "competent",
  excellent: "excellent",
};

export function findCapability(capabilityName: string): RCGPCapability | undefined {
  const normalised = capabilityName.trim().toLowerCase();
  return RCGP_CAPABILITIES.find((c) => c.name.toLowerCase() === normalised);
}

export function normalizeCapabilityName(capabilityName: string): string {
  const cap = findCapability(capabilityName);
  if (!cap) {
    throw new Error(
      `Unknown RCGP capability "${capabilityName}". Use one of: ${RCGP_CAPABILITY_NAMES.join("; ")}`,
    );
  }
  return cap.name;
}

export function getDescriptorList(
  capabilityName: string,
  level: DescriptorLevel,
): string[] {
  const cap = findCapability(capabilityName);
  if (!cap) return [];
  return cap[LEVEL_KEY[level]];
}

export function resolveDescriptor(
  capabilityName: string,
  level: DescriptorLevel,
  index: number,
): string {
  const cap = findCapability(capabilityName);
  if (!cap) {
    throw new Error(`Unknown RCGP capability "${capabilityName}".`);
  }

  const list = cap[LEVEL_KEY[level]];
  if (!Number.isInteger(index) || index < 0 || index >= list.length) {
    throw new Error(
      `Invalid descriptorIndex ${index} for "${cap.name}" (${DESCRIPTOR_LEVEL_LABELS[level].column}). Valid range: 0 to ${list.length - 1}.`,
    );
  }

  return list[index];
}

export function findDescriptorIndex(
  capabilityName: string,
  level: DescriptorLevel,
  text: string,
): number | null {
  const list = getDescriptorList(capabilityName, level);
  const normalised = text.trim();
  const index = list.findIndex((d) => d === normalised);
  return index >= 0 ? index : null;
}

export function getDescriptorsForCapability(
  capabilityName: string,
  levels: DescriptorLevel[],
): { level: DescriptorLevel; text: string }[] {
  const cap = findCapability(capabilityName);
  if (!cap) return [];

  const result: { level: DescriptorLevel; text: string }[] = [];
  for (const level of levels) {
    const key = LEVEL_KEY[level];
    for (const text of cap[key]) {
      result.push({ level, text });
    }
  }
  return result;
}

export function isExactDescriptor(text: string): boolean {
  const normalised = text.trim();
  for (const cap of RCGP_CAPABILITIES) {
    for (const key of ["needsFurtherDevelopment", "competent", "excellent"] as const) {
      if (cap[key].some((d) => d === normalised)) return true;
    }
  }
  return false;
}

export function buildDescriptorPromptSection(levels: DescriptorLevel[]): string {
  const selected = new Set(levels);
  const sections: string[] = [];

  for (const cap of RCGP_CAPABILITIES) {
    const parts: string[] = [`### ${cap.name}`];

    if (selected.has("needs_further_development")) {
      parts.push(
        "Needs further development (descriptorIndex is 0-based within this column):",
        ...cap.needsFurtherDevelopment.map((d, i) => `[${i}] ${d}`),
      );
    }
    if (selected.has("competent")) {
      parts.push(
        "Competent (descriptorIndex is 0-based within this column):",
        ...cap.competent.map((d, i) => `[${i}] ${d}`),
      );
    }
    if (selected.has("excellent")) {
      parts.push(
        "Excellent (descriptorIndex is 0-based within this column):",
        ...cap.excellent.map((d, i) => `[${i}] ${d}`),
      );
    }

    sections.push(parts.join("\n"));
  }

  const levelNames = levels
    .map((l) => DESCRIPTOR_LEVEL_LABELS[l].column)
    .join(", ");

  return `RCGP word descriptors (${levelNames} columns). For each evidence item return "name" (capability title), "level", and "descriptorIndex" (integer from the list below). Do NOT write descriptor text yourself.

${sections.join("\n\n")}`;
}

export function formatUsedDescriptorsSection(usedDescriptors: string[]): string {
  if (usedDescriptors.length === 0) return "";
  return `BATCH RULE: Each case reflection in this batch must use different word descriptors. These exact strings are already used and are FORBIDDEN for this case (choose different capability, level, and descriptorIndex):
${usedDescriptors.map((d) => `- ${d}`).join("\n")}`;
}

export function formatRetrySection(usedDescriptors: string[]): string {
  if (usedDescriptors.length === 0) return "";
  return `RETRY: Your previous response repeated descriptor(s) already used in this batch. Choose different capability and descriptorIndex combinations. Forbidden exact strings:
${usedDescriptors.map((d) => `- ${d}`).join("\n")}`;
}

export const SYSTEM_TEAM_GUIDANCE = `When Competent and/or Excellent descriptor levels are selected, write achievements appropriate to the chosen level without inventing unsupported team roles or referrals.`;
