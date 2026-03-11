import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const templatesRoot = path.join(repoRoot, "templates");

const templates = fs
  .readdirSync(templatesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const template of templates) {
  const templateDir = path.join(templatesRoot, template);
  const command = fs.existsSync(path.join(templateDir, "package-lock.json")) ? "ci" : "install";
  const result = spawnSync("npm", [command], {
    cwd: templateDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(`Template install failed: ${template}`);
  }
}

console.log(`Installed dependencies for ${templates.length} templates.`);
