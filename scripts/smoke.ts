import assert from "node:assert/strict";
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
      targetDir: path.join(tempRoot, "themes", "reveal.js-white"),
      expectedPackageName: "reveal.js-white",
      expectedTheme: "reveal.js-white",
      sourceMarkdownPath: path.join(tempRoot, "Smoke Slides.md"),
    },
    {
      label: "markdown import",
      args: ["input-deck.md", "--theme", "reveal.js-black", "--scaffold-only"],
      targetDir: path.join(tempRoot, "themes", "reveal.js-black"),
      expectedPackageName: "reveal.js-black",
      expectedTheme: "reveal.js-black",
      sourceMarkdownPath: path.join(tempRoot, "input-deck.md"),
      expectedSourceMarkdown:
        "---\ntheme: reveal.js-black\n---\n\n# Imported Deck\n\nHello from smoke test.\n",
    },
    {
      label: "deprecated template alias",
      args: ["Alias Slides", "--template", "academic", "--scaffold-only"],
      targetDir: path.join(tempRoot, "themes", "academic"),
      expectedPackageName: "academic",
      expectedTheme: "academic",
      sourceMarkdownPath: path.join(tempRoot, "Alias Slides.md"),
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

    for (const requiredFile of ["src/main.tsx", "src/app.tsx", "vite.config.ts"]) {
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
    if (themeNames.length !== 1 || themeNames[0] !== smokeCase.expectedTheme) {
      throw new Error(
        `${smokeCase.label} themes.json should contain only ${smokeCase.expectedTheme}`,
      );
    }

    const themePath = path.join(
      smokeCase.targetDir,
      "src",
      "styles",
      "themes",
      `${smokeCase.expectedTheme}.css`,
    );
    if (!fs.existsSync(themePath)) {
      throw new Error(
        `${smokeCase.label} missing theme stylesheet: ${smokeCase.expectedTheme}.css`,
      );
    }

    if (fs.existsSync(path.join(smokeCase.targetDir, "slides.md"))) {
      throw new Error(`${smokeCase.label} should not create an internal markdown copy`);
    }

    if (!fs.existsSync(smokeCase.sourceMarkdownPath)) {
      throw new Error(`${smokeCase.label} did not leave the source markdown in place`);
    }

    if (smokeCase.expectedSourceMarkdown) {
      const sourceMarkdown = fs.readFileSync(smokeCase.sourceMarkdownPath, "utf8");
      if (sourceMarkdown !== smokeCase.expectedSourceMarkdown) {
        throw new Error(`${smokeCase.label} did not update the source markdown as expected`);
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

  const resyncedMarkdown = fs.readFileSync(path.join(tempRoot, "input-deck.md"), "utf8");
  if (
    resyncedMarkdown !==
    "---\ntheme: reveal.js-black\n---\n\n# Imported Deck\n\nUpdated from source.\n"
  ) {
    throw new Error("source markdown did not refresh as expected");
  }

  const copiedThemeCss = fs.readFileSync(
    path.join(
      tempRoot,
      "themes",
      "reveal.js-black",
      "src",
      "styles",
      "themes",
      "reveal.js-black.css",
    ),
    "utf8",
  );

  if (!copiedThemeCss.includes('[data-theme="reveal.js-black"]')) {
    throw new Error("copied runtime does not include the expected theme stylesheet");
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

  const mainTsx = fs.readFileSync(
    path.join(tempRoot, "themes", "reveal.js-black", "src", "main.tsx"),
    "utf8",
  );
  if (!mainTsx.includes('"../../../example.md?raw"')) {
    throw new Error("main.tsx does not import the external markdown file");
  }

  if (!mainTsx.includes('"./styles/themes/index.css"')) {
    throw new Error("main.tsx does not import the universal theme index");
  }

  const viteConfig = fs.readFileSync(
    path.join(tempRoot, "themes", "reveal.js-black", "vite.config.ts"),
    "utf8",
  );
  if (!viteConfig.includes(JSON.stringify(fs.realpathSync(tempRoot)))) {
    throw new Error("vite.config.ts does not allow access to the source markdown directory");
  }

  const runtimeDir = path.join(tempRoot, "themes", "reveal.js-black");
  const packagePath = path.join(runtimeDir, "package.json");
  const templatePackage = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "templates", "default", "package.json"), "utf8"),
  );
  const customPackage = {
    ...JSON.parse(fs.readFileSync(packagePath, "utf8")),
    name: "custom-slides",
    version: "9.8.7",
    description: "User-managed slide runtime",
    dependencies: {
      ...templatePackage.dependencies,
      katex: "^0.16.0",
      react: "^18.3.1",
      "is-number": "^7.0.0",
    },
    devDependencies: {
      ...templatePackage.devDependencies,
      vite: "^7.0.0",
    },
    scripts: {
      ...templatePackage.scripts,
      custom: "echo custom",
    },
    overrides: {
      katex: "0.16.0",
      tinypool: "2.1.0",
      "ansi-regex": "^6.1.0",
      "custom-parent": { "custom-child": "^1.0.0" },
    },
    customMetadata: { preserved: true },
  };
  fs.writeFileSync(packagePath, JSON.stringify(customPackage, null, 2) + "\n");

  const appPath = path.join(runtimeDir, "src", "app.tsx");
  const customApp =
    fs.readFileSync(appPath, "utf8") + '\nexport const customRuntimeValue = "preserved";\n';
  fs.writeFileSync(appPath, customApp);

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
      `re-run on existing runtime failed: ${rerunResult.stderr || rerunResult.stdout || "failed"}`,
    );
  }

  assert.deepStrictEqual(
    JSON.parse(fs.readFileSync(packagePath, "utf8")),
    {
      ...customPackage,
      dependencies: {
        ...customPackage.dependencies,
        katex: templatePackage.dependencies.katex,
      },
      overrides: {
        ...customPackage.overrides,
        katex: templatePackage.overrides.katex,
        tinypool: templatePackage.overrides.tinypool,
      },
    },
    "existing runtime should refresh only managed security package fields during scaffold-only",
  );
  assert.equal(fs.readFileSync(appPath, "utf8"), customApp);
  assert.equal(fs.readFileSync(path.join(tempRoot, "example.md"), "utf8"), createdMd);

  console.log(`Smoke test passed: ${tempRoot}`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
