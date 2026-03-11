import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const templatesRoot = path.join(repoRoot, "templates");
const seedTemplateDir = path.join(templatesRoot, "quarto-revealjs-clean");

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

type TemplateConfig = {
  dirName: string;
  title: string;
  family: "quarto" | "reveal" | "marp" | "slidev";
  sourceProject: string;
  sourceUrl: string;
  themeSourceUrl: string;
  licenseUrl: string;
  copyright: string;
  themeCss: string;
};

type RevealTheme = {
  dirName: string;
  title: string;
  background: string;
  backgroundColor: string;
  mainFont: string;
  headingFont: string;
  mainColor: string;
  headingColor: string;
  accent: string;
  codeFont: string;
  letterSpacing: string;
  textTransform: string;
  headingWeight: string;
  headingShadow: string;
};

type MarpTheme = {
  dirName: string;
  title: string;
  fontSans: string;
  fontMono: string;
  background: string;
  surface: string;
  text: string;
  heading: string;
  accent: string;
  accentSoft: string;
  codeBg: string;
  line: string;
  headingWeight: string;
  headingTransform: string;
  bodyLetterSpacing: string;
  titleAlign: "left" | "center";
  titleTaglineColor: string;
  titleMetaColor: string;
  extraCss: string;
  sourceThemeUrl: string;
  copyright: string;
};

type SlidevTheme = {
  dirName: string;
  title: string;
  fontSans: string;
  fontHeading: string;
  fontMono: string;
  background: string;
  surface: string;
  text: string;
  heading: string;
  accent: string;
  accentMuted: string;
  codeBg: string;
  line: string;
  titleAlign: "left" | "center";
  titleTaglineColor: string;
  titleMetaColor: string;
  titleWeight: string;
  extraCss: string;
  sourceThemeUrl: string;
};

const seedFiles = new Map<string, string>();

