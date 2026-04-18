import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { HomeScreen } from "@/screens/home/screen";

test("renders the landing screen core actions and instructions", () => {
  render(<HomeScreen />);

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: /Hover any element and copy the identifier you actually need\./i,
    }),
  ).toBeTruthy();

  const loadUnpackedLink = screen.getByRole("link", { name: "Load Unpacked" });
  expect(loadUnpackedLink.getAttribute("href")).toBe("#load");

  expect(screen.getByText("How It Works")).toBeTruthy();
  expect(screen.getByText("Open Extensions")).toBeTruthy();
});
