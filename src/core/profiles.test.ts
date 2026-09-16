import { describe, expect, it } from "vitest";
import type { ZeroInput } from "./calculator";
import { createKeyValueProfileRepository, createMemoryKeyValueStore, PROFILES_STORAGE_KEY } from "./profileRepository";
import {
  createProfile,
  normalizeProfile,
  profileToInput,
  updateProfile,
  validateProfileDetails,
} from "./profiles";

const input: ZeroInput = {
  distance: 50,
  distanceUnit: "yd",
  verticalOffset: 2,
  verticalImpact: "low",
  horizontalOffset: 1,
  horizontalImpact: "right",
  offsetUnit: "in",
  adjustmentUnit: "MOA",
  clickValue: 0.25,
};
const details = { firearm: "  AR-15 16\"  ", optic: "Strike Eagle", ammo: "" };

describe("profile model", () => {
  it("requires a firearm name and limits lengths", () => {
    expect(validateProfileDetails({ firearm: "  ", optic: "", ammo: "" }).firearm).toMatch(/Name the firearm/);
    expect(validateProfileDetails({ firearm: "x".repeat(81), optic: "", ammo: "" }).firearm).toMatch(/under 80/);
    expect(validateProfileDetails(details)).toEqual({});
  });

  it("creates, updates and round-trips to calculator input", () => {
    const p = createProfile(details, input, "Turn …", { id: "a", now: 1000 });
    expect(p.firearm).toBe("AR-15 16\"");
    expect(profileToInput(p)).toEqual(input);

    const renamed = updateProfile(p, { ...details, ammo: "55gr" }, 2000);
    expect(renamed).toMatchObject({ ammo: "55gr", createdAt: 1000, updatedAt: 2000, distance: 50 });

    const rezeroed = updateProfile(p, details, 3000, { input: { ...input, distance: 100 }, instruction: "new" });
    expect(rezeroed).toMatchObject({ distance: 100, instruction: "new", updatedAt: 3000 });
  });

  it("reads profiles saved by the original app", () => {
    const legacy = {
      id: "x",
      firearm: "Rifle",
      optic: "",
      ammo: "",
      distance: 100,
      distanceUnit: "yd",
      adjUnit: "MIL",
      clickValue: 0.1,
      lastInstruction: "Turn elevation 3 clicks up.",
      savedAt: 42,
    };
    const p = normalizeProfile(legacy);
    expect(p).toMatchObject({ adjustmentUnit: "MIL", instruction: legacy.lastInstruction, createdAt: 42, updatedAt: 42 });
    expect(profileToInput(p!)).toMatchObject({ verticalOffset: 0, horizontalOffset: 0, offsetUnit: "in" });
  });

  it.each([null, 5, {}, { id: "a", firearm: "", distance: 1, distanceUnit: "yd", adjUnit: "MOA", clickValue: 1 },
    { id: "a", firearm: "R", distance: -1, distanceUnit: "yd", adjUnit: "MOA", clickValue: 1 },
    { id: "a", firearm: "R", distance: 1, distanceUnit: "ft", adjUnit: "MOA", clickValue: 1 }])(
    "drops unusable record %#",
    (raw) => {
      expect(normalizeProfile(raw)).toBeNull();
    },
  );
});

describe("key-value profile repository", () => {
  it("saves, lists newest first, upserts and removes", async () => {
    const repo = createKeyValueProfileRepository(createMemoryKeyValueStore());
    const a = createProfile(details, input, "a", { id: "a", now: 1 });
    const b = createProfile({ ...details, firearm: "B" }, input, "b", { id: "b", now: 2 });
    await repo.save(a);
    await repo.save(b);
    expect((await repo.list()).map((p) => p.id)).toEqual(["b", "a"]);

    await repo.save(updateProfile(a, { ...details, firearm: "A2" }, 3));
    const list = await repo.list();
    expect(list).toHaveLength(2);
    expect(list.find((p) => p.id === "a")?.firearm).toBe("A2");

    await repo.remove("b");
    expect((await repo.list()).map((p) => p.id)).toEqual(["a"]);
  });

  it("survives corrupted storage", async () => {
    const store = createMemoryKeyValueStore({ [PROFILES_STORAGE_KEY]: "{not json" });
    const repo = createKeyValueProfileRepository(store);
    expect(await repo.list()).toEqual([]);
    const store2 = createMemoryKeyValueStore({ [PROFILES_STORAGE_KEY]: JSON.stringify([{ bad: true }]) });
    expect(await createKeyValueProfileRepository(store2).list()).toEqual([]);
  });

  it("works with async stores", async () => {
    const data = new Map<string, string>();
    const repo = createKeyValueProfileRepository({
      getItem: async (k) => data.get(k) ?? null,
      setItem: async (k, v) => void data.set(k, v),
    });
    await repo.save(createProfile(details, input, "a", { id: "a", now: 1 }));
    expect(await repo.list()).toHaveLength(1);
  });
});
