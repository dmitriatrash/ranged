// Renders PWA / touch icons from the brand gradient + crosshair mark.
import { chromium } from "@playwright/test";

const mark = (size, padding) => `
<html><body style="margin:0;background:transparent">
<div style="width:${size}px;height:${size}px;display:grid;place-items:center;
  background:${padding ? "#0b1018" : "transparent"}">
  <div style="width:${size - padding * 2}px;height:${size - padding * 2}px;border-radius:${padding ? 0 : size * 0.28}px;
    display:grid;place-items:center;
    background-image:linear-gradient(135deg, oklch(78% .18 165), oklch(72% .18 200))">
    <svg width="${(size - padding * 2) * 0.5}" height="${(size - padding * 2) * 0.5}" viewBox="0 0 24 24" fill="none"
      stroke="oklch(15% .02 250)" stroke-width="2.5" stroke-linecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/>
      <line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>
    </svg>
  </div>
</div></body></html>`;

const outputs = [
  { file: "public/pwa-192.png", size: 192, padding: 0 },
  { file: "public/pwa-512.png", size: 512, padding: 0 },
  { file: "public/apple-touch-icon.png", size: 180, padding: 0, opaque: true },
  { file: "public/pwa-maskable-512.png", size: 512, padding: 0, opaque: true },
];

const browser = await chromium.launch();
for (const o of outputs) {
  const page = await browser.newPage({ viewport: { width: o.size, height: o.size } });
  await page.setContent(
    o.opaque
      ? mark(o.size, 0).replace(`border-radius:${o.size * 0.28}px`, "border-radius:0")
      : mark(o.size, 0),
  );
  await page.screenshot({ path: o.file, omitBackground: !o.opaque });
  await page.close();
}
await browser.close();
console.log("icons written");
