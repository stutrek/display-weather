// Node 22+ ships a built-in localStorage that conflicts with jsdom's.
// Replace it with a minimal in-memory store so tests have a clean slate.

const store = new Map<string, string>();

const localStorageMock: Storage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => {
    store.set(key, value);
  },
  removeItem: (key) => {
    store.delete(key);
  },
  clear: () => store.clear(),
  get length() {
    return store.size;
  },
  key: (index) => [...store.keys()][index] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Register lightweight stand-ins for the HA web components used in tests.
import './ha-stubs';
