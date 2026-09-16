// Prints bounding boxes of comparable elements for two builds side by side.
// Usage: node scripts/visual/measure.mjs <refUrl> <curUrl> <width> <height>
import { chromium } from "@playwright/test";

const [refUrl, curUrl, w = "1440", h = "900"] = process.argv.slice(2);
const probe = () => {
  const rows = [];
  const add = (name, el) => {
    if (!el) return rows.push([name, "-"]);
    const r = el.getBoundingClientRect();
    rows.push([name, `${Math.round(r.x)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}`]);
  };
  const byText = (sel, text) => [...document.querySelectorAll(sel)].find((e) => e.textContent.trim() === text);
  add("header", document.querySelector("header"));
  add("h1", document.querySelector("h1"));
  add("tablist", document.querySelector("[role=tablist]"));
  add("tab", document.querySelector("[role=tab]"));
  document.querySelectorAll("main section, main article").forEach((s, i) => add(`section${i}`, s));
  document.querySelectorAll("h2").forEach((s) => add(`h2 ${s.textContent.slice(0, 12)}`, s));
  document.querySelectorAll("label").forEach((s) => add(`label ${s.textContent.slice(0, 12)}`, s));
  document.querySelectorAll("input").forEach((s, i) => add(`input${i}`, s));
  for (const t of ["yd", "15 yd", "100 yd", "Low", "inches", "MOA", "1/4 MOA", "Calculate", "Reset", "Save this zero"])
    add(`btn ${t}`, byText("button", t));
  add("svg", document.querySelector("svg[role=img]"));
  add("safety", [...document.querySelectorAll("p")].find((p) => p.textContent.startsWith("Always follow")));
  add("instr", [...document.querySelectorAll("p")].find((p) => p.textContent.startsWith("You're on")));
  return rows;
};
const browser = await chromium.launch();
const results = [];
for (const url of [refUrl, curUrl]) {
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  results.push(new Map(await page.evaluate(probe)));
}
await browser.close();
for (const [k, v] of results[0]) {
  const c = results[1].get(k);
  console.log(`${v === c ? "  " : "≠ "}${k.padEnd(24)} ${String(v).padEnd(24)} ${c}`);
}
for (const [k, v] of results[1]) if (!results[0].has(k)) console.log(`+ ${k.padEnd(24)} ${"".padEnd(24)} ${v}`);
