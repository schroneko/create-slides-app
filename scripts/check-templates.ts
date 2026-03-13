import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const seedTemplate = path.join(repoRoot, "templates", "reveal.js-black");

const install = spawnSync("npm", ["install"], {
  cwd: seedTemplate,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (install.status !== 0) {
  throw new Error("Seed template install failed");
}

const build = spawnSync("npm", ["run", "build"], {
  cwd: seedTemplate,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (build.status !== 0) {
  throw new Error("Seed template build failed");
}

console.log("Seed template (reveal.js-black) verified.");
