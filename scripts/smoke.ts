import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-slides-app-"));
const projectName = "Smoke Slides";
const targetDir = path.join(tempRoot, projectName);
const expectedPackageName = "smoke-slides";

try {
  const result = spawnSync(
    process.execPath,
    [path.join(repoRoot, "dist/cli.js"), projectName, "--template", "default"],
    {
      cwd: tempRoot,
      encoding: "utf8",
    },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "CLI smoke test failed");
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8")) as {
    name?: string;
  };

  if (pkg.name !== expectedPackageName) {
    throw new Error(
      `Generated package name mismatch: expected "${expectedPackageName}", got "${pkg.name}"`,
    );
  }

  for (const requiredFile of ["slides.md", "src/main.tsx", "src/app.tsx"]) {
    if (!fs.existsSync(path.join(targetDir, requiredFile))) {
      throw new Error(`Missing generated file: ${requiredFile}`);
    }
  }

  console.log(`Smoke test passed: ${targetDir}`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
