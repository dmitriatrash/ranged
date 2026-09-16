import { useCallback, useEffect, useState } from "react";
import { type ProfileRepository, type ZeroProfile, sortProfiles } from "../../core";

/** React binding for a ProfileRepository with optimistic updates. */
export function useProfiles(repository: ProfileRepository) {
  const [profiles, setProfiles] = useState<ZeroProfile[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    setProfiles(await repository.list());
    setLoaded(true);
  }, [repository]);

  useEffect(() => {
    void refresh();
    // Keep multiple open tabs in sync.
    const onStorage = () => void refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const save = useCallback(
    async (profile: ZeroProfile) => {
      setProfiles((list) => sortProfiles([...list.filter((p) => p.id !== profile.id), profile]));
      await repository.save(profile);
    },
    [repository],
  );

  const remove = useCallback(
    async (id: string) => {
      setProfiles((list) => list.filter((p) => p.id !== id));
      await repository.remove(id);
    },
    [repository],
  );

  return { profiles, loaded, save, remove };
}
