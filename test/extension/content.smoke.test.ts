import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { expect, test } from "vitest";

function runBrowserScript(relativePath: string) {
  const testDir = dirname(fileURLToPath(import.meta.url));
  const scriptPath = resolve(testDir, relativePath);
  vm.runInThisContext(readFileSync(scriptPath, "utf8"), { filename: scriptPath });
}

const flush = () => new Promise((r) => setTimeout(r, 20));

test("content script smoke: toggle, click element, write a note, copy markdown, exit", async () => {
  const listeners: Array<(message: { action?: string }) => void> = [];
  let copied = "";
  const stored = new Map<string, unknown>();
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      local: { get: async (key: string) => ({ [key]: stored.get(key) }) },
    },
    runtime: {
      sendMessage: async ({ key, state }: { key: string; state: unknown }) => {
        const next = state as { revision: number };
        stored.set(key, structuredClone({ ...next, revision: next.revision + 1 }));
        return { ok: true };
      },
      onMessage: { addListener: (listener: (message: { action?: string }) => void) => listeners.push(listener) },
      getURL: (path: string) => `chrome-extension://test/${path}`,
    },
  };
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: async (text: string) => void (copied = text) },
    configurable: true,
  });

  runBrowserScript("../../extension/selector-engine.js");
  runBrowserScript("../../extension/prompt.js");
  runBrowserScript("../../extension/content.js");
  runBrowserScript("../../extension/content.js"); // 재주입돼도 리스너는 하나
  expect(listeners).toHaveLength(1);

  const target = document.createElement("button");
  target.dataset.testid = "buy";
  target.textContent = "Buy";
  document.body.appendChild(target);

  listeners[0]({ action: "toggleInspect" });
  await flush();
  const root = document.querySelector("peek-root")!.shadowRoot!;
  expect(root.querySelector(".bar")).toBeTruthy();

  target.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
  const pageClick = new MouseEvent("click", { bubbles: true, cancelable: true });
  target.dispatchEvent(pageClick);
  expect(pageClick.defaultPrevented).toBe(true); // 페이지 동작은 막힌다

  const pop = root.querySelector<HTMLFormElement>(".pop")!;
  expect(pop.hidden).toBe(false);
  root.querySelector("textarea")!.value = "더 크게";
  pop.requestSubmit();
  await flush();

  expect(root.querySelectorAll(".pin")).toHaveLength(1);
  root.querySelector<HTMLButtonElement>('[data-act="copy"]')!.click();
  await flush();
  expect(copied).toContain("## 1. 더 크게");
  expect(copied).toContain('`[data-testid="buy"]`');

  expect(JSON.stringify([...stored.values()])).toContain("더 크게");

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  expect(document.querySelector("peek-root")).toBeNull();
  listeners[0]({ action: "toggleInspect" });
  await flush();
  expect(document.querySelector("peek-root")!.shadowRoot!.querySelector(".pin")?.textContent).toBe("1");

  listeners[0]({ action: "toggleInspect" });
  history.replaceState(null, "", "/other");
  listeners[0]({ action: "toggleInspect" });
  await flush();
  expect(document.querySelector("peek-root")!.shadowRoot!.querySelectorAll(".pin")).toHaveLength(0);
});
