#!/usr/bin/env node

import { intro, outro, text, select, isCancel } from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pc from "picocolors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesRoot = path.resolve(__dirname, "..", "templates");

interface CliOptions {
  help: boolean;
  projectName?: string;
  template?: string;
}

function printHelp(): void {
  console.log(`create-slides-app

Usage:
  create-slides-app [project-name] [--template <name>]

Options:
  --template <name>  Template directory under templates/
  --help             Show this message
`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
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

    if (!options.projectName) {
      options.projectName = arg;
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

async function resolveTemplate(overrideTemplate?: string): Promise<string> {
  const templates = listTemplates();

  if (templates.length === 0) {
    throw new Error("No templates are available");
  }

  if (overrideTemplate) {
    if (!templates.includes(overrideTemplate)) {
      throw new Error(`Unknown template "${overrideTemplate}"`);
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
      label: template === "default" ? "Default" : template,
      hint: template === "default" ? "minimal + clean" : undefined,
    })),
  });

  if (isCancel(selected)) {
    outro(pc.red("Cancelled."));
    process.exit(0);
  }

  return selected;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  intro(pc.cyan("create-slides-app"));

  const projectName = await resolveProjectName(options.projectName);
  const template = await resolveTemplate(options.template);
  const templateDir = path.resolve(templatesRoot, template);
  const targetDir = path.resolve(process.cwd(), projectName);

  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(templateDir, targetDir, { recursive: true });

  const pkgPath = path.join(targetDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.name = toPackageName(path.basename(targetDir));
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  outro(
    pc.green("Done!") +
      "\n\n" +
      `  ${pc.cyan("cd")} ${projectName}\n` +
      `  ${pc.cyan("npm install")}\n` +
      `  ${pc.cyan("npm run dev")}\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(pc.red(message));
  process.exitCode = 1;
});
