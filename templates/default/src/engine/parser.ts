import { extractFrontmatter } from "./frontmatter";

export interface PresentationConfig {
  title: string;
  theme: string;
  [key: string]: unknown;
}

export interface SlideData {
  index: number;
  content: string;
  frontmatter: Record<string, unknown>;
}

export interface ParsedPresentation {
  config: PresentationConfig;
  slides: SlideData[];
}

function splitSlides(content: string): string[] {
  const lines = content.split("\n");
  const sections: string[] = [];
  let current: string[] = [];
  let activeFence: string | null = null;

  for (const line of lines) {
    const trimmed = line.trimStart();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);

    if (fenceMatch) {
      const fence = fenceMatch[1];

      if (activeFence === null) {
        activeFence = fence[0];
      } else if (activeFence === fence[0]) {
        activeFence = null;
      }
    }

    if (activeFence === null && /^---\s*$/.test(line) && current.length > 0) {
      sections.push(current.join("\n").trim());
      current = [];
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    const text = current.join("\n").trim();
    if (text) {
      sections.push(text);
    }
  }

  return sections;
}

export function parseSlides(markdown: string): ParsedPresentation {
  const { data, content } = extractFrontmatter(markdown);

  const config: PresentationConfig = {
    title: (data.title as string) ?? "Untitled",
    theme: (data.theme as string) ?? "minimal",
    ...data,
  };

  const rawSlides = splitSlides(content);

  const slides: SlideData[] = rawSlides.map((raw, index) => {
    const parsed = extractFrontmatter(raw);
    return {
      index,
      content: parsed.content.trim(),
      frontmatter: parsed.data as Record<string, unknown>,
    };
  });

  return { config, slides };
}
