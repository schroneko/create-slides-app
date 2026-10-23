import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

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

  const audit = spawnSync("npm", ["audit"], {
    cwd: copiedTemplateDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (audit.status !== 0) {
    throw new Error("Template security audit failed: default");
  }

  const mathArgs = [
    "--input-type=module",
    "-e",
    'import assert from "node:assert/strict"; import katex from "katex"; import {unified} from "unified"; import remarkParse from "remark-parse"; import remarkMath from "remark-math"; import remarkRehype from "remark-rehype"; import rehypeKatex from "rehype-katex"; assert.match(katex.renderToString("x^2 + y^2"), /katex/); const processor = unified().use(remarkParse).use(remarkMath).use(remarkRehype).use(rehypeKatex); const result = await processor.run(processor.parse("$x^2 + y^2$")); assert.match(JSON.stringify(result), /katex/);',
  ];
  const math = spawnSync(process.execPath, mathArgs, {
    cwd: copiedTemplateDir,
    stdio: "inherit",
  });

  if (math.status !== 0) {
    throw new Error("Template math rendering failed: default");
  }

  const build = spawnSync("npm", ["run", "build"], {
    cwd: copiedTemplateDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (build.status !== 0) {
    throw new Error("Template build failed: default");
  }

  const reusedRuntimeDir = path.join(tempRoot, "themes", "reveal.js-black");
  fs.mkdirSync(path.dirname(reusedRuntimeDir), { recursive: true });
  fs.renameSync(copiedTemplateDir, reusedRuntimeDir);
  const reusedPackagePath = path.join(reusedRuntimeDir, "package.json");
  const reusedPackage = JSON.parse(fs.readFileSync(reusedPackagePath, "utf8"));
  reusedPackage.name = "custom-reused-runtime";
  reusedPackage.dependencies.katex = "0.16.22";
  reusedPackage.dependencies["is-number"] = "7.0.0";
  reusedPackage.scripts.custom = "node -e 'process.exit(0)'";
  reusedPackage.overrides.katex = "0.16.22";
  reusedPackage.overrides.tinypool = "2.1.0";
  reusedPackage.overrides["is-number"] = "7.0.0";
  fs.writeFileSync(reusedPackagePath, JSON.stringify(reusedPackage, null, 2) + "\n");
  const reusedMarkdown = "---\ntheme: reveal.js-black\n---\n\n# Reused runtime\n\n$x^2 + y^2$\n";
  fs.writeFileSync(path.join(tempRoot, "reused.md"), reusedMarkdown);
  const reusedBuild = spawnSync(
    process.execPath,
    [path.join(repoRoot, "dist/cli.js"), "reused.md", "--theme", "reveal.js-black", "--build"],
    { cwd: tempRoot, stdio: "inherit" },
  );
  assert.equal(reusedBuild.status, 0, "Existing runtime CLI install and build failed");
  const refreshedPackage = JSON.parse(fs.readFileSync(reusedPackagePath, "utf8"));
  const templatePackage = JSON.parse(
    fs.readFileSync(path.join(defaultTemplateDir, "package.json"), "utf8"),
  );
  assert.deepEqual(refreshedPackage, {
    ...reusedPackage,
    dependencies: { ...reusedPackage.dependencies, katex: templatePackage.dependencies.katex },
    overrides: { ...reusedPackage.overrides, ...templatePackage.overrides },
  });
  assert.equal(fs.readFileSync(path.join(tempRoot, "reused.md"), "utf8"), reusedMarkdown);
  const reusedAudit = spawnSync("npm", ["audit"], {
    cwd: reusedRuntimeDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  assert.equal(reusedAudit.status, 0, "Existing runtime security audit failed");
  const reusedMath = spawnSync(process.execPath, mathArgs, {
    cwd: reusedRuntimeDir,
    stdio: "inherit",
  });
  assert.equal(reusedMath.status, 0, "Existing runtime math rendering failed");

  console.log(`Verified templates/default with ${uniqueThemeNames.length} themes and built it.`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
