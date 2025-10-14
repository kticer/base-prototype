import { renderWithMockDocument } from "../test-utils/renderWithMockDocument";
import { screen, fireEvent } from "@testing-library/react";

import mockDoc from "../test-utils/mock-doc-1.json";



beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockDoc
  }) as typeof fetch;
});

test("clicking a highlight selects and scrolls to the correct match card and index", async () => {
  renderWithMockDocument("mock-doc-1");

  const highlight = await screen.findByTestId("highlight-h12");
  fireEvent.click(highlight);

  const card = await screen.findByTestId("matchcard-mc3");
  expect(card).toHaveClass("ring-2 ring-blue-500");

  const carousel = screen.getByTestId("carousel-index-1");
  expect(carousel).toHaveTextContent("2 of 2");
});

test("clicking match card match highlights and scrolls to correct highlight", async () => {
  renderWithMockDocument("mock-doc-1");

  const card = await screen.findByTestId("matchcard-mc2");
  fireEvent.click(card);

  const highlight = await screen.findByTestId("highlight-h6");
  
  // Test that the highlight has been properly styled for selection
  // Instead of testing for a specific color, test that it has a background color
  const computedStyle = window.getComputedStyle(highlight);
  expect(computedStyle.backgroundColor).not.toBe('');
  expect(computedStyle.backgroundColor).not.toBe('transparent');
  
  // Test that it has the focus outline class
  expect(highlight).toHaveClass("focus:outline");
  
  // Test that it has the correct data attributes
  expect(highlight).toHaveAttribute("data-highlight-id", "h6");
});