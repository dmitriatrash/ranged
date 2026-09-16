import { expect, test } from "@playwright/test";

const instruction = (page: import("@playwright/test").Page) => page.getByTestId("instruction");

test("calculates, saves and restores a zero across reloads", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Zero distance").fill("25");
  await page.getByLabel("Vertical offset").fill("2");
  await page.getByRole("radio", { name: "High" }).click();
  await page.getByLabel("Horizontal offset").fill("1.5");
  await page.getByRole("radio", { name: "Left" }).click();
  await expect(instruction(page)).toHaveText("Turn elevation 31 clicks down and windage 23 clicks right.");

  await page.getByRole("button", { name: "Save this zero" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("textbox", { name: /Firearm/ })).toBeFocused();
  await page.keyboard.type("Test rifle");
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Profile saved")).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: /Profiles/ }).click();
  const card = page.getByRole("listitem", { name: "Test rifle" });
  await expect(card).toContainText("25 yd");
  await expect(card).toContainText("Turn elevation 31 clicks down and windage 23 clicks right.");

  await card.getByRole("button", { name: /Open Test rifle/ }).click();
  await expect(page.getByLabel("Vertical offset")).toHaveValue("2");
  await expect(page.getByRole("radio", { name: "High" })).toBeChecked();
  await expect(instruction(page)).toHaveText("Turn elevation 31 clicks down and windage 23 clicks right.");
});

test("is fully keyboard operable", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard flow is desktop-only");
  await page.goto("/");
  await page.getByRole("tab", { name: /Calculator/ }).focus();
  await page.keyboard.press("Tab"); // into panel
  await page.getByLabel("Zero distance").focus();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("50");
  await page.keyboard.press("Tab"); // distance unit group
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio", { name: "m", exact: true })).toBeChecked();
  await expect(page.getByLabel("Zero distance")).toHaveValue("45.72");

  await page.getByLabel("Vertical offset").focus();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("x");
  await page.keyboard.press("Enter"); // submits the form
  await expect(page.getByText("Vertical offset must be a number, for example 1.5.")).toBeVisible();
  await expect(page.getByLabel("Vertical offset")).toBeFocused();
});

test("layout fits the viewport with comfortable touch targets", async ({ page, isMobile }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  if (!isMobile) return;
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("button, [role=tab], input")]
      .map((el) => ({ name: el.textContent?.trim() || el.getAttribute("aria-label") || el.id, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height < 40)
      .map(({ name, rect }) => `${name} ${Math.round(rect.height)}px`),
  );
  expect(small).toEqual([]);
});

test("works offline once installed as a PWA", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium");
  await page.goto("/");
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector('link[rel="manifest"]')?.getAttribute("href");
    return href ? (await fetch(href)).json() : null;
  });
  expect(manifest).toMatchObject({ short_name: "Ranged", display: "standalone" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // let the service worker control the page
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ranged");
  await page.getByLabel("Vertical offset").fill("1");
  await expect(instruction(page)).toHaveText("Turn elevation 4 clicks up.");
  await context.setOffline(false);
});