for (const relativePath of [
  "index.html",
  "package.json",
  "package-lock.json",
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
  seedFiles.set(relativePath, fs.readFileSync(path.join(seedTemplateDir, relativePath), "utf8"));
}

function quartoThemeCss(themeId: string): string {
  const possiblePaths = [
    path.join(seedTemplateDir, "src/styles/themes/quarto-revealjs-clean.css"),
    path.join(seedTemplateDir, "src/styles/themes/clean.css"),
  ];
  const sourcePath = possiblePaths.find((candidate) => fs.existsSync(candidate));

  if (!sourcePath) {
    throw new Error("Unable to find the source stylesheet for quarto-revealjs-clean");
  }

  const sourceCss = fs.readFileSync(sourcePath, "utf8");

  return sourceCss
    .replaceAll('[data-theme="clean"]', `[data-theme="${themeId}"]`)
    .replaceAll('[data-theme="quarto-revealjs-clean"]', `[data-theme="${themeId}"]`);
}

function renderRevealCss(theme: RevealTheme): string {
  return `/*
 * Adapted from reveal.js ${theme.dirName.replace("reveal.js-", "")} theme
 * Source: ${`https://raw.githubusercontent.com/hakimel/reveal.js/master/dist/theme/${theme.dirName.replace("reveal.js-", "")}.css`}
 * Licensed under the MIT License.
 */

[data-theme="${theme.dirName}"] {
  --font-sans: ${theme.mainFont};
  --font-mono: ${theme.codeFont};
  --color-bg: ${theme.backgroundColor};
  --color-surface: transparent;
  --color-text: ${theme.mainColor};
  --color-heading: ${theme.headingColor};
  --color-accent: ${theme.accent};
  --color-code-bg: rgba(0, 0, 0, 0.16);
  --color-line: rgba(127, 127, 127, 0.24);
  --slide-padding: 5rem 6rem;
  --reveal-background: ${theme.background};
  --reveal-heading-font: ${theme.headingFont};
  --reveal-heading-letter-spacing: ${theme.letterSpacing};
  --reveal-heading-transform: ${theme.textTransform};
  --reveal-heading-weight: ${theme.headingWeight};
  --reveal-heading-shadow: ${theme.headingShadow};
}

[data-theme="${theme.dirName}"] body {
  background: var(--reveal-background);
}

[data-theme="${theme.dirName}"] .deck {
  padding: 0;
  background: var(--reveal-background);
}

[data-theme="${theme.dirName}"] .deck::before,
[data-theme="${theme.dirName}"] .deck::after,
[data-theme="${theme.dirName}"] .slide::before {
  display: none;
}

[data-theme="${theme.dirName}"] .slide {
  width: 100vw;
  max-width: none;
  height: 100vh;
  aspect-ratio: auto;
  padding: 5rem 6rem;
  justify-content: center;
  align-items: center;
  text-align: center;
  border-radius: 0;
  box-shadow: none;
  border: 0;
  background: transparent;
}

[data-theme="${theme.dirName}"] .slide h1,
[data-theme="${theme.dirName}"] .slide h2,
[data-theme="${theme.dirName}"] .slide h3,
[data-theme="${theme.dirName}"] .slide h4 {
  font-family: var(--reveal-heading-font);
  letter-spacing: var(--reveal-heading-letter-spacing);
  text-transform: var(--reveal-heading-transform);
  text-shadow: var(--reveal-heading-shadow);
  font-weight: var(--reveal-heading-weight);
  margin-bottom: 1.2rem;
}

[data-theme="${theme.dirName}"] .slide h1 {
  font-size: clamp(3rem, 8vw, 4.8rem);
}

[data-theme="${theme.dirName}"] .slide h2 {
  font-size: clamp(2.2rem, 6vw, 3rem);
}

[data-theme="${theme.dirName}"] .slide h3 {
  font-size: clamp(1.4rem, 4vw, 2rem);
}

[data-theme="${theme.dirName}"] .slide p,
[data-theme="${theme.dirName}"] .slide ul,
[data-theme="${theme.dirName}"] .slide ol,
[data-theme="${theme.dirName}"] .slide table,
[data-theme="${theme.dirName}"] .slide blockquote {
  max-width: 64rem;
  margin-left: auto;
  margin-right: auto;
}

[data-theme="${theme.dirName}"] .slide ul,
[data-theme="${theme.dirName}"] .slide ol {
  display: inline-block;
  text-align: left;
  padding-left: 1.4rem;
}

[data-theme="${theme.dirName}"] .slide pre {
  width: min(90vw, 56rem);
  margin-left: auto;
  margin-right: auto;
  background: var(--color-code-bg);
  box-shadow: none;
}

[data-theme="${theme.dirName}"] .slide blockquote {
  width: min(70vw, 52rem);
  padding: 1rem 1.5rem;
  background: rgba(127, 127, 127, 0.14);
  border-left: 0;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}

[data-theme="${theme.dirName}"] .slide a {
  text-decoration: none;
}

[data-theme="${theme.dirName}"] .slide-number {
  color: var(--color-text);
  opacity: 0.6;
}

[data-theme="${theme.dirName}"] .deck[data-slide-index="0"] .slide h1 {
  margin-bottom: 1.4rem;
}

[data-theme="${theme.dirName}"] .deck[data-slide-index="0"] .slide p:first-of-type {
  margin-bottom: 0.6rem;
}

@media (max-width: 960px) {
  [data-theme="${theme.dirName}"] .slide {
    padding: 2rem;
  }
}
`;
}

function renderMarpCss(theme: MarpTheme): string {
  return `/*
 * Adapted from ${theme.dirName.replace(/^marp-core-/, "")} theme in marp-core
 * Source: ${theme.sourceThemeUrl}
 * Licensed under the MIT License.
 */

[data-theme="${theme.dirName}"] {
  --font-sans: ${theme.fontSans};
  --font-mono: ${theme.fontMono};
  --color-bg: ${theme.background};
  --color-surface: ${theme.surface};
  --color-text: ${theme.text};
  --color-heading: ${theme.heading};
  --color-accent: ${theme.accent};
  --color-code-bg: ${theme.codeBg};
  --color-line: ${theme.line};
  --slide-padding: 4.75rem;
}

[data-theme="${theme.dirName}"] body {
  background: ${theme.background};
}

[data-theme="${theme.dirName}"] .deck {
  padding: 0;
  background: ${theme.background};
}

[data-theme="${theme.dirName}"] .deck::before,
[data-theme="${theme.dirName}"] .deck::after,
[data-theme="${theme.dirName}"] .slide::before {
  display: none;
}

[data-theme="${theme.dirName}"] .slide {
  width: 100vw;
  max-width: none;
  height: 100vh;
  aspect-ratio: auto;
  padding: 4.75rem;
  justify-content: flex-start;
  border-radius: 0;
  box-shadow: none;
  border: 0;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.04)),
    ${theme.surface};
  line-height: 1.45;
  letter-spacing: ${theme.bodyLetterSpacing};
}

