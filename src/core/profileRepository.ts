import { type ZeroProfile, normalizeProfile, sortProfiles } from "./profiles";

/**
 * Storage boundary for saved zeros. Async so it can be backed by
 * localStorage, AsyncStorage, IndexedDB, SQLite, or a server later.
 */
export interface ProfileRepository {
  list(): Promise<ZeroProfile[]>;
  /** Inserts or replaces a profile with the same id. */
  save(profile: ZeroProfile): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Minimal string key-value store (matches both Web Storage and AsyncStorage). */
export interface KeyValueStore {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
}

/** Same key the original app used, so data can migrate on the same origin. */
export const PROFILES_STORAGE_KEY = "zeropoint.profiles";

export function createKeyValueProfileRepository(
  store: KeyValueStore,
  key: string = PROFILES_STORAGE_KEY,
): ProfileRepository {
  async function read(): Promise<ZeroProfile[]> {
    const raw = await store.getItem(key);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeProfile).filter((p): p is ZeroProfile => p !== null);
    } catch {
      return [];
    }
  }
  async function write(profiles: ZeroProfile[]): Promise<void> {
    await store.setItem(key, JSON.stringify(sortProfiles(profiles)));
  }
  return {
    async list() {
      return sortProfiles(await read());
    },
    async save(profile) {
      const profiles = await read();
      const index = profiles.findIndex((p) => p.id === profile.id);
      if (index === -1) profiles.push(profile);
      else profiles[index] = profile;
      await write(profiles);
    },
    async remove(id) {
      await write((await read()).filter((p) => p.id !== id));
    },
  };
}

export function createMemoryKeyValueStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}
