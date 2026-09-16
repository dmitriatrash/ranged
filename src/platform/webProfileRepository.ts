import {
  type KeyValueStore,
  type ProfileRepository,
  createKeyValueProfileRepository,
  createMemoryKeyValueStore,
} from "../core";

/** localStorage when available (private mode / blocked storage falls back to memory). */
function browserStore(): KeyValueStore {
  const memory = createMemoryKeyValueStore();
  return {
    getItem(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memory.getItem(key);
      }
    },
    setItem(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        memory.setItem(key, value);
      }
    },
  };
}

export function createWebProfileRepository(): ProfileRepository {
  return createKeyValueProfileRepository(browserStore());
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
