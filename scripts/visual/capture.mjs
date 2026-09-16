// Captures the same set of UI states from any build of the app so the
// recreation can be compared against the live reference.
// Usage: node scripts/visual/capture.mjs <baseUrl> <outDir>
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const [baseUrl, outDir] = process.argv.slice(2);
if (!baseUrl || !outDir) {
  console.error("Usage: node scripts/visual/capture.mjs <baseUrl> <outDir>");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const SAMPLE_PROFILE = [
  {
    id: "sample-1",
    firearm: "AR-15 16\"",
    optic: "Vortex Strike Eagle 1-8x",
    ammo: "55gr FMJ",
    distance: 50,
    distanceUnit: "yd",
    adjUnit: "MOA",
    clickValue: 0.25,
    lastInstruction: "Turn elevation 8 clicks up and windage 4 clicks left.",
    savedAt: Date.UTC(2026, 8, 1, 12),
  },
];

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const hideBadge = async (page) => {
  await page.addStyleTag({ content: "#lovable-badge{display:none!important} *{caret-color:transparent!important} body{background-attachment:scroll!important}" });
};

async function open(browser, viewport, profiles) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    locale: "en-US",
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  await context.addInitScript((data) => {
    try {
      window.localStorage.setItem("zeropoint.profiles", JSON.stringify(data));
    } catch {}
  }, profiles);
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await hideBadge(page);
  await page.waitForTimeout(400);
  return { context, page };
}

// Segmented toggles are buttons in the original and radios here; match either.
const toggle = (page, name) => page.locator("button", { hasText: new RegExp(`^\\s*${name}\\s*$`) }).first();

const shot = (page, name, fullPage = true) =>
  page.screenshot({ path: join(outDir, `${name}.png`), fullPage, animations: "disabled" });

const browser = await chromium.launch();
for (const [vpName, viewport] of Object.entries(viewports)) {
  {
    const { context, page } = await open(browser, viewport, []);
    await shot(page, `${vpName}-calc-default`);

    await page.getByLabel("Zero distance").fill("25");
    await page.getByLabel("Vertical offset").fill("2");
    await toggle(page, "High").click();
    await page.getByLabel("Horizontal offset").fill("1.5");
    await toggle(page, "Left").click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    await shot(page, `${vpName}-calc-filled`);

    await toggle(page, "MIL").click();
    await toggle(page, "cm").click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    await shot(page, `${vpName}-calc-mil`);

    await page.getByRole("button", { name: /Save this zero/ }).click();
    await page.waitForTimeout(600);
    await shot(page, `${vpName}-dialog`, false);

    await page.getByRole("tab", { name: /Reference/ }).click().catch(() => {});
    await context.close();
  }
  {
    const { context, page } = await open(browser, viewport, []);
    await page.getByRole("tab", { name: /Profiles/ }).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    await shot(page, `${vpName}-profiles-empty`);
    await page.getByRole("tab", { name: /Reference/ }).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    await shot(page, `${vpName}-reference`);
    await context.close();
  }
  {
    const { context, page } = await open(browser, viewport, SAMPLE_PROFILE);
    await page.getByRole("tab", { name: /Profiles/ }).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    await shot(page, `${vpName}-profiles-saved`);
    await context.close();
  }
}
await browser.close();
console.log(`Saved screenshots to ${outDir}`);
