#!/usr/bin/env node

import { intro, outro, text, select, isCancel, spinner } from "@clack/prompts";
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pc from "picocolors";
import WebSocket from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesRoot = path.resolve(__dirname, "..", "templates");

type ExportFormat = "pdf" | "mp4";

interface CliOptions {
  help: boolean;
  scaffoldOnly: boolean;
  build: boolean;
  exportFormat?: ExportFormat;
  projectName?: string;
  markdownPath?: string;
  template?: string;
}

function printHelp(): void {
  console.log(`create-slides-app

Usage:
  create-slides-app [slides.md] [--template <name>]
  create-slides-app [slides.md] --build
  create-slides-app [slides.md] --export <pdf|mp4>

Options:
  --template <name>    Template directory under templates/
  --build              Build static HTML to dist/ (no dev server)
  --export <pdf|mp4>   Export slides to PDF or MP4 video (requires Chrome; mp4 also requires ffmpeg)
  --help               Show this message
`);
}

function hasMarkdownExtension(value: string): boolean {
  return /\.(md|markdown)$/i.test(value);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { help: false, scaffoldOnly: false, build: false };

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
      const value = argv[index + 1];
      if (value !== "pdf" && value !== "mp4") {
        throw new Error("--export requires a format: pdf or mp4");
      }
      options.exportFormat = value;
      index += 1;
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
  return (
    projectName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "my-slides"
  );
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
      throw new Error(
        `Unknown template "${overrideTemplate}". Available templates: ${templates.join(", ")}`,
      );
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

interface CdpResponse {
  id: number;
  result?: Record<string, unknown>;
  error?: { message: string };
}

class CdpClient {
  private ws: WebSocket;
  private nextId = 1;
  private pending = new Map<
    number,
    { resolve: (v: CdpResponse) => void; reject: (e: Error) => void }
  >();

  private constructor(ws: WebSocket) {
    this.ws = ws;
    this.ws.on("message", (data: WebSocket.Data) => {
      const msg = JSON.parse(data.toString()) as CdpResponse;
      const handler = this.pending.get(msg.id);
      if (handler) {
        this.pending.delete(msg.id);
        handler.resolve(msg);
      }
    });
  }

  static async connect(wsUrl: string): Promise<CdpClient> {
    const ws = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      ws.once("open", resolve);
      ws.once("error", reject);
    });
    return new CdpClient(ws);
  }

  async send(method: string, params: Record<string, unknown> = {}): Promise<CdpResponse> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close(): void {
    this.ws.close();
  }
}

async function launchHeadlessChrome(debugPort: number): Promise<ReturnType<typeof spawn>> {
  const chromePath = findChrome();
  if (!chromePath) {
    throw new Error("Chrome not found. Install Google Chrome to use --export.");
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "csa-chrome-"));
  const chromeProcess = spawn(
    chromePath,
    [
      "--headless=new",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--window-size=1280,720",
      "about:blank",
    ],
    { stdio: "pipe" },
  );

  chromeProcess.on("exit", () => {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  });

  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (res.ok) return chromeProcess;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  chromeProcess.kill();
  throw new Error("Chrome failed to start within 10 seconds");
}

async function captureSlides(
  devUrl: string,
  debugPort: number,
): Promise<{ screenshots: Buffer[]; cdp: CdpClient; chromeProcess: ReturnType<typeof spawn> }> {
  const chromeProcess = await launchHeadlessChrome(debugPort);

  const targetsRes = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
  const targets = (await targetsRes.json()) as { webSocketDebuggerUrl: string; type: string }[];
  const pageTarget = targets.find((t) => t.type === "page");

  if (!pageTarget) {
    throw new Error("No page target found in Chrome");
  }

  const cdp = await CdpClient.connect(pageTarget.webSocketDebuggerUrl);

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 720,
    deviceScaleFactor: 2,
    mobile: false,
  });

  await cdp.send("Page.enable");
  await cdp.send("Page.navigate", { url: devUrl });

  await new Promise((r) => setTimeout(r, 2000));

  const slideCountResult = await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const el = document.querySelector(".slide-number");
      if (!el) return 1;
      const match = el.textContent?.match(/(\\d+)\\s*\\/\\s*(\\d+)/);
      return match ? parseInt(match[2], 10) : 1;
    })()`,
    returnByValue: true,
  });

  const totalSlides = (slideCountResult.result?.result as { value: number })?.value ?? 1;
  const screenshots: Buffer[] = [];

  for (let i = 0; i < totalSlides; i++) {
    if (i > 0) {
      await cdp.send("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "ArrowRight",
        code: "ArrowRight",
        windowsVirtualKeyCode: 39,
        nativeVirtualKeyCode: 39,
      });
      await cdp.send("Input.dispatchKeyEvent", {
        type: "keyUp",
        key: "ArrowRight",
        code: "ArrowRight",
        windowsVirtualKeyCode: 39,
        nativeVirtualKeyCode: 39,
      });
      await new Promise((r) => setTimeout(r, 300));
    }

    const screenshotResult = await cdp.send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 0, y: 0, width: 1280, height: 720, scale: 1 },
    });

    const screenshotData = (screenshotResult.result?.data as string) ?? "";
    screenshots.push(Buffer.from(screenshotData, "base64"));
  }

  return { screenshots, cdp, chromeProcess };
}

async function exportPdf(targetDir: string, outputName: string): Promise<void> {
  const s = spinner();
  s.start("Starting dev server...");

  const devPort = 3031;
  const devProcess = await startDevServer(targetDir, devPort);
  s.stop("Dev server ready.");

  const p = spinner();
  p.start("Generating PDF...");

  let chromeProcess: ReturnType<typeof spawn> | undefined;

  try {
    const { PDFDocument } = await import("pdf-lib");
    const captured = await captureSlides(`http://localhost:${devPort}`, 9223);
    chromeProcess = captured.chromeProcess;

    const pdfDoc = await PDFDocument.create();
    for (const pngBuffer of captured.screenshots) {
      const pngImage = await pdfDoc.embedPng(pngBuffer);
      const pdfPage = pdfDoc.addPage([1280, 720]);
      pdfPage.drawImage(pngImage, { x: 0, y: 0, width: 1280, height: 720 });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfPath = path.join(targetDir, `${outputName}.pdf`);
    fs.writeFileSync(pdfPath, pdfBytes);

    captured.cdp.close();
    p.stop(`PDF generated (${captured.screenshots.length} slides).`);
    outro(pc.green(`Output: ${pdfPath}`));
  } catch (err) {
    p.stop("PDF export failed.");
    const msg = err instanceof Error ? err.message : String(err);
    console.error(pc.red(msg));
    process.exitCode = 1;
  } finally {
    chromeProcess?.kill();
    devProcess.kill();
  }
}