[data-theme="${theme.dirName}"] .slide h1,
[data-theme="${theme.dirName}"] .slide h2,
[data-theme="${theme.dirName}"] .slide h3,
[data-theme="${theme.dirName}"] .slide h4 {
  font-weight: ${theme.headingWeight};
  text-transform: ${theme.headingTransform};
}

[data-theme="${theme.dirName}"] .slide h1 {
  font-size: clamp(2.6rem, 6vw, 4rem);
}

[data-theme="${theme.dirName}"] .slide h2 {
  font-size: clamp(2rem, 4vw, 3rem);
}

[data-theme="${theme.dirName}"] .slide a,
[data-theme="${theme.dirName}"] .slide mark {
  color: ${theme.accent};
}

[data-theme="${theme.dirName}"] .slide code {
  background: ${theme.codeBg};
}

[data-theme="${theme.dirName}"] .slide pre {
  background: ${theme.codeBg};
  border: 1px solid ${theme.line};
  box-shadow: none;
}

[data-theme="${theme.dirName}"] .slide table {
  width: auto;
  min-width: 50%;
}

[data-theme="${theme.dirName}"] .slide th,
[data-theme="${theme.dirName}"] .slide td {
  border: 1px solid ${theme.line};
}

[data-theme="${theme.dirName}"] .slide blockquote {
  color: inherit;
  border-left: 0;
  position: relative;
  padding-left: 1.25rem;
}

[data-theme="${theme.dirName}"] .slide blockquote::before {
  content: "“";
  position: absolute;
  left: 0;
  top: -0.15em;
  font-size: 1.6em;
  color: ${theme.accentSoft};
}

[data-theme="${theme.dirName}"] .deck[data-slide-index="0"] .slide {
  text-align: ${theme.titleAlign};
  align-items: ${theme.titleAlign === "center" ? "center" : "flex-start"};
}

[data-theme="${theme.dirName}"] .deck[data-slide-index="0"] .slide p:first-of-type {
  color: ${theme.titleTaglineColor};
}

[data-theme="${theme.dirName}"] .deck[data-slide-index="0"] .slide p:last-of-type {
  color: ${theme.titleMetaColor};
}

${theme.extraCss}
`;
}

function renderSlidevCss(theme: SlidevTheme): string {
  return `/*
 * Adapted from ${theme.dirName}
 * Source: ${theme.sourceThemeUrl}
 * Licensed under the MIT License.
 */

[data-theme="${theme.dirName}"] {
  --font-sans: ${theme.fontSans};
  --font-mono: ${theme.fontMono};
  --color-bg: ${theme.background};
  --color-surface: ${theme.surface};
  --color-text: ${theme.text};
  --color-heading: ${theme.heading};
  --color-accent: ${theme.accent};
  --color-code-bg: ${theme.codeBg};
  --color-line: ${theme.line};
  --slide-padding: 4.5rem;
}

[data-theme="${theme.dirName}"] body {
  background: ${theme.background};
}

[data-theme="${theme.dirName}"] .deck {
  background: ${theme.background};
}

[data-theme="${theme.dirName}"] .slide h1,
[data-theme="${theme.dirName}"] .slide h2,
[data-theme="${theme.dirName}"] .slide h3,
[data-theme="${theme.dirName}"] .slide h4 {
  font-family: ${theme.fontHeading};
}

[data-theme="${theme.dirName}"] .slide h1 {
  font-size: clamp(2.7rem, 6vw, 4.1rem);
  font-weight: ${theme.titleWeight};
  margin-bottom: 1rem;
}

[data-theme="${theme.dirName}"] .slide h2 {
  font-size: clamp(1.9rem, 4vw, 2.6rem);
}

