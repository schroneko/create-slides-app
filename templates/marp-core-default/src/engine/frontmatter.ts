import { parse } from "yaml";

export interface FrontmatterResult {
  content: string;
  data: Record<string, unknown>;
}

const FRONTMATTER_DELIMITER = "---";

function isFrontmatterDelimiter(line: string): boolean {
  return line.trim() === FRONTMATTER_DELIMITER;
}

export function extractFrontmatter(source: string): FrontmatterResult {
  const normalized = source.replace(/\r\n/g, "\n");

  if (!normalized.startsWith(`${FRONTMATTER_DELIMITER}\n`)) {
    return { content: normalized, data: {} };
  }

  const lines = normalized.split("\n");
  let delimiterIndex = -1;

  for (let index = 1; index < lines.length; index += 1) {
    if (isFrontmatterDelimiter(lines[index])) {
      delimiterIndex = index;
      break;
    }
  }

  if (delimiterIndex === -1) {
    return { content: normalized, data: {} };
  }

  const rawFrontmatter = lines.slice(1, delimiterIndex).join("\n");
  const content = lines.slice(delimiterIndex + 1).join("\n").trim();

  try {
    const parsed = parse(rawFrontmatter);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { content, data: {} };
    }

    return { content, data: parsed as Record<string, unknown> };
  } catch {
    return { content, data: {} };
  }
}
