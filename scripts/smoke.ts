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
      args: ["Smoke Slides", "--theme", "reveal.js-white", "--scaffold-only"],
      targetDir: path.join(tempRoot, "Smoke Slides"),
      expectedPackageName: "smoke-slides",
      expectedSlides: undefined,
      expectedTheme: "reveal.js-white",
    },
    {
      label: "markdown import",
      args: ["input-deck.md", "--theme", "reveal.js-black", "--scaffold-only"],
      targetDir: path.join(tempRoot, "input-deck"),
      expectedPackageName: "input-deck",
      expectedSlides:
        "---\ntheme: reveal.js-black\n---\n\n# Imported Deck\n\nHello from smoke test.\n",
      expectedTheme: "reveal.js-black",
    },
    {
      label: "deprecated template alias",
      args: ["Alias Slides", "--template", "academic", "--scaffold-only"],
      targetDir: path.join(tempRoot, "Alias Slides"),
      expectedPackageName: "alias-slides",
      expectedSlides: undefined,
      expectedTheme: "academic",
    },
  ] as const;

  fs.writeFileSync(
    path.join(tempRoot, "input-deck.md"),
    "# Imported Deck\n\nHello from smoke test.\n",
  );

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

    const pkg = JSON.parse(
      fs.readFileSync(path.join(smokeCase.targetDir, "package.json"), "utf8"),
    ) as {
      name?: string;
    };

    if (pkg.name !== smokeCase.expectedPackageName) {
      throw new Error(
        `${smokeCase.label} package mismatch: expected "${smokeCase.expectedPackageName}", got "${pkg.name}"`,
      );
    }

    for (const requiredFile of ["src/main.tsx", "src/app.tsx"]) {
      if (!fs.existsSync(path.join(smokeCase.targetDir, requiredFile))) {
        throw new Error(`${smokeCase.label} missing generated file: ${requiredFile}`);
      }
    }

    const manifest = JSON.parse(
      fs.readFileSync(path.join(smokeCase.targetDir, "themes.json"), "utf8"),
    ) as unknown;
    if (!Array.isArray(manifest) || manifest.some((value) => typeof value !== "string")) {
      throw new Error(`${smokeCase.label} themes.json is invalid`);
    }

    const themeNames = manifest as string[];
    if (!themeNames.includes(smokeCase.expectedTheme)) {
      throw new Error(`${smokeCase.label} themes.json does not contain ${smokeCase.expectedTheme}`);
    }

    for (const themeName of themeNames) {
      const themePath = path.join(
        smokeCase.targetDir,
        "src",
        "styles",
        "themes",
        `${themeName}.css`,
      );
      if (!fs.existsSync(themePath)) {
        throw new Error(`${smokeCase.label} missing theme stylesheet: ${themeName}.css`);
      }
    }

    if (smokeCase.expectedSlides) {
      const generatedSlides = fs.readFileSync(
        path.join(smokeCase.targetDir, "input-deck.md"),
        "utf8",
      );
      if (generatedSlides !== smokeCase.expectedSlides) {
        throw new Error(`${smokeCase.label} did not copy the source markdown`);
      }
    }
  }

  const unknownTheme = spawnSync(
    process.execPath,
    [path.join(repoRoot, "dist/cli.js"), "Unknown Theme", "--theme", "default", "--scaffold-only"],
    {
      cwd: tempRoot,
      encoding: "utf8",
    },
  );

  if (unknownTheme.status === 0) {
    throw new Error("unknown theme should have failed");
  }

  if (!(unknownTheme.stderr || unknownTheme.stdout).includes('Unknown theme "default"')) {
    throw new Error("unknown theme did not produce the expected error");
  }

  const unknownOption = spawnSync(
    process.execPath,
    [path.join(repoRoot, "dist/cli.js"), "--list-template"],
    {
      cwd: tempRoot,
      encoding: "utf8",
    },
  );

  if (unknownOption.status === 0) {
    throw new Error("unknown option should have failed");
  }

  if (
    !(unknownOption.stderr || unknownOption.stdout).includes("Unknown argument: --list-template")
  ) {
    throw new Error("unknown option did not produce the expected error");
  }

  fs.writeFileSync(
    path.join(tempRoot, "input-deck.md"),
    "# Imported Deck\n\nUpdated from source.\n",
  );

  const resyncResult = spawnSync(
    process.execPath,
    [
      path.join(repoRoot, "dist/cli.js"),
      "input-deck.md",
      "--theme",
      "reveal.js-black",
      "--scaffold-only",
    ],
    {
      cwd: tempRoot,
      encoding: "utf8",
    },
  );

  if (resyncResult.status !== 0) {
    throw new Error(
      `markdown resync failed: ${resyncResult.stderr || resyncResult.stdout || "failed"}`,
    );
  }

  const resyncedSlides = fs.readFileSync(
    path.join(tempRoot, "input-deck", "input-deck.md"),
    "utf8",
  );
  if (resyncedSlides !== "# Imported Deck\n\nUpdated from source.\n") {
    throw new Error("existing project did not refresh from the source markdown");
  }

  fs.writeFileSync(path.join(tempRoot, "input-deck", "input-deck.md"), "# Local change\n");
  fs.writeFileSync(path.join(tempRoot, "input-deck.md"), "# Imported Deck\n\nUpdated again.\n");

  const conflictResult = spawnSync(
    process.execPath,
    [
      path.join(repoRoot, "dist/cli.js"),
      "input-deck.md",
      "--theme",
      "reveal.js-black",
      "--scaffold-only",
    ],
    {
      cwd: tempRoot,
      encoding: "utf8",
    },
  );

  if (conflictResult.status === 0) {
    throw new Error("markdown conflict should have failed");
  }

  if (
    !(conflictResult.stderr || conflictResult.stdout).includes(
      'Refusing to overwrite "input-deck.md" because the project copy was modified after import.',
    )
  ) {
    throw new Error("markdown conflict did not produce the expected error");
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
    [
      path.join(repoRoot, "dist/cli.js"),
      "example.md",
      "--theme",
      "reveal.js-black",
      "--scaffold-only",
    ],
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

  const autoCreateSlides = fs.readFileSync(path.join(tempRoot, "example", "example.md"), "utf8");
  if (!autoCreateSlides.includes("# Example Slides")) {
    throw new Error("auto-created project did not copy example.md");
  }

  if (!autoCreateSlides.includes("theme: reveal.js-black")) {
    throw new Error("auto-created project did not set the selected theme");
  }

  const mainTsx = fs.readFileSync(path.join(tempRoot, "example", "src", "main.tsx"), "utf8");
  if (!mainTsx.includes('"../example.md?raw"')) {
    throw new Error("main.tsx does not import the correct markdown file");
  }

  if (!mainTsx.includes('"./styles/themes/index.css"')) {
    throw new Error("main.tsx does not import the universal theme index");
  }

  const rerunResult = spawnSync(
    process.execPath,
    [
      path.join(repoRoot, "dist/cli.js"),
      "example.md",
      "--theme",
      "reveal.js-black",
      "--scaffold-only",
    ],
    {
      cwd: tempRoot,
      encoding: "utf8",
    },
  );

  if (rerunResult.status !== 0) {
    throw new Error(
      `re-run on existing directory failed: ${rerunResult.stderr || rerunResult.stdout || "failed"}`,
    );
  }

  console.log(`Smoke test passed: ${tempRoot}`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
