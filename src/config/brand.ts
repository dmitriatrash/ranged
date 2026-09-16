/**
 * Product identity. Change the name here; the header, document title,
 * PWA manifest and meta tags all read from this file.
 */
const nameParts = ["Range", "d"] as const;
const name = nameParts.join("");

export const brand = {
  /** Rendered as two parts; the second is highlighted in the header. */
  nameParts,
  name,
  shortName: name,
  tagline: "Optic zero calculator",
  title: `${name} — Optic Zero Calculator`,
  description:
    "Mobile-first calculator that turns point-of-impact offset into precise MOA or MIL click adjustments for zeroing rifle optics.",
  themeColor: "#0b1018",
  backgroundColor: "#0b1018",
};
