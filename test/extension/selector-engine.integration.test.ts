import { beforeAll, expect, test } from "vitest";
import { loadSelectorEngine, type SelectorEngine } from "./load-selector-engine";

let engine: SelectorEngine;

beforeAll(async () => {
  engine = loadSelectorEngine();
});

test("ranks selector candidates and keeps only top five entries", () => {
  const wrapper = document.createElement("div");
  wrapper.className = "checkout-section";

  function SaveFirstDashboard() {
    return null;
  }

  const button = document.createElement("button");
  button.id = "checkout-submit";
  button.dataset.testid = "checkout-submit";
  button.className = "PrimaryButton px-4 text-blue-500";
  button.setAttribute("role", "button");
  button.setAttribute("type", "button");
  Object.defineProperty(button, "__reactFiber$test", {
    value: {
      type: "button",
      return: {
        type: SaveFirstDashboard,
        return: null,
      },
    },
    configurable: true,
  });
  wrapper.appendChild(button);
  document.body.appendChild(wrapper);

  const strategies = engine.generateSearchStrategies(button);

  expect(strategies).toHaveLength(5);
  expect(strategies[0]).toEqual(
    expect.objectContaining({
      label: 'data-testid="checkout-submit"',
      confidence: 95,
    }),
  );
  expect(strategies.some((strategy) => strategy.label === 'component="SaveFirstDashboard"')).toBe(true);
  expect(strategies.some((strategy) => strategy.label === 'id="checkout-submit"')).toBe(true);
  expect(strategies.some((strategy) => strategy.description === "Component class")).toBe(true);
  expect(strategies.some((strategy) => strategy.description === "role attribute")).toBe(true);

  wrapper.remove();
});
