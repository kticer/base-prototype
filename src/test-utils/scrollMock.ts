Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  configurable: true,
  value: jest.fn(),
});