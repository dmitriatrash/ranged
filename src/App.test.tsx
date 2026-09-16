import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { App } from "./App";
import {
  type ProfileRepository,
  createKeyValueProfileRepository,
  createMemoryKeyValueStore,
  PROFILES_STORAGE_KEY,
} from "./core";

beforeAll(() => {
  // jsdom lacks these browser APIs used by the app / React Aria.
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
  window.scrollTo = () => {};
});

let seq = 0;
function setup(repository: ProfileRepository = createKeyValueProfileRepository(createMemoryKeyValueStore())) {
  const user = userEvent.setup();
  render(<App repository={repository} newId={() => `id-${++seq}`} now={() => Date.UTC(2026, 8, 16)} />);
  return { user, repository };
}

const instruction = () => screen.getByTestId("instruction");
const option = (name: string) => screen.getByRole("radio", { name });
const field = (label: RegExp | string) => screen.getByRole("textbox", { name: label });

async function type(user: ReturnType<typeof userEvent.setup>, label: string | RegExp, value: string) {
  const input = field(label);
  await user.clear(input);
  if (value) await user.type(input, value);
  return input;
}

describe("calculator", () => {
  it("starts on target with the original defaults", () => {
    setup();
    expect(instruction()).toHaveTextContent("You're on target. No adjustment needed.");
    expect(field("Zero distance")).toHaveValue("100");
    expect(option("yd")).toBeChecked();
    expect(option("Low")).toBeChecked();
    expect(option("Right")).toBeChecked();
    expect(option("inches")).toBeChecked();
    expect(option("MOA")).toBeChecked();
    expect(field(/Click value/)).toHaveValue("0.25");
  });

  it("uses the decimal keypad on every numeric input", () => {
    setup();
    for (const label of ["Zero distance", "Vertical offset", "Horizontal offset", /Click value/]) {
      expect(field(label)).toHaveAttribute("inputmode", "decimal");
    }
  });

  it("updates results live as shot data and directions change", async () => {
    const { user } = setup();
    await type(user, "Zero distance", "25");
    await type(user, "Vertical offset", "2");
    await type(user, "Horizontal offset", "1.5");
    expect(instruction()).toHaveTextContent("Turn elevation 31 clicks up and windage 23 clicks left.");

    await user.click(option("High"));
    await user.click(option("Left"));
    expect(instruction()).toHaveTextContent("Turn elevation 31 clicks down and windage 23 clicks right.");
    expect(screen.getByText("Elevation: 31 clicks down, 7.64 MOA.")).toBeInTheDocument();
    expect(screen.getByText("Windage: 23 clicks right, 5.73 MOA.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /2 inches high and 1.5 inches left/ })).toBeInTheDocument();
  });

  it("applies distance and click presets", async () => {
    const { user } = setup();
    await type(user, "Vertical offset", "1");
    await user.click(screen.getByRole("radio", { name: "50 yd" }));
    expect(field("Zero distance")).toHaveValue("50");
    expect(instruction()).toHaveTextContent("Turn elevation 8 clicks up.");
    await user.click(screen.getByRole("radio", { name: "1 MOA" }));
    expect(field(/Click value/)).toHaveValue("1");
    expect(instruction()).toHaveTextContent("Turn elevation 2 clicks up.");
    await type(user, /Click value/, "0.125");
    expect(instruction()).toHaveTextContent("Turn elevation 15 clicks up.");
  });

  it("switches MOA/MIL and resets the click value", async () => {
    const { user } = setup();
    await type(user, "Vertical offset", "3.6");
    await user.click(option("MIL"));
    expect(field(/Click value \(MIL\)/)).toHaveValue("0.1");
    expect(instruction()).toHaveTextContent("Turn elevation 10 clicks up.");
    expect(screen.getByRole("radio", { name: "0.05 MIL" })).toBeInTheDocument();
  });

  it("keeps the physical measurement when switching units", async () => {
    const { user } = setup();
    await type(user, "Vertical offset", "1.5");
    const before = instruction().textContent;

    await user.click(option("m"));
    expect(field("Zero distance")).toHaveValue("91.44");
    await user.click(option("cm"));
    expect(field("Vertical offset")).toHaveValue("3.81");
    expect(instruction().textContent).toBe(before);

    await user.click(option("yd"));
    await user.click(option("inches"));
    expect(field("Zero distance")).toHaveValue("100");
    expect(field("Vertical offset")).toHaveValue("1.5");
  });

  it("restores the exact typed value after a round trip", async () => {
    const { user } = setup();
    await type(user, "Zero distance", "33.333");
    await user.click(option("m"));
    expect(field("Zero distance")).toHaveValue("30.48");
    await user.click(option("yd"));
    expect(field("Zero distance")).toHaveValue("33.333");
  });

  it("shows actionable errors after blur and on Calculate", async () => {
    const { user } = setup();
    const distance = await type(user, "Zero distance", "");
    expect(screen.queryByText(/Enter your zero distance/)).not.toBeInTheDocument();
    await user.tab();
    expect(screen.getByText("Enter your zero distance, for example 100.")).toBeInTheDocument();
    expect(distance).toHaveAttribute("aria-invalid", "true");
    expect(instruction()).toHaveTextContent("Fix the highlighted fields to see your adjustment.");

    await type(user, "Zero distance", "-5");
    expect(screen.getByText(/can't be negative/)).toBeInTheDocument();
    await type(user, "Zero distance", "0");
    expect(screen.getByText("Distance must be greater than 0.")).toBeInTheDocument();
    await type(user, "Zero distance", "100");

    await type(user, "Horizontal offset", "abc");
    await type(user, /Click value/, "0");
    await user.click(screen.getByRole("button", { name: /Calculate/ }));
    expect(screen.getByText("Horizontal offset must be a number, for example 1.5.")).toBeInTheDocument();
    expect(screen.getByText("Click value must be greater than 0.")).toBeInTheDocument();
    expect(field("Horizontal offset")).toHaveFocus();
    expect(screen.getByRole("button", { name: /Save this zero/ })).toBeDisabled();
  });

  it("links errors to their inputs for screen readers", async () => {
    const { user } = setup();
    await type(user, "Vertical offset", "-1");
    await user.tab();
    const input = field("Vertical offset");
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    const text = describedBy
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent)
      .join(" ");
    expect(text).toContain("use Low / High to set the direction");
  });

  it("resets to defaults", async () => {
    const { user } = setup();
    await type(user, "Zero distance", "25");
    await user.click(option("MIL"));
    await user.click(screen.getByRole("button", { name: /Reset/ }));
    expect(field("Zero distance")).toHaveValue("100");
    expect(option("MOA")).toBeChecked();
    expect(field(/Click value/)).toHaveValue("0.25");
  });
});

describe("profiles", () => {
  async function saveProfile(user: ReturnType<typeof userEvent.setup>, firearm: string) {
    await user.click(screen.getByRole("button", { name: /Save this zero/ }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByRole("textbox", { name: /Firearm/ }), firearm);
    await user.type(within(dialog).getByRole("textbox", { name: /Optic/ }), "Strike Eagle");
    await user.click(within(dialog).getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  }

  it("shows the empty state", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("tab", { name: /Profiles/ }));
    expect(screen.getByText("No saved profiles yet")).toBeInTheDocument();
  });

  it("requires a firearm name", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /Save this zero/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("textbox", { name: /Firearm/ })).toHaveFocus();
    await user.click(within(dialog).getByRole("button", { name: "Save profile" }));
    expect(within(dialog).getByText("Name the firearm so you can find this zero later.")).toBeInTheDocument();
  });

  it("saves, persists, reopens, edits and deletes a profile", async () => {
    const store = createMemoryKeyValueStore();
    const { user } = setup(createKeyValueProfileRepository(store));
    await type(user, "Zero distance", "25");
    await type(user, "Vertical offset", "2");
    await saveProfile(user, "AR-15");

    const stored = JSON.parse(String(store.getItem(PROFILES_STORAGE_KEY)));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ firearm: "AR-15", optic: "Strike Eagle", distance: 25, clickValue: 0.25 });

    // Loaded profile: the save button now offers to update it.
    expect(screen.getByRole("button", { name: /Update “AR-15”/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Reset/ }));
    await user.click(screen.getByRole("tab", { name: /Profiles/ }));
    const card = screen.getByRole("listitem", { name: "AR-15" });
    expect(within(card).getByText("25 yd")).toBeInTheDocument();
    expect(within(card).getByText("0.25 MOA")).toBeInTheDocument();
    expect(within(card).getByText(new Date(Date.UTC(2026, 8, 16)).toLocaleDateString())).toBeInTheDocument();
    expect(within(card).getByText("Turn elevation 31 clicks up.")).toBeInTheDocument();

    // Reopen in the calculator.
    await user.click(within(card).getByRole("button", { name: "Open AR-15 in calculator" }));
    expect(screen.getByRole("tab", { name: /Calculator/ })).toHaveAttribute("aria-selected", "true");
    expect(field("Zero distance")).toHaveValue("25");
    expect(field("Vertical offset")).toHaveValue("2");
    expect(instruction()).toHaveTextContent("Turn elevation 31 clicks up.");

    // Update the zero with new shot data.
    await type(user, "Vertical offset", "1");
    await user.click(screen.getByRole("button", { name: /Update “AR-15”/ }));
    let dialog = await screen.findByRole("dialog", { name: "Update saved zero" });
    expect(within(dialog).getByRole("textbox", { name: /Firearm/ })).toHaveValue("AR-15");
    await user.click(within(dialog).getByRole("button", { name: "Update profile" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    // Rename from the list.
    await user.click(screen.getByRole("tab", { name: /Profiles/ }));
    expect(screen.getByText("Turn elevation 15 clicks up.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit AR-15" }));
    dialog = await screen.findByRole("dialog", { name: "Edit profile" });
    const name = within(dialog).getByRole("textbox", { name: /Firearm/ });
    await user.clear(name);
    await user.type(name, "AR-15 Carbine{Enter}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("listitem", { name: "AR-15 Carbine" })).toBeInTheDocument();
    expect(await createKeyValueProfileRepository(store).list()).toHaveLength(1);

    // Delete, then undo.
    await user.click(screen.getByRole("button", { name: "Delete AR-15 Carbine" }));
    expect(screen.getByText("No saved profiles yet")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Undo" }));
    expect(await screen.findByRole("listitem", { name: "AR-15 Carbine" })).toBeInTheDocument();
  });

  it("can save a loaded profile as a new one", async () => {
    const { user, repository } = setup();
    await type(user, "Vertical offset", "2");
    await saveProfile(user, "Rifle A");
    await user.click(screen.getByRole("button", { name: /Update “Rifle A”/ }));
    const dialog = await screen.findByRole("dialog");
    const name = within(dialog).getByRole("textbox", { name: /Firearm/ });
    await user.clear(name);
    await user.type(name, "Rifle B");
    await user.click(within(dialog).getByRole("button", { name: "Save as new" }));
    await waitFor(async () => expect((await repository.list()).map((p) => p.firearm).sort()).toEqual(["Rifle A", "Rifle B"]));
  });

  it("loads profiles saved by the original app", async () => {
    const store = createMemoryKeyValueStore({
      [PROFILES_STORAGE_KEY]: JSON.stringify([
        { id: "legacy", firearm: "Old rifle", optic: "", ammo: "", distance: 50, distanceUnit: "m", adjUnit: "MIL", clickValue: 0.1, lastInstruction: "Turn elevation 3 clicks up.", savedAt: Date.UTC(2026, 0, 2) },
      ]),
    });
    const { user } = setup(createKeyValueProfileRepository(store));
    await user.click(screen.getByRole("tab", { name: /Profiles/ }));
    const card = await screen.findByRole("listitem", { name: "Old rifle" });
    expect(within(card).getByText("0.1 MIL")).toBeInTheDocument();
    await user.click(within(card).getByRole("button", { name: /Open Old rifle/ }));
    expect(field("Zero distance")).toHaveValue("50");
    expect(option("m")).toBeChecked();
    expect(option("MIL")).toBeChecked();
  });
});

describe("reference", () => {
  it("shows the primer and safety note", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("tab", { name: /Reference/ }));
    expect(screen.getByRole("heading", { name: "MOA & MIL — the basics" })).toBeInTheDocument();
    for (const title of ["Minute of Angle (MOA)", "Milliradian (MIL)", "How clicks scale with distance", "Direction rules"]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByText(/Always follow firearm safety rules/)).toBeInTheDocument();
  });

  it("supports arrow-key tab navigation", async () => {
    const { user } = setup();
    screen.getByRole("tab", { name: /Calculator/ }).focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("tab", { name: /Reference/ })).toHaveAttribute("aria-selected", "true");
  });
});