async function exportMp4(targetDir: string, outputName: string): Promise<void> {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  } catch {
    throw new Error("ffmpeg is required for MP4 export. Install it with: brew install ffmpeg");
  }

  const s = spinner();
  s.start("Starting dev server...");

  const devPort = 3031;
  const devProcess = await startDevServer(targetDir, devPort);
  s.stop("Dev server ready.");

  const p = spinner();
  p.start("Capturing slides...");

  let chromeProcess: ReturnType<typeof spawn> | undefined;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "csa-mp4-"));

  try {
    const captured = await captureSlides(`http://localhost:${devPort}`, 9223);
    chromeProcess = captured.chromeProcess;
    captured.cdp.close();

    for (let i = 0; i < captured.screenshots.length; i++) {
      fs.writeFileSync(
        path.join(tmpDir, `slide_${String(i).padStart(4, "0")}.png`),
        captured.screenshots[i],
      );
    }

    p.stop(`Captured ${captured.screenshots.length} slides.`);

    const v = spinner();
    v.start("Encoding MP4 with transitions...");

    const slideDuration = 3;
    const transitionDuration = 0.5;
    const count = captured.screenshots.length;
    const mp4Path = path.join(targetDir, `${outputName}.mp4`);

    if (count === 1) {
      execSync(
        `ffmpeg -y -loop 1 -t ${slideDuration} -i "${path.join(tmpDir, "slide_0000.png")}" -vf "scale=1280:720" -c:v libx264 -pix_fmt yuv420p -r 30 "${mp4Path}"`,
        { stdio: "ignore" },
      );
    } else {
      const inputs: string[] = [];
      for (let i = 0; i < count; i++) {
        inputs.push(
          `-loop 1 -t ${slideDuration} -i "${path.join(tmpDir, `slide_${String(i).padStart(4, "0")}.png`)}"`,
        );
      }

      const filters: string[] = [];
      let prevLabel = "0";

      for (let i = 1; i < count; i++) {
        const offset = i * slideDuration - i * transitionDuration;
        const outLabel = `v${i}`;
        filters.push(
          `[${prevLabel}][${i}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[${outLabel}]`,
        );
        prevLabel = outLabel;
      }

      const filterComplex = filters.join("; ");

      execSync(
        `ffmpeg -y ${inputs.join(" ")} -filter_complex "${filterComplex}" -map "[${prevLabel}]" -c:v libx264 -pix_fmt yuv420p -r 30 "${mp4Path}"`,
        { stdio: "ignore" },
      );
    }

    v.stop("MP4 encoded.");
    outro(pc.green(`Output: ${mp4Path}`));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(pc.red(msg));
    process.exitCode = 1;
  } finally {
    chromeProcess?.kill();
    devProcess.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
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
  const targetDir = path.resolve(process.cwd(), projectName);
  const mdFileName = markdownPath ? path.basename(markdownPath) : `${projectName}.md`;
  const alreadyScaffolded = fs.existsSync(targetDir);

  if (!alreadyScaffolded) {
    const template = await resolveTemplate(options.template);
    const templateDir = path.resolve(templatesRoot, template);

    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
    fs.cpSync(templateDir, targetDir, { recursive: true });

    const pkgPath = path.join(targetDir, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    pkg.name = toPackageName(path.basename(targetDir));
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

    const mainTsxPath = path.join(targetDir, "src/main.tsx");
    const mainTsx = fs.readFileSync(mainTsxPath, "utf-8");
    fs.writeFileSync(mainTsxPath, mainTsx.replace("__SLIDES_MD__", mdFileName));

    if (markdownPath) {
      fs.copyFileSync(markdownPath, path.join(targetDir, mdFileName));
    } else {
      fs.writeFileSync(path.join(targetDir, mdFileName), exampleMarkdown);
    }
  }

  if (options.scaffoldOnly) {
    outro(pc.green("Done!"));
    return;
  }

  const s = spinner();
  s.start(alreadyScaffolded ? "Checking dependencies..." : "Installing dependencies...");
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

  if (options.exportFormat === "pdf") {
    await exportPdf(targetDir, path.basename(targetDir));
    return;
  }

  if (options.exportFormat === "mp4") {
    await exportMp4(targetDir, path.basename(targetDir));
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
