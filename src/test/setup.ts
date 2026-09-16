import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement ResizeObserver, which HeroUI's toast measures with.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