[data-theme="${theme.dirName}"] .slide h3 {
  font-size: 1.1rem;
  padding-top: 0.25rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

[data-theme="${theme.dirName}"] .slide p + h2,
[data-theme="${theme.dirName}"] .slide ul + h2,
[data-theme="${theme.dirName}"] .slide table + h2 {
  margin-top: 2.5rem;
}

[data-theme="${theme.dirName}"] .slide blockquote {
  background: ${theme.codeBg};
  border-left-color: ${theme.accent};
  border-radius: 10px;
  color: ${theme.text};
}

[data-theme="${theme.dirName}"] .slide a {
  border-bottom: 1px dashed currentColor;
}

[data-theme="${theme.dirName}"] .deck[data-slide-index="0"] .slide {
  text-align: ${theme.titleAlign};
  align-items: ${theme.titleAlign === "center" ? "center" : "flex-start"};
}

[data-theme="${theme.dirName}"] .deck[data-slide-index="0"] .slide p:first-of-type {
  margin-top: -0.3rem;
  margin-bottom: 1rem;
  color: ${theme.titleTaglineColor};
}

[data-theme="${theme.dirName}"] .deck[data-slide-index="0"] .slide p:last-of-type {
  margin-top: auto;
  color: ${theme.titleMetaColor};
}

${theme.extraCss}
`;
}

function renderParser(themeId: string): string {
  return seedFiles
    .get("src/engine/parser.ts")!
    .replace(/theme: \(data\.theme as string\) \?\? "[^"]+",/, `theme: (data.theme as string) ?? "${themeId}",`);
}

function renderMain(themeId: string): string {
  return `import { createRoot } from "react-dom/client";
import { App } from "./app";
import slidesRaw from "../slides.md?raw";
import "./styles/base.css";
import "./styles/themes/${themeId}.css";

createRoot(document.getElementById("root")!).render(<App markdown={slidesRaw} />);
`;
}

function renderSlides(config: TemplateConfig): string {
  return `---
title: ${config.title}
theme: ${config.dirName}
---

# ${config.title}

An open source slide design adapted from ${config.sourceProject}

${config.dirName}

---

# Source

- Project: ${config.sourceProject}
- Template: ${config.dirName}
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

function renderThirdPartyNotice(config: TemplateConfig): string {
  return `# Third-Party Notices

## ${config.sourceProject}

This template includes style adaptations from:

- Project: \`${config.sourceProject}\`
- Source: <${config.sourceUrl}>
- Theme source: <${config.themeSourceUrl}>
- License: MIT

${config.copyright}

${mitLicense}`;
}

const revealThemes: RevealTheme[] = [
  {
    dirName: "reveal.js-black",
    title: "Reveal.js Black",
    background: "#191919",
    backgroundColor: "#191919",
    mainFont: '"Source Sans Pro", Helvetica, sans-serif',
    headingFont: '"Source Sans Pro", Helvetica, sans-serif',
    mainColor: "#ffffff",
    headingColor: "#ffffff",
    accent: "#42affa",
    codeFont: "monospace",
    letterSpacing: "normal",
    textTransform: "uppercase",
    headingWeight: "600",
    headingShadow: "none",
  },
  {
    dirName: "reveal.js-white",
    title: "Reveal.js White",
    background: "#ffffff",
    backgroundColor: "#ffffff",
    mainFont: '"Source Sans Pro", Helvetica, sans-serif',
    headingFont: '"Source Sans Pro", Helvetica, sans-serif',
    mainColor: "#222222",
    headingColor: "#222222",
    accent: "#2a76dd",
    codeFont: "monospace",
    letterSpacing: "normal",
    textTransform: "uppercase",
    headingWeight: "600",
    headingShadow: "none",
  },
  {
    dirName: "reveal.js-league",
    title: "Reveal.js League",
    background: "radial-gradient(rgb(85, 90, 95), rgb(28, 30, 32))",
    backgroundColor: "rgb(28, 30, 32)",
    mainFont: "Lato, sans-serif",
    headingFont: '"League Gothic", Impact, sans-serif',
    mainColor: "#eeeeee",
    headingColor: "#eeeeee",
    accent: "#13daec",
    codeFont: "monospace",
    letterSpacing: "normal",
    textTransform: "uppercase",
    headingWeight: "400",
    headingShadow: "0 1px 0 rgba(0, 0, 0, 0.25)",
  },
  {
    dirName: "reveal.js-beige",
    title: "Reveal.js Beige",
    background: "radial-gradient(rgb(255, 255, 255), rgb(247, 242, 211))",
    backgroundColor: "#f7f3de",
    mainFont: '"Source Sans Pro", Helvetica, sans-serif',
    headingFont: '"Source Sans Pro", Helvetica, sans-serif',
    mainColor: "#333333",
    headingColor: "#333333",
    accent: "#8b743d",
    codeFont: "monospace",
    letterSpacing: "normal",
    textTransform: "uppercase",
    headingWeight: "600",
    headingShadow: "0 1px 0 rgba(255, 255, 255, 0.65)",
  },
  {
    dirName: "reveal.js-sky",
    title: "Reveal.js Sky",
    background: "radial-gradient(#f7fbfc, #add9e4)",
    backgroundColor: "#f7fbfc",
    mainFont: '"Open Sans", sans-serif',
    headingFont: '"Quicksand", sans-serif',
    mainColor: "#333333",
    headingColor: "#333333",
    accent: "#2a76dd",
    codeFont: "monospace",
    letterSpacing: "-0.05em",
    textTransform: "uppercase",
    headingWeight: "400",
    headingShadow: "none",
  },
  {
    dirName: "reveal.js-night",
    title: "Reveal.js Night",
    background: "#111111",
    backgroundColor: "#111111",
    mainFont: '"Open Sans", sans-serif',
    headingFont: '"Montserrat", Impact, sans-serif',
    mainColor: "#ffffff",
    headingColor: "#ffffff",
    accent: "#e7ad52",
    codeFont: "monospace",
    letterSpacing: "-0.03em",
    textTransform: "none",
    headingWeight: "400",
    headingShadow: "none",
  },
  {
    dirName: "reveal.js-serif",
    title: "Reveal.js Serif",
    background: "#f0f1eb",
    backgroundColor: "#f0f1eb",
    mainFont: '"Palatino Linotype", "Book Antiqua", Palatino, FreeSerif, serif',
    headingFont: '"Palatino Linotype", "Book Antiqua", Palatino, FreeSerif, serif',
    mainColor: "#000000",
    headingColor: "#383d3d",
    accent: "#51483d",
    codeFont: "monospace",
    letterSpacing: "normal",
    textTransform: "none",
    headingWeight: "600",
    headingShadow: "none",
  },
  {
    dirName: "reveal.js-simple",
    title: "Reveal.js Simple",
    background: "#ffffff",
    backgroundColor: "#ffffff",
    mainFont: "Lato, sans-serif",
    headingFont: '"News Cycle", Impact, sans-serif',
    mainColor: "#000000",
    headingColor: "#000000",
    accent: "#00008b",
    codeFont: "monospace",
    letterSpacing: "normal",
    textTransform: "uppercase",
    headingWeight: "600",
    headingShadow: "none",
  },
  {
    dirName: "reveal.js-solarized",
    title: "Reveal.js Solarized",
    background: "#fdf6e3",
    backgroundColor: "#fdf6e3",
    mainFont: "Lato, sans-serif",
    headingFont: '"League Gothic", Impact, sans-serif',
    mainColor: "#657b83",
    headingColor: "#586e75",
    accent: "#268bd2",
    codeFont: "monospace",
    letterSpacing: "normal",
    textTransform: "uppercase",
    headingWeight: "400",
    headingShadow: "none",
  },
  {
    dirName: "reveal.js-blood",
    title: "Reveal.js Blood",
    background: "#222222",
    backgroundColor: "#222222",
    mainFont: "Ubuntu, sans-serif",
    headingFont: "Ubuntu, sans-serif",
    mainColor: "#eeeeee",
    headingColor: "#eeeeee",
    accent: "#aa2233",
    codeFont: "monospace",
    letterSpacing: "normal",
    textTransform: "uppercase",
    headingWeight: "400",
    headingShadow: "2px 2px 2px #222222",
  },
  {
    dirName: "reveal.js-moon",
    title: "Reveal.js Moon",
    background: "#002b36",
    backgroundColor: "#002b36",
    mainFont: "Lato, sans-serif",
    headingFont: '"League Gothic", Impact, sans-serif',
    mainColor: "#93a1a1",
    headingColor: "#eee8d5",
    accent: "#268bd2",
    codeFont: "monospace",
    letterSpacing: "normal",
    textTransform: "uppercase",
    headingWeight: "400",
    headingShadow: "none",
  },
  {
    dirName: "reveal.js-dracula",
    title: "Reveal.js Dracula",
    background: "#191919",
    backgroundColor: "#191919",
    mainFont:
      '-apple-system, BlinkMacSystemFont, "Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    headingFont:
      '-apple-system, BlinkMacSystemFont, "Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    mainColor: "#f8f8f2",
    headingColor: "#bd93f9",
    accent: "#ff79c6",
    codeFont: '"Fira Code", Menlo, Consolas, Monaco, "Liberation Mono", "Lucida Console", monospace',
    letterSpacing: "normal",
    textTransform: "none",
    headingWeight: "600",
    headingShadow: "none",
  },
];

const marpThemes: MarpTheme[] = [
  {
    dirName: "marp-core-default",
    title: "Marp Core Default",
    fontSans:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontMono: '"SFMono-Regular", Menlo, Consolas, monospace',
    background: "#ffffff",
    surface: "#ffffff",
    text: "#24292f",
    heading: "#224466",
    accent: "#2f81f7",
    accentSoft: "#7bb5ff",
    codeBg: "#f6f8fa",
    line: "rgba(36, 41, 47, 0.12)",
    headingWeight: "700",
    headingTransform: "none",
    bodyLetterSpacing: "0",
    titleAlign: "left",
    titleTaglineColor: "#57606a",
    titleMetaColor: "#6e7781",
    extraCss: `
[data-theme="marp-core-default"] .slide h1 {
  border-bottom: none;
}
`,
    sourceThemeUrl: "https://raw.githubusercontent.com/marp-team/marp-core/main/themes/default.scss",
    copyright: "Copyright (c) 2018 Marp team (marp-team@marp.app)",
  },
  {
    dirName: "marp-core-gaia",
    title: "Marp Core Gaia",
    fontSans: 'Lato, "Avenir Next", Avenir, "Trebuchet MS", "Segoe UI", sans-serif',
    fontMono: '"Roboto Mono", monospace',
    background: "#fff8e1",
    surface: "#fff8e1",
    text: "#455a64",
    heading: "#455a64",
    accent: "#0288d1",
    accentSoft: "#81d4fa",
    codeBg: "rgba(69, 90, 100, 0.08)",
    line: "rgba(69, 90, 100, 0.2)",
    headingWeight: "800",
    headingTransform: "none",
    bodyLetterSpacing: "0.04em",
    titleAlign: "left",
    titleTaglineColor: "#0288d1",
    titleMetaColor: "#6a7e86",
    extraCss: `
[data-theme="marp-core-gaia"] .slide {
  background-image: linear-gradient(135deg, rgba(136, 136, 136, 0), rgba(136, 136, 136, 0.02) 50%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.05));
}
`,
    sourceThemeUrl: "https://raw.githubusercontent.com/marp-team/marp-core/main/themes/gaia.scss",
    copyright: "Copyright (c) 2018 Marp team (marp-team@marp.app)",
  },
  {
    dirName: "marp-core-uncover",
    title: "Marp Core Uncover",
    fontSans:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    fontMono: '"SFMono-Regular", Menlo, Consolas, monospace',
    background: "#fdfcff",
    surface: "#fdfcff",
    text: "#202228",
    heading: "#202228",
    accent: "#009dd5",
    accentSoft: "#66d1f2",
    codeBg: "rgba(32, 34, 40, 0.05)",
    line: "rgba(32, 34, 40, 0.12)",
    headingWeight: "700",
    headingTransform: "uppercase",
    bodyLetterSpacing: "0.08em",
    titleAlign: "center",
    titleTaglineColor: "#009dd5",
    titleMetaColor: "rgba(32, 34, 40, 0.5)",
    extraCss: `
[data-theme="marp-core-uncover"] .slide {
  text-align: center;
}

[data-theme="marp-core-uncover"] .slide-number {
  right: 0;
  bottom: 0;
  width: 5rem;
  height: 5rem;
  padding: 1rem;
  background: linear-gradient(-45deg, rgba(32, 34, 40, 0.05) 50%, transparent 50%);
  text-align: right;
}
`,
    sourceThemeUrl: "https://raw.githubusercontent.com/marp-team/marp-core/main/themes/uncover.scss",
    copyright: "Copyright (c) 2018 Marp team (marp-team@marp.app)",
  },
];

const slidevThemes: SlidevTheme[] = [
  {
    dirName: "themes-default",
    title: "Slidev Themes Default",
    fontSans:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontHeading:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontMono: '"SFMono-Regular", Menlo, Consolas, monospace',
    background: "#ffffff",
    surface: "#ffffff",
    text: "#1f2937",
    heading: "#111827",
    accent: "#3b82f6",
    accentMuted: "rgba(59, 130, 246, 0.08)",
    codeBg: "#f3f4f6",
    line: "rgba(17, 24, 39, 0.12)",
    titleAlign: "left",
    titleTaglineColor: "rgba(17, 24, 39, 0.55)",
    titleMetaColor: "rgba(17, 24, 39, 0.45)",
    titleWeight: "700",
    extraCss: `
[data-theme="themes-default"] .slide h6,
[data-theme="themes-default"] .slide h3 {
  opacity: 0.4;
}
`,
    sourceThemeUrl: "https://registry.npmjs.org/@slidev/theme-default/-/theme-default-0.25.0.tgz",
  },
  {
    dirName: "themes-seriph",
    title: "Slidev Themes Seriph",
    fontSans: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
    fontHeading: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
    fontMono: '"SFMono-Regular", Menlo, Consolas, monospace',
    background: "#fcfbf7",
    surface: "#fcfbf7",
    text: "#2d3748",
    heading: "#2d3748",
    accent: "#5d8392",
    accentMuted: "rgba(93, 131, 146, 0.1)",
    codeBg: "#f5f3ee",
    line: "rgba(45, 55, 72, 0.12)",
    titleAlign: "left",
    titleTaglineColor: "#5d8392",
    titleMetaColor: "rgba(45, 55, 72, 0.45)",
    titleWeight: "700",
    extraCss: `
[data-theme="themes-seriph"] .slide h1 + p {
  opacity: 0.75;
}
`,
    sourceThemeUrl: "https://registry.npmjs.org/@slidev/theme-seriph/-/theme-seriph-0.25.0.tgz",
  },
  {
    dirName: "themes-apple-basic",
    title: "Slidev Themes Apple Basic",
    fontSans:
      '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontHeading:
      '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono: '"SFMono-Regular", Menlo, Consolas, monospace',
    background: "#f5f5f7",
    surface: "#ffffff",
    text: "#1d1d1f",
    heading: "#111111",
    accent: "#0071e3",
    accentMuted: "rgba(0, 113, 227, 0.08)",
    codeBg: "#f2f2f2",
    line: "rgba(29, 29, 31, 0.12)",
    titleAlign: "left",
    titleTaglineColor: "#6e6e73",
    titleMetaColor: "#86868b",
    titleWeight: "700",
    extraCss: `
[data-theme="themes-apple-basic"] .slide {
  border-radius: 32px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.08);
}

[data-theme="themes-apple-basic"] .deck {
  background: linear-gradient(180deg, #f5f5f7, #ececf0);
}
`,
    sourceThemeUrl: "https://registry.npmjs.org/@slidev/theme-apple-basic/-/theme-apple-basic-0.25.1.tgz",
  },
  {
    dirName: "slidev-theme-geist",
    title: "Slidev Theme Geist",
    fontSans:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontHeading:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontMono: '"SFMono-Regular", Menlo, Consolas, monospace',
    background: "#ffffff",
    surface: "#ffffff",
    text: "#444444",
    heading: "#000000",
    accent: "#0070f3",
    accentMuted: "rgba(0, 112, 243, 0.08)",
    codeBg: "#fafafa",
    line: "#eaeaea",
    titleAlign: "left",
    titleTaglineColor: "#666666",
    titleMetaColor: "#888888",
    titleWeight: "800",
    extraCss: `
[data-theme="slidev-theme-geist"] .slide {
  border-radius: 0;
  box-shadow: none;
  border: 1px solid #eaeaea;
}

[data-theme="slidev-theme-geist"] .slide strong {
  color: #111111;
}
`,
    sourceThemeUrl: "https://registry.npmjs.org/slidev-theme-geist/-/slidev-theme-geist-0.8.1.tgz",
  },
];

const templates: TemplateConfig[] = [
  {
    dirName: "quarto-revealjs-clean",
    title: "Quarto Reveal.js Clean",
    family: "quarto",
    sourceProject: "grantmcdermott/quarto-revealjs-clean",
    sourceUrl: "https://github.com/grantmcdermott/quarto-revealjs-clean",
    themeSourceUrl:
      "https://raw.githubusercontent.com/grantmcdermott/quarto-revealjs-clean/main/_extensions/clean/clean.scss",
    licenseUrl: "https://github.com/grantmcdermott/quarto-revealjs-clean/blob/main/LICENSE",
    copyright: "Copyright (c) 2023 Grant McDermott",
    themeCss: quartoThemeCss("quarto-revealjs-clean"),
  },
  ...revealThemes.map<TemplateConfig>((theme) => ({
    dirName: theme.dirName,
    title: theme.title,
    family: "reveal",
    sourceProject: "hakimel/reveal.js",
    sourceUrl: "https://github.com/hakimel/reveal.js",
    themeSourceUrl: `https://raw.githubusercontent.com/hakimel/reveal.js/master/dist/theme/${theme.dirName.replace("reveal.js-", "")}.css`,
    licenseUrl: "https://github.com/hakimel/reveal.js/blob/master/LICENSE",
    copyright: "Copyright (C) 2011-2026 Hakim El Hattab, http://hakim.se, and reveal.js contributors",
    themeCss: renderRevealCss(theme),
  })),
  ...marpThemes.map<TemplateConfig>((theme) => ({
    dirName: theme.dirName,
    title: theme.title,
    family: "marp",
    sourceProject: "marp-team/marp-core",
    sourceUrl: "https://github.com/marp-team/marp-core",
    themeSourceUrl: theme.sourceThemeUrl,
    licenseUrl: "https://github.com/marp-team/marp-core/blob/main/LICENSE",
    copyright: theme.copyright,
    themeCss: renderMarpCss(theme),
  })),
  ...slidevThemes.map<TemplateConfig>((theme) => ({
    dirName: theme.dirName,
    title: theme.title,
    family: "slidev",
    sourceProject:
      theme.dirName === "slidev-theme-geist" ? "nico-bachner/slidev-theme-geist" : "slidevjs/themes",
    sourceUrl:
      theme.dirName === "slidev-theme-geist"
        ? "https://github.com/nico-bachner/slidev-theme-geist"
        : "https://github.com/slidevjs/themes",
    themeSourceUrl: theme.sourceThemeUrl,
    licenseUrl:
      theme.dirName === "slidev-theme-geist"
        ? "https://github.com/nico-bachner/slidev-theme-geist/blob/main/LICENSE"
        : "https://github.com/slidevjs/themes/blob/main/LICENSE",
    copyright:
      theme.dirName === "slidev-theme-geist"
        ? "Copyright (c) 2021 Nico Bachner"
        : "Copyright (c) 2021 Slidev.js Team",
    themeCss: renderSlidevCss(theme),
  })),
];

function writeFile(targetPath: string, content: string): void {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content);
}

for (const config of templates) {
  const targetDir = path.join(templatesRoot, config.dirName);
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  for (const [relativePath, content] of seedFiles) {
    writeFile(path.join(targetDir, relativePath), content);
  }

  writeFile(path.join(targetDir, "src/engine/parser.ts"), renderParser(config.dirName));
  writeFile(path.join(targetDir, "src/main.tsx"), renderMain(config.dirName));
  writeFile(path.join(targetDir, "slides.md"), renderSlides(config));
  writeFile(path.join(targetDir, "THIRD_PARTY_NOTICES.md"), renderThirdPartyNotice(config));
  writeFile(path.join(targetDir, "src/styles/themes", `${config.dirName}.css`), `${config.themeCss}\n`);
}

console.log(`Generated ${templates.length} templates.`);
