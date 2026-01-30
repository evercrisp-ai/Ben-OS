import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local for tests
config({ path: resolve(process.cwd(), '.env.local') });

import '@testing-library/jest-dom';

// Mock ResizeObserver for jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock scrollTo for scroll-related components
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
});

// Mock scrollIntoView for cmdk and other components
Element.prototype.scrollIntoView = () => {};

// Mock localStorage for zustand persist
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
