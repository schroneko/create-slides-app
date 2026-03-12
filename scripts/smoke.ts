import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-slides-app-"));

try {
  const cases = [
    {
      label: "project name",
      args: ["Smoke Slides", "--template", "reveal.js-white", "--scaffold-only"],
      targetDir: path.join(tempRoot, "Smoke Slides"),
      expectedPackageName: "smoke-slides",
      expectedSlides: undefined,
    },
    {
      label: "markdown import",
      args: ["input-deck.md", "--template", "reveal.js-black", "--scaffold-only"],
      targetDir: path.join(tempRoot, "input-deck"),
      expectedPackageName: "input-deck",
      expectedSlides: "# Imported Deck\n\nHello from smoke test.\n",
    },
  ] as const;

  fs.writeFileSync(path.join(tempRoot, "input-deck.md"), "# Imported Deck\n\nHello from smoke test.\n");

  for (const smokeCase of cases) {
    const result = spawnSync(
      process.execPath,
      [path.join(repoRoot, "dist/cli.js"), ...smokeCase.args],
      {
        cwd: tempRoot,
        encoding: "utf8",
      },
    );

    if (result.status !== 0) {
      throw new Error(
        `${smokeCase.label} failed: ${result.stderr || result.stdout || "CLI smoke test failed"}`,
      );
    }

    const pkg = JSON.parse(fs.readFileSync(path.join(smokeCase.targetDir, "package.json"), "utf8")) as {
      name?: string;
    };

    if (pkg.name !== smokeCase.expectedPackageName) {
      throw new Error(
        `${smokeCase.label} package mismatch: expected "${smokeCase.expectedPackageName}", got "${pkg.name}"`,
      );
    }

    for (const requiredFile of ["slides.md", "src/main.tsx", "src/app.tsx"]) {
      if (!fs.existsSync(path.join(smokeCase.targetDir, requiredFile))) {
        throw new Error(`${smokeCase.label} missing generated file: ${requiredFile}`);
      }
    }

    if (smokeCase.expectedSlides) {
      const generatedSlides = fs.readFileSync(path.join(smokeCase.targetDir, "slides.md"), "utf8");
      if (generatedSlides !== smokeCase.expectedSlides) {
        throw new Error(`${smokeCase.label} did not copy the source markdown`);
      }
    }
  }

  const unknownTemplate = spawnSync(
    process.execPath,
    [path.join(repoRoot, "dist/cli.js"), "Unknown Template", "--template", "default", "--scaffold-only"],
    {
      cwd: tempRoot,
      encoding: "utf8",
    },
  );

  if (unknownTemplate.status === 0) {
    throw new Error("unknown template should have failed");
  }

  if (!(unknownTemplate.stderr || unknownTemplate.stdout).includes('Unknown template "default"')) {
    throw new Error("unknown template did not produce the expected error");
  }

  const copiedThemeCss = fs.readFileSync(
    path.join(tempRoot, "input-deck", "src", "styles", "themes", "reveal.js-black.css"),
    "utf8",
  );

  if (!copiedThemeCss.includes('[data-theme="reveal.js-black"]')) {
    throw new Error("copied template does not include the expected theme stylesheet");
  }

  const autoCreateResult = spawnSync(
    process.execPath,
    [path.join(repoRoot, "dist/cli.js"), "example.md", "--template", "reveal.js-black", "--scaffold-only"],
    {
      cwd: tempRoot,
      encoding: "utf8",
    },
  );

  if (autoCreateResult.status !== 0) {
    throw new Error(
      `example.md auto-create failed: ${autoCreateResult.stderr || autoCreateResult.stdout || "failed"}`,
    );
  }

  const createdMd = fs.readFileSync(path.join(tempRoot, "example.md"), "utf8");
  if (!createdMd.includes("# Example Slides")) {
    throw new Error("auto-created example.md does not contain expected content");
  }

  const autoCreateSlides = fs.readFileSync(path.join(tempRoot, "example", "slides.md"), "utf8");
  if (!autoCreateSlides.includes("# Example Slides")) {
    throw new Error("auto-created project did not copy example.md to slides.md");
  }

  console.log(`Smoke test passed: ${tempRoot}`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
