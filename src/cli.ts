#!/usr/bin/env node

import { intro, outro, text, select, isCancel, spinner } from "@clack/prompts";
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pc from "picocolors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesRoot = path.resolve(__dirname, "..", "templates");

interface CliOptions {
  help: boolean;
  scaffoldOnly: boolean;
  build: boolean;
  export: boolean;
  projectName?: string;
  markdownPath?: string;
  template?: string;
}

function printHelp(): void {
  console.log(`create-slides-app

Usage:
  create-slides-app [slides.md] [--template <name>]
  create-slides-app [slides.md] --build
  create-slides-app [slides.md] --export

Options:
  --template <name>  Template directory under templates/
  --build            Build static HTML to dist/ (no dev server)
  --export           Export slides to PDF
  --help             Show this message
`);
}

function hasMarkdownExtension(value: string): boolean {
  return /\.(md|markdown)$/i.test(value);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { help: false, scaffoldOnly: false, build: false, export: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--scaffold-only") {
      options.scaffoldOnly = true;
      continue;
    }

    if (arg === "--build") {
      options.build = true;
      continue;
    }

    if (arg === "--export") {
      options.export = true;
      continue;
    }

    if (arg === "--template" || arg === "-t") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --template");
      }
      options.template = value;
      index += 1;
      continue;
    }

    if (!options.projectName && !options.markdownPath) {
      if (hasMarkdownExtension(arg)) {
        options.markdownPath = arg;
      } else {
        options.projectName = arg;
      }
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function listTemplates(): string[] {
  return fs
    .readdirSync(templatesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function validateTargetPath(projectName: string): string | undefined {
  if (!projectName.trim()) {
    return "Project name is required";
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    return `Directory "${projectName}" already exists`;
  }

  return undefined;
}

const exampleMarkdown = `---
title: Example Slides
---

# Example Slides

Created with create-slides-app

---

# Getting Started

- Edit this file to create your slides
- Slides are separated by \`---\`
- Use standard Markdown syntax

---

# Code

\`\`\`typescript
const message = "Hello, slides!";
console.log(message);
\`\`\`

---

# Next Steps

Replace this deck with your own content.
`;

function resolveMarkdownPath(initialMarkdownPath?: string): string | undefined {
  if (!initialMarkdownPath) {
    return undefined;
  }

  const markdownPath = path.resolve(process.cwd(), initialMarkdownPath);

  if (!fs.existsSync(markdownPath)) {
    fs.writeFileSync(markdownPath, exampleMarkdown);
  }

  if (!fs.statSync(markdownPath).isFile()) {
    throw new Error(`Markdown path "${initialMarkdownPath}" is not a file`);
  }

  return markdownPath;
}

function toPackageName(projectName: string): string {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "my-slides";
}

async function resolveProjectName(initialProjectName?: string): Promise<string> {
  if (initialProjectName) {
    const error = validateTargetPath(initialProjectName);
    if (error) {
      throw new Error(error);
    }
    return initialProjectName;
  }

  const result = await text({
    message: "Project name:",
    placeholder: "my-slides",
    defaultValue: "my-slides",
    validate: validateTargetPath,
  });

  if (isCancel(result)) {
    outro(pc.red("Cancelled."));
    process.exit(0);
  }

  return result;
}

function deriveProjectNameFromMarkdown(markdownPath: string): string {
  const fileName = path.basename(markdownPath, path.extname(markdownPath)).trim();
  return fileName || "my-slides";
}

async function resolveTemplate(overrideTemplate?: string): Promise<string> {
  const templates = listTemplates();

  if (templates.length === 0) {
    throw new Error("No templates are available");
  }

  if (overrideTemplate) {
    if (!templates.includes(overrideTemplate)) {
      throw new Error(`Unknown template "${overrideTemplate}". Available templates: ${templates.join(", ")}`);
    }
    return overrideTemplate;
  }

  if (templates.length === 1) {
    return templates[0];
  }

  const selected = await select({
    message: "Select a template:",
    options: templates.map((template) => ({
      value: template,
      label: template,
    })),
  });

  if (isCancel(selected)) {
    outro(pc.red("Cancelled."));
    process.exit(0);
  }

  return selected;
}

function findChrome(): string | undefined {
  const candidates =
    process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ]
      : process.platform === "win32"
        ? [
            `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
            `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
            `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
          ]
        : [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
          ];

  return candidates.find((p) => fs.existsSync(p));
}

async function startDevServer(targetDir: string, port: number): Promise<ReturnType<typeof spawn>> {
  const devProcess = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
    cwd: targetDir,
    stdio: "pipe",
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Dev server failed to start within 30 seconds"));
    }, 30_000);

    const onData = (chunk: Buffer) => {
      if (chunk.toString().includes("Local:")) {
        clearTimeout(timeout);
        resolve();
      }
    };

    devProcess.stdout?.on("data", onData);
    devProcess.stderr?.on("data", onData);

    devProcess.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  return devProcess;
}

async function exportPdf(targetDir: string, pdfName: string): Promise<void> {
  const s = spinner();
  s.start("Starting dev server for PDF export...");

  const port = 3031;
  const url = `http://localhost:${port}`;
  const devProcess = await startDevServer(targetDir, port);

  s.stop("Dev server ready.");

  const p = spinner();
  p.start("Generating PDF...");

  try {
    const puppeteer = await import("puppeteer-core");
    const { PDFDocument } = await import("pdf-lib");

    const chromePath = findChrome();
    if (!chromePath) {
      throw new Error("Chrome not found. Install Google Chrome to use --export.");
    }

    const browser = await puppeteer.default.launch({ headless: true, executablePath: chromePath });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(url, { waitUntil: "networkidle0" });

    const totalSlides: number = await page.evaluate(() => {
      const el = document.querySelector(".slide-number");
      if (!el) return 1;
      const match = el.textContent?.match(/(\d+)\s*\/\s*(\d+)/);
      return match ? parseInt(match[2], 10) : 1;
    });

    const pdfDoc = await PDFDocument.create();
    const width = 1280;
    const height = 720;

    for (let i = 0; i < totalSlides; i++) {
      if (i > 0) {
        await page.keyboard.press("ArrowRight");
        await new Promise((r) => setTimeout(r, 300));
      }

      const screenshot: Uint8Array = await page.screenshot({ type: "png" });
      const pngImage = await pdfDoc.embedPng(screenshot);
      const pdfPage = pdfDoc.addPage([width, height]);
      pdfPage.drawImage(pngImage, { x: 0, y: 0, width, height });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfPath = path.join(targetDir, `${pdfName}.pdf`);
    fs.writeFileSync(pdfPath, pdfBytes);

    await browser.close();
    p.stop(`PDF generated (${totalSlides} slides).`);
    outro(pc.green(`Output: ${pdfPath}`));
  } catch (err) {
    p.stop("PDF export failed.");
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Chrome not found")) {
      console.error(pc.red(msg));
    } else if (msg.includes("Cannot find package") || msg.includes("MODULE_NOT_FOUND")) {
      console.error(pc.red("puppeteer-core is required for PDF export."));
    } else {
      console.error(pc.red(msg));
    }
    process.exitCode = 1;
  } finally {
    devProcess.kill();
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  intro(pc.cyan("create-slides-app"));

  const markdownPath = resolveMarkdownPath(options.markdownPath);
  const projectName = await resolveProjectName(
    options.projectName ?? (markdownPath ? deriveProjectNameFromMarkdown(markdownPath) : undefined),
  );
  const template = await resolveTemplate(options.template);
  const templateDir = path.resolve(templatesRoot, template);
  const targetDir = path.resolve(process.cwd(), projectName);

  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(templateDir, targetDir, { recursive: true });

  const pkgPath = path.join(targetDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.name = toPackageName(path.basename(targetDir));
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  if (markdownPath) {
    fs.copyFileSync(markdownPath, path.join(targetDir, "slides.md"));
  }

  if (options.scaffoldOnly) {
    outro(pc.green("Done!"));
    return;
  }

  const s = spinner();
  s.start("Installing dependencies...");
  execSync("npm install --silent", { cwd: targetDir, stdio: "ignore" });
  s.stop("Dependencies installed.");

  if (options.build) {
    const b = spinner();
    b.start("Building for production...");
    execSync("npm run build", { cwd: targetDir, stdio: "ignore" });
    b.stop("Build complete.");
    const distDir = path.join(targetDir, "dist");
    outro(pc.green(`Output: ${distDir}`));
    return;
  }

  if (options.export) {
    await exportPdf(targetDir, path.basename(targetDir));
    return;
  }

  const port = 3030;
  const url = `http://localhost:${port}`;

  s.start(`Starting dev server on ${pc.cyan(url)}...`);

  const devProcess = await startDevServer(targetDir, port);

  s.stop(`Dev server running at ${pc.cyan(url)}`);

  const openCommand =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  spawn(openCommand, [url], { stdio: "ignore", detached: true }).unref();

  outro(pc.green("Slides are live! Press Ctrl+C to stop."));

  devProcess.unref();

  await new Promise<void>((resolve) => {
    const onSignal = () => {
      devProcess.kill();
      resolve();
    };
    process.on("SIGINT", onSignal);
    process.on("SIGTERM", onSignal);
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(pc.red(message));
  process.exitCode = 1;
});
