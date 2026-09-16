# Ranged — optic zero calculator

Ranged is a recreation of the original ZeroPoint app (renamed), built with React, TypeScript, Vite, Tailwind CSS 4, and **HeroUI 3**. It is an installable, offline-capable PWA.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit + workflow tests (Vitest)
npm run test:e2e     # Playwright against the production build (desktop + mobile)
npm run build
```

## Layout

```
src/
  core/                 Framework-independent logic. No React, DOM or storage APIs.
    units.ts            Units, conversions, angular subtension (exact atan)
    calculator.ts       calculateZero(), click rounding, directions, instruction text
    draft.ts            Form model, strict decimal parsing, validation messages,
                        unit switching that preserves the physical measurement
    profiles.ts         ZeroProfile model, create/update, legacy-record normalisation
    profileRepository.ts  ProfileRepository interface + key-value implementation
  platform/             Web adapters (localStorage-backed repository, id generation)
  config/brand.ts       Product name, tagline, title, colours. Rename the app here.
  components/           Shared UI built on HeroUI (segmented control, chips, number field)
  features/             calculator / profiles / reference screens
e2e/                    Playwright tests
scripts/visual/         Screenshot capture + pixel diff against the live original
```

`src/core` only uses plain TypeScript, so it can be moved into a React Native app as is, or ported directly to Swift. `ProfileRepository` is async and sits on a `KeyValueStore` (`getItem` / `setItem`). That interface matches both Web Storage and React Native's AsyncStorage.

### Calculation

The correction angle is `atan(offset / distance)`, expressed in MOA (π/10800 rad) or MIL (1 mrad). The click count is `angle / clickValue`, rounded to the nearest click with halves rounding up; floating-point noise is removed before rounding. Impact low means dial up, and impact left means dial right. An axis that rounds to 0 clicks is reported as "on target".

### Visual comparison

```bash
npm run visual:reference   # capture the live original
npm run dev & npm run visual:capture
npm run visual:compare     # writes reference | current | diff images to scripts/visual/diff
```
