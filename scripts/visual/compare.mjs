// Compares scripts/visual/current/*.png against scripts/visual/reference/*.png
// and writes reference | current | diff composites to scripts/visual/diff.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const root = "scripts/visual";
const outDir = join(root, "diff");
mkdirSync(outDir, { recursive: true });

const pad = (img, w, h) => {
  const out = new PNG({ width: w, height: h });
  out.data.fill(0);
  PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
  return out;
};

const rows = [];
for (const file of readdirSync(join(root, "reference")).filter((f) => f.endsWith(".png"))) {
  const ref = PNG.sync.read(readFileSync(join(root, "reference", file)));
  let cur;
  try {
    cur = PNG.sync.read(readFileSync(join(root, "current", file)));
  } catch {
    rows.push([file, "missing"]);
    continue;
  }
  const w = Math.max(ref.width, cur.width);
  const h = Math.max(ref.height, cur.height);
  const a = pad(ref, w, h);
  const b = pad(cur, w, h);
  const diff = new PNG({ width: w, height: h });
  const changed = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: 0.1 });
  const composite = new PNG({ width: w * 3, height: h });
  PNG.bitblt(a, composite, 0, 0, w, h, 0, 0);
  PNG.bitblt(b, composite, 0, 0, w, h, w, 0);
  PNG.bitblt(diff, composite, 0, 0, w, h, w * 2, 0);
  writeFileSync(join(outDir, file), PNG.sync.write(composite));
  rows.push([file, `${((changed / (w * h)) * 100).toFixed(2)}% differs`, `ref ${ref.width}x${ref.height}`, `cur ${cur.width}x${cur.height}`]);
}
for (const r of rows) console.log(r.join("  "));
