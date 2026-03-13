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
  notes: string;
  fragmentCount: number;
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

function parseNotes(raw: string): { content: string; notes: string } {
  const notePattern = /^Notes?:\s*$/m;
  const match = raw.match(notePattern);
  if (!match || match.index === undefined) {
    return { content: raw, notes: "" };
  }
  const content = raw.slice(0, match.index).trim();
  const notes = raw.slice(match.index + match[0].length).trim();
  return { content, notes };
}

function countFragments(content: string): number {
  const lines = content.split("\n");
  let count = 0;
  let inFragmentList = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "<!-- fragment -->") {
      inFragmentList = true;
      continue;
    }
    if (inFragmentList) {
      if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        count++;
      } else if (trimmed === "") {
        continue;
      } else {
        inFragmentList = false;
      }
    }
  }

  return count;
}

export function parseSlides(markdown: string): ParsedPresentation {
  const { data, content } = extractFrontmatter(markdown);

  const config: PresentationConfig = {
    title: (data.title as string) ?? "Untitled",
    theme: (data.theme as string) ?? "reveal.js-league",
    ...data,
  };

  const rawSlides = splitSlides(content);

  const slides: SlideData[] = rawSlides.map((raw, index) => {
    const parsed = extractFrontmatter(raw);
    const { content: slideContent, notes } = parseNotes(parsed.content.trim());
    const fragmentCount = countFragments(slideContent);
    return {
      index,
      content: slideContent,
      frontmatter: parsed.data as Record<string, unknown>,
      notes,
      fragmentCount,
    };
  });

  return { config, slides };
}
