import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

export type SelectorStrategy = {
  label: string;
  confidence: number;
  description: string;
};

export type SelectorEngine = {
  getConfidenceClass: (confidence: number) => string;
  escapeHtml: (text: string) => string;
  isTailwindUtility: (className: string) => boolean;
  generateSearchStrategies: (element: HTMLElement) => SelectorStrategy[];
};

export function loadSelectorEngine(): SelectorEngine {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const scriptPath = resolve(currentDir, "../selector-engine.js");
  const source = readFileSync(scriptPath, "utf8");
  vm.runInThisContext(source, { filename: scriptPath });
  return (globalThis as { peekSelectorEngine?: SelectorEngine }).peekSelectorEngine!;
}
