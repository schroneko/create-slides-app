import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const templatesRoot = path.join(repoRoot, "templates");
const defaultTemplateDir = path.join(templatesRoot, "default");
const manifestPath = path.join(defaultTemplateDir, "themes.json");

const requiredRelativePaths = [
  "THIRD_PARTY_NOTICES.md",
  "example.md",
  "index.html",
  "package.json",
  "src/app.tsx",
  "src/engine/deck.tsx",
  "src/engine/frontmatter.ts",
  "src/engine/navigation.ts",
  "src/engine/parser.ts",
  "src/engine/presenter.tsx",
  "src/engine/slide.tsx",
  "src/main.tsx",
  "src/styles/base.css",
  "src/styles/themes/index.css",
  "themes.json",
  "tsconfig.json",
  "vite.config.ts",
];

const templateDirs = fs
  .readdirSync(templatesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (templateDirs.length !== 1 || templateDirs[0] !== "default") {
  throw new Error(`Expected only templates/default, found: ${templateDirs.join(", ") || "(none)"}`);
}

for (const relativePath of requiredRelativePaths) {
  const targetPath = path.join(defaultTemplateDir, relativePath);
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Template "default" is missing ${relativePath}`);
  }
}

const themeNames = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as unknown;
if (!Array.isArray(themeNames) || themeNames.some((value) => typeof value !== "string")) {
  throw new Error("themes.json must be an array of strings");
}

const sortedThemeNames = [...themeNames].sort();
const uniqueThemeNames = [...new Set(sortedThemeNames)];
if (sortedThemeNames.length !== uniqueThemeNames.length) {
  throw new Error("themes.json contains duplicate theme names");
}

for (const themeName of uniqueThemeNames) {
  const themePath = path.join(defaultTemplateDir, "src", "styles", "themes", `${themeName}.css`);
  if (!fs.existsSync(themePath)) {
    throw new Error(`Template "default" is missing src/styles/themes/${themeName}.css`);
  }
}

const indexCss = fs.readFileSync(
  path.join(defaultTemplateDir, "src", "styles", "themes", "index.css"),
  "utf8",
);
for (const themeName of uniqueThemeNames) {
  if (!indexCss.includes(`@import "./${themeName}.css";`)) {
    throw new Error(`Theme index is missing import for ${themeName}.css`);
  }
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-slides-app-templates-"));

try {
  const copiedTemplateDir = path.join(tempRoot, "default");
  fs.cpSync(defaultTemplateDir, copiedTemplateDir, { recursive: true });

  const install = spawnSync("npm", ["install"], {
    cwd: copiedTemplateDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (install.status !== 0) {
    throw new Error("Template install failed: default");
  }

  const build = spawnSync("npm", ["run", "build"], {
    cwd: copiedTemplateDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (build.status !== 0) {
    throw new Error("Template build failed: default");
  }

  console.log(`Verified templates/default with ${uniqueThemeNames.length} themes and built it.`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
