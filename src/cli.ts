#!/usr/bin/env node

import { intro, outro, text, select, isCancel } from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pc from "picocolors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  intro(pc.cyan("create-slides-app"));

  let projectName = process.argv[2];

  if (!projectName) {
    const result = await text({
      message: "Project name:",
      placeholder: "my-slides",
      defaultValue: "my-slides",
      validate(value) {
        if (!value.trim()) return "Project name is required";
        if (fs.existsSync(value)) return `Directory "${value}" already exists`;
        return undefined;
      },
    });

    if (isCancel(result)) {
      outro(pc.red("Cancelled."));
      process.exit(0);
    }

    projectName = result;
  }

  const template = await select({
    message: "Select a template:",
    options: [{ value: "default", label: "Default", hint: "minimal + clean" }],
  });

  if (isCancel(template)) {
    outro(pc.red("Cancelled."));
    process.exit(0);
  }

  const templateDir = path.resolve(__dirname, "..", "templates", template as string);
  const targetDir = path.resolve(process.cwd(), projectName);

  fs.cpSync(templateDir, targetDir, { recursive: true });

  const pkgPath = path.join(targetDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.name = projectName;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  outro(
    pc.green("Done!") +
      "\n\n" +
      `  ${pc.cyan("cd")} ${projectName}\n` +
      `  ${pc.cyan("npm install")}\n` +
      `  ${pc.cyan("npm run dev")}\n`,
  );
}

main().catch(console.error);
