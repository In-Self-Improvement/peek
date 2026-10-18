import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { beforeAll, expect, test } from "vitest";
import { loadSelectorEngine, type SelectorEngine } from "./load-selector-engine";

type Info = ReturnType<Prompt["describeElement"]>;
type Prompt = {
  toCssSelector: (el: Element) => string;
  describeElement: (el: Element, engine: SelectorEngine) => {
    selector: string;
    snippet: string;
    component: string | null;
    hints: string[];
    box: { x: number; y: number; width: number; height: number };
    styles: string;
  };
  buildMarkdown: (page: { url: string; width: number; height: number }, annotations: { note: string; info: Info }[]) => string;
};

let engine: SelectorEngine;
let prompt: Prompt;

beforeAll(() => {
  engine = loadSelectorEngine();
  const path = resolve(dirname(fileURLToPath(import.meta.url)), "../../extension/prompt.js");
  vm.runInThisContext(readFileSync(path, "utf8"), { filename: path });
  prompt = (globalThis as unknown as { peekPrompt: Prompt }).peekPrompt;
});

test("prefers a unique test id, then id, then a unique DOM path", () => {
  document.body.innerHTML = `
    <main>
      <button data-testid="buy">Buy</button>
      <section id="hero"><p>a</p><p>b</p></section>
      <ul><li>one</li><li>two</li></ul>
    </main>`;

  expect(prompt.toCssSelector(document.querySelector("button")!)).toBe('[data-testid="buy"]');
  expect(prompt.toCssSelector(document.querySelector("#hero")!)).toBe("#hero");

  const second = document.querySelectorAll("li")[1];
  const selector = prompt.toCssSelector(second);
  expect(document.querySelectorAll(selector)).toHaveLength(1);
  expect(document.querySelector(selector)).toBe(second);

  // 유일해지는 순간 멈춘다 (가장 짧은 경로)
  const para = document.querySelectorAll("#hero p")[1];
  expect(prompt.toCssSelector(para)).toBe("p:nth-of-type(2)");
});

test("builds a numbered markdown prompt from annotations", () => {
  document.body.innerHTML = `<button data-testid="buy" class="BuyButton" onclick="x()">Buy now</button>`;
  const info = prompt.describeElement(document.querySelector("button")!, engine);

  expect(info.snippet).toBe('<button data-testid="buy" class="BuyButton">Buy now</button>');
  expect(info.hints).toContain('data-testid="buy"');

  const markdown = prompt.buildMarkdown({ url: "https://example.com/pricing", width: 1440, height: 900 }, [
    { note: " Make it bigger ", info },
  ]);

  expect(markdown).toContain("Page: https://example.com/pricing");
  expect(markdown).toContain("Viewport: 1440×900");
  expect(markdown).toContain("## 1. Make it bigger");
  expect(markdown).toContain('- Selector: `[data-testid="buy"]`');
});
