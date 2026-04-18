import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { expect, test } from "vitest";

function runBrowserScript(relativePath: string) {
  const testDir = dirname(fileURLToPath(import.meta.url));
  const scriptPath = resolve(testDir, relativePath);
  const source = readFileSync(scriptPath, "utf8");
  vm.runInThisContext(source, { filename: scriptPath });
}

test("content script smoke: toggle inspect mode, hover target, then exit with Escape", () => {
  const messageListeners: Array<(message: { action?: string }) => void> = [];

  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      onMessage: {
        addListener: (listener: (message: { action?: string }) => void) => {
          messageListeners.push(listener);
        },
      },
    },
  };

  runBrowserScript("../selector-engine.js");
  runBrowserScript("../content.js");

  expect(messageListeners).toHaveLength(1);

  messageListeners[0]({ action: "toggleInspect" });
  expect(document.body.style.cursor).toBe("crosshair");

  const target = document.createElement("button");
  target.className = "PrimaryButton px-4";
  target.textContent = "Submit";
  document.body.appendChild(target);
  target.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

  expect(document.getElementById("pk-highlight")).toBeTruthy();
  expect(document.getElementById("pk-tooltip")).toBeTruthy();

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

  expect(document.body.style.cursor).toBe("");
  expect(document.getElementById("pk-highlight")).toBeNull();
  expect(document.getElementById("pk-tooltip")).toBeNull();
});
