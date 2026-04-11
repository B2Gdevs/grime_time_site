import fs from "node:fs/promises";
import path from "node:path";
import { componentConfigs } from "../component-configs";

export interface ThemeDiagnostic {
  ruleId:
    | "hardcoded-hex"
    | "hardcoded-css-color-name"
    | "hardcoded-utility-color";
  message: string;
  suggestion: string;
  match: string;
  line: number;
}

export interface ThemeFileDiagnostics {
  filePath: string;
  diagnostics: ThemeDiagnostic[];
}

const SOURCE_FILE_REGEX = /\.(ts|tsx|js|jsx|css)$/i;

const RULES: Array<{
  ruleId: ThemeDiagnostic["ruleId"];
  regex: RegExp;
  message: string;
  suggestion: string;
}> = [
  {
    ruleId: "hardcoded-hex",
    regex: /#(?:fff(?:fff)?|000(?:000)?)\b/gi,
    message: "Hardcoded absolute color found.",
    suggestion:
      "Use semantic tokens like var(--foreground) or var(--background).",
  },
  {
    ruleId: "hardcoded-css-color-name",
    regex:
      /(color|background(?:-color)?|border(?:-color)?)\s*:\s*(?:["'`])?(white|black)(?:["'`])?/gi,
    message: "Hardcoded color keyword found in style/CSS.",
    suggestion:
      "Use semantic tokens so light/dark themes both render correctly.",
  },
  {
    ruleId: "hardcoded-utility-color",
    regex:
      /\b(?:bg-white|text-black|border-white|bg-black|text-white|border-black)\b/g,
    message: "Theme-locked utility class detected.",
    suggestion:
      "Replace with semantic classes such as bg-background/text-foreground/border-border.",
  },
];

function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function getLineForOffset(source: string, offset: number): number {
  return source.slice(0, offset).split("\n").length;
}

export function analyzeThemeDiagnostics(source: string): ThemeDiagnostic[] {
  const diagnostics: ThemeDiagnostic[] = [];

  for (const rule of RULES) {
    rule.regex.lastIndex = 0;
    let match = rule.regex.exec(source);
    while (match !== null) {
      diagnostics.push({
        ruleId: rule.ruleId,
        message: rule.message,
        suggestion: rule.suggestion,
        match: match[0],
        line: getLineForOffset(source, match.index),
      });
      match = rule.regex.exec(source);
    }
  }

  return diagnostics.sort((a, b) => a.line - b.line);
}

async function listFilesRecursive(dirPath: string): Promise<string[]> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        return listFilesRecursive(fullPath);
      }
      return SOURCE_FILE_REGEX.test(entry.name) ? [fullPath] : [];
    }),
  );

  return nested.flat();
}

function deriveExampleDirsFromEntry(entryPoint: string): string[] {
  const dirs = new Set<string>();
  const baseName = path.basename(entryPoint).replace(/\.(tsx?|jsx?)$/, "");
  const withoutSdk = baseName.replace(/-sdk$/, "");
  dirs.add(path.join("components/examples", withoutSdk));
  return Array.from(dirs);
}

function getComponentScanRoots(
  componentId: string,
  projectRoot: string,
): Array<{ absolute: string; relative: string }> {
  const config = componentConfigs.find((c) => c.id === componentId);
  if (!config) return [];

  const roots = new Set<string>();
  const addRoot = (relative: string) => roots.add(toPosixPath(relative));

  addRoot(config.exportConfig.entryPoint);
  for (const maybeDir of deriveExampleDirsFromEntry(
    config.exportConfig.entryPoint,
  )) {
    addRoot(maybeDir);
  }

  if (config.demoConfig) {
    addRoot(config.demoConfig.entryPoint);
    for (const maybeDir of deriveExampleDirsFromEntry(
      config.demoConfig.entryPoint,
    )) {
      addRoot(maybeDir);
    }
  }

  return Array.from(roots).map((relative) => ({
    relative,
    absolute: path.resolve(projectRoot, relative),
  }));
}

export async function scanThemeDiagnosticsForComponent(
  componentId: string,
  projectRoot: string,
): Promise<ThemeFileDiagnostics[]> {
  const roots = getComponentScanRoots(componentId, projectRoot);
  const filePaths = new Set<string>();

  for (const root of roots) {
    if (SOURCE_FILE_REGEX.test(path.basename(root.absolute))) {
      filePaths.add(root.absolute);
      continue;
    }
    const nested = await listFilesRecursive(root.absolute);
    for (const filePath of nested) filePaths.add(filePath);
  }

  const diagnostics: ThemeFileDiagnostics[] = [];
  for (const filePath of filePaths) {
    try {
      const source = await fs.readFile(filePath, "utf8");
      const fileDiagnostics = analyzeThemeDiagnostics(source);
      if (fileDiagnostics.length === 0) continue;
      diagnostics.push({
        filePath: toPosixPath(path.relative(projectRoot, filePath)),
        diagnostics: fileDiagnostics,
      });
    } catch {
      // Ignore unreadable files for non-blocking diagnostics.
    }
  }

  return diagnostics.sort((a, b) => a.filePath.localeCompare(b.filePath));
}
