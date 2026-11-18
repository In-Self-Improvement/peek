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

test("content script saves URL work, copies selected notes, and restores or clears history", async () => {
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
  function add(note: string) {
    target.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    root.querySelector("textarea")!.value = note;
    pop.requestSubmit();
    return flush();
  }
  const button = (action: string) => root.querySelector<HTMLButtonElement>(`[data-act="${action}"]`)!;

  await add("두 번째");
  await add("세 번째");
  button("work").click();
  root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')[1].click();
  button("copy").click();
  await flush();
  expect(copied).toContain("## 2. 두 번째");
  expect(copied).not.toContain("더 크게");
  expect(copied).toContain('`[data-testid="buy"]`');
  expect([...root.querySelectorAll(".pin")].map((pin) => pin.textContent)).toEqual(["1", "3"]);

  await add("네 번째");
  expect([...root.querySelectorAll(".pin")].map((pin) => pin.textContent)).toEqual(["1", "3", "4"]);
  button("copy").click();
  await flush();
  expect(copied).toContain("## 4. 네 번째");
  expect(root.querySelectorAll(".pin")).toHaveLength(0);
  await add("새 작업");
  expect(root.querySelector(".pin")?.textContent).toBe("1");

  button("history").click();
  root.querySelectorAll<HTMLButtonElement>('[data-act="restore"]')[1].click();
  await flush();
  expect([...root.querySelectorAll(".pin")].map((pin) => pin.textContent)).toEqual(["1", "2"]);
  const originalConfirm = window.confirm;
  window.confirm = () => false;
  button("clear-history").click();
  expect(root.querySelectorAll('[data-act="restore"]')).toHaveLength(2);
  window.confirm = () => true;
  button("clear-history").click();
  await flush();
  window.confirm = originalConfirm;
  expect(root.querySelectorAll('[data-act="restore"]')).toHaveLength(0);
  expect(root.querySelectorAll(".pin")).toHaveLength(2);

  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: async () => { throw new Error("Denied"); } },
    configurable: true,
  });
  button("work").click();
  root.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
  button("copy").click();
  await flush();
  expect(button("copy").textContent).toBe("선택 복사 (1개)");
  expect(root.querySelectorAll(".pin")).toHaveLength(2);
  expect(root.querySelector(".toast")?.textContent).toContain("복사하지 못했어요");

  listeners[0]({ action: "toggleInspect" });
  history.replaceState(null, "", "/other");
  listeners[0]({ action: "toggleInspect" });
  await flush();
  expect(document.querySelector("peek-root")!.shadowRoot!.querySelectorAll(".pin")).toHaveLength(0);
  listeners[0]({ action: "toggleInspect" });
  history.replaceState(null, "", "/");
  listeners[0]({ action: "toggleInspect" });
  await flush();
  expect(document.querySelector("peek-root")!.shadowRoot!.querySelectorAll(".pin")).toHaveLength(2);
});
