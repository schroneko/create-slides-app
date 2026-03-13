import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const templatesRoot = path.join(repoRoot, "templates");
const templateNames = fs
  .readdirSync(templatesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

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
  "tsconfig.json",
  "vite.config.ts",
];

for (const templateName of templateNames) {
  const templateDir = path.join(templatesRoot, templateName);

  for (const relativePath of requiredRelativePaths) {
    const targetPath = path.join(templateDir, relativePath);
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Template "${templateName}" is missing ${relativePath}`);
    }
  }

  const themePath = path.join(templateDir, "src", "styles", "themes", `${templateName}.css`);
  if (!fs.existsSync(themePath)) {
    throw new Error(`Template "${templateName}" is missing src/styles/themes/${templateName}.css`);
  }
}

const sampleTemplates = ["reveal.js-black", "reveal.js-black-contrast", "academic"];
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-slides-app-templates-"));

try {
  const copiedTemplateDirs = sampleTemplates.map((templateName) => {
    const sourceDir = path.join(templatesRoot, templateName);
    const targetDir = path.join(tempRoot, templateName);
    fs.cpSync(sourceDir, targetDir, { recursive: true });
    return targetDir;
  });

  const install = spawnSync("npm", ["install"], {
    cwd: copiedTemplateDirs[0],
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (install.status !== 0) {
    throw new Error(`Template install failed: ${sampleTemplates[0]}`);
  }

  for (const templateDir of copiedTemplateDirs.slice(1)) {
    fs.cpSync(path.join(copiedTemplateDirs[0], "node_modules"), path.join(templateDir, "node_modules"), {
      recursive: true,
    });
  }

  for (const [index, templateName] of sampleTemplates.entries()) {
    const build = spawnSync("npm", ["run", "build"], {
      cwd: copiedTemplateDirs[index],
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    if (build.status !== 0) {
      throw new Error(`Template build failed: ${templateName}`);
    }
  }

  console.log(
    `Verified ${templateNames.length} template directories and built ${sampleTemplates.join(", ")}.`,
  );
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
