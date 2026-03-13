import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const templatesRoot = path.join(repoRoot, "templates");

const mitLicense = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

const revealCopyright =
  "Copyright (C) 2011-2024 Hakim El Hattab, http://hakim.se, and reveal.js contributors";

const localFontReplacements: Record<string, string> = {
  "@import url(./fonts/source-sans-pro/source-sans-pro.css);":
    "@import url(https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,300i,600,600i,700,700i);",
  "@import url(./fonts/league-gothic/league-gothic.css);":
    "@import url(https://fonts.googleapis.com/css?family=League+Gothic);",
};

type ThemeEntry = {
  name: string;
  title: string;
};

const themes: ThemeEntry[] = [
  { name: "black", title: "Reveal.js Black" },
  { name: "white", title: "Reveal.js White" },
  { name: "league", title: "Reveal.js League" },
  { name: "beige", title: "Reveal.js Beige" },
  { name: "sky", title: "Reveal.js Sky" },
  { name: "night", title: "Reveal.js Night" },
  { name: "serif", title: "Reveal.js Serif" },
  { name: "simple", title: "Reveal.js Simple" },
  { name: "solarized", title: "Reveal.js Solarized" },
  { name: "blood", title: "Reveal.js Blood" },
  { name: "moon", title: "Reveal.js Moon" },
  { name: "dracula", title: "Reveal.js Dracula" },
];

const seedDir = path.join(templatesRoot, "reveal.js-black");

const seedFiles = new Map<string, string>();
for (const relativePath of [
  "index.html",
  "package.json",
  "tsconfig.json",
  "vite.config.ts",
  "src/app.tsx",
  "src/vite-env.d.ts",
  "src/engine/deck.tsx",
  "src/engine/frontmatter.ts",
  "src/engine/navigation.ts",
  "src/engine/parser.ts",
  "src/engine/slide.tsx",
  "src/styles/base.css",
]) {
  seedFiles.set(relativePath, fs.readFileSync(path.join(seedDir, relativePath), "utf8"));
}

function adaptRevealCss(originalCss: string, themeName: string): string {
  const dirName = `reveal.js-${themeName}`;
  const scope = `[data-theme="${dirName}"]`;

  let lines = originalCss.split("\n");

  const fontImports: string[] = [];
  const remaining: string[] = [];

  for (const line of lines) {
    if (line.startsWith("@import")) {
      let importLine = line;
      for (const [local, cdn] of Object.entries(localFontReplacements)) {
        if (importLine === local) {
          importLine = cdn;
        }
      }
      fontImports.push(importLine);
    } else {
      remaining.push(line);
    }
  }

  let css = remaining.join("\n");

  css = css.replace(/section\.has-light-background[^}]*\{[^}]*\}/g, "");
  css = css.replace(/html \* \{[^}]*\}/g, "");

  css = css.replace(/\/\*[\s\S]*?\*\//g, "");

  css = css.replace(/:root\s*\{/, `${scope} {`);

  const bridge = `
${scope} {
  --font-sans: var(--r-main-font);
  --font-mono: var(--r-code-font);
  --color-bg: var(--r-background-color);
  --color-surface: var(--r-background-color);
  --color-text: var(--r-main-color);
  --color-heading: var(--r-heading-color);
  --color-accent: var(--r-link-color);
  --color-code-bg: rgba(127, 127, 127, 0.15);
  --color-line: rgba(127, 127, 127, 0.2);
}
`;
  css = css + bridge;

  css = css.replace(/\.reveal-viewport\s*\{([^}]*)\}/g, `${scope} body {$1}`);

  css = css.replace(/\.reveal\s+\.slides\s+section\s*>\s*section/g, `${scope} .slide`);
  css = css.replace(/\.reveal\s+\.slides\s+section/g, `${scope} .slide`);

  css = css.replace(/\.reveal\s+\.code-wrapper\s+code/g, `${scope} .slide .code-wrapper code`);
  css = css.replace(/\.reveal\s+\.code-wrapper/g, `${scope} .slide .code-wrapper`);

  css = css.replace(/\.reveal\s+\.roll\s+span:after\s*\{[^}]*\}/g, "");
  css = css.replace(/\.reveal\s+\.r-frame\s*\{[^}]*\}/g, "");
  css = css.replace(/\.reveal\s+a\s+\.r-frame\s*\{[^}]*\}/g, "");
  css = css.replace(/\.reveal\s+a:hover\s+\.r-frame\s*\{[^}]*\}/g, "");
  css = css.replace(/\.reveal\s+\.controls\s*\{[^}]*\}/g, "");
  css = css.replace(/\.reveal\s+\.progress\s*\{[^}]*\}/g, "");
  css = css.replace(/@media\s+print\s*\{[^}]*\{[^}]*\}\s*\}/g, "");

  css = css.replace(/\.reveal\s*\{/g, `${scope} .deck {`);

  css = css.replace(/\.reveal\s+/g, `${scope} .slide `);

  const header = `/*
 * reveal.js ${themeName} theme
 * Original: https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/${themeName}.css
 * Copyright: ${revealCopyright}
 * License: MIT
 *
 * Selectors adapted for create-slides-app engine.
 */`;

  const parts = [header];
  if (fontImports.length > 0) {
    parts.push(fontImports.join("\n"));
  }
  parts.push(css);

  let result = parts.join("\n\n");
  result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim() + "\n";
}

