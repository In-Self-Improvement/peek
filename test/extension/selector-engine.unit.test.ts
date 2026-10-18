import { beforeAll, expect, test } from "vitest";
import { loadSelectorEngine, type SelectorEngine } from "./load-selector-engine";

let engine: SelectorEngine;

beforeAll(async () => {
  engine = loadSelectorEngine();
});

test("maps confidence score ranges to CSS classes", () => {
  expect(engine.getConfidenceClass(95)).toBe("high");
  expect(engine.getConfidenceClass(80)).toBe("medium");
  expect(engine.getConfidenceClass(55)).toBe("low");
  expect(engine.getConfidenceClass(20)).toBe("vlow");
});

test("detects utility classes and ignores semantic names", () => {
  expect(engine.isTailwindUtility("px-4")).toBe(true);
  expect(engine.isTailwindUtility("text-lg")).toBe(true);
  expect(engine.isTailwindUtility("submitButton")).toBe(false);
});
