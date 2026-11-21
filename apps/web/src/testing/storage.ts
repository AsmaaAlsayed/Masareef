/**
 * Test support: Web Storage that tests own, so no test depends on which `localStorage` the runtime
 * provides (see no-global-storage.ts).
 */

/** An in-memory Storage with the full interface, like one origin's `localStorage`. */
export function memoryStorage(initial: Readonly<Record<string, string>> = {}): Storage {
  const items = new Map(Object.entries(initial));
  return {
    get length() {
      return items.size;
    },
    key: (index) => [...items.keys()][index] ?? null,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, String(value));
    },
    removeItem: (key) => {
      items.delete(key);
    },
    clear: () => {
      items.clear();
    },
  };
}

/** A Storage whose every call fails, as with blocked site data or a full quota. */
export function failingStorage(name: 'SecurityError' | 'QuotaExceededError'): Storage {
  const fail = (): never => {
    throw new DOMException('storage unavailable', name);
  };
  return { length: 0, key: fail, getItem: fail, setItem: fail, removeItem: fail, clear: fail };
}

/**
 * Runs `body` with `storage` as the global `localStorage`, then puts back whatever was there, so a
 * test can exercise code that reads `window.localStorage` itself.
 */
export async function withGlobalLocalStorage<T>(
  storage: Storage,
  body: () => T | Promise<T>,
): Promise<T> {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  try {
    return await body();
  } finally {
    if (previous === undefined) Reflect.deleteProperty(globalThis, 'localStorage');
    else Object.defineProperty(globalThis, 'localStorage', previous);
  }
}