function renderParser(themeId: string): string {
  return seedFiles
    .get("src/engine/parser.ts")!
    .replace(
      /theme: \(data\.theme as string\) \?\? "[^"]+",/,
      `theme: (data.theme as string) ?? "${themeId}",`,
    );
}

function renderMain(themeId: string): string {
  return `import { createRoot } from "react-dom/client";
import { App } from "./app";
import slidesRaw from "../__SLIDES_MD__?raw";
import "./styles/base.css";
import "./styles/themes/${themeId}.css";

createRoot(document.getElementById("root")!).render(<App markdown={slidesRaw} />);
`;
}

function renderSlides(dirName: string, title: string): string {
  return `---
title: ${title}
theme: ${dirName}
---

# ${title}

A slide theme from hakimel/reveal.js

${dirName}

---

# Source

- Project: hakimel/reveal.js
- Template: ${dirName}
- License: MIT

---

# Notes

- Markdown slides split by \`---\`
- Arrow keys, Space, Home, and End all work
- Edit \`slides.md\` to replace this sample

---

# Code

\`\`\`typescript
export function formatTitle(input: string): string {
  return input.trim().replace(/\\s+/g, " ");
}
\`\`\`

---

# Next

Replace this deck with your own content.
`;
}

function renderThirdPartyNotice(themeName: string): string {
  return `# Third-Party Notices

## hakimel/reveal.js

This template uses the ${themeName} theme CSS from reveal.js, adapted for
the create-slides-app slide engine.

- Project: \`hakimel/reveal.js\`
- Source: <https://github.com/hakimel/reveal.js>
- Theme CSS: <https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/${themeName}.css>
- License: MIT

${revealCopyright}

${mitLicense}`;
}

function writeFile(targetPath: string, content: string): void {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content);
}

const vendorDir = path.join(repoRoot, "vendor", "reveal.js", "theme");

if (!fs.existsSync(vendorDir)) {
  console.error(`Vendor CSS not found at ${vendorDir}. Download reveal.js themes first.`);
  process.exit(1);
}

for (const theme of themes) {
  const dirName = `reveal.js-${theme.name}`;
  const targetDir = path.join(templatesRoot, dirName);

  const originalCssPath = path.join(vendorDir, `${theme.name}.css`);
  if (!fs.existsSync(originalCssPath)) {
    console.error(`Missing vendor CSS: ${originalCssPath}`);
    process.exit(1);
  }

  const originalCss = fs.readFileSync(originalCssPath, "utf8");
  const adaptedCss = adaptRevealCss(originalCss, theme.name);

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  for (const [relativePath, content] of seedFiles) {
    writeFile(path.join(targetDir, relativePath), content);
  }

  writeFile(path.join(targetDir, "src/engine/parser.ts"), renderParser(dirName));
  writeFile(path.join(targetDir, "src/main.tsx"), renderMain(dirName));
  writeFile(path.join(targetDir, "THIRD_PARTY_NOTICES.md"), renderThirdPartyNotice(theme.name));
  writeFile(path.join(targetDir, "src/styles/themes", `${dirName}.css`), adaptedCss);
}

console.log(`Generated ${themes.length} templates from reveal.js vendor CSS.`);
