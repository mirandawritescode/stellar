# M7 — Install and Polish Checklist

Spec: [docs/spec.md](../../spec.md), section 13 ("M7. Install and polish").

- [x] **Manifest + icons** — add `src/app/manifest.ts` (Next.js's built-in manifest convention: name, short name, `display: "standalone"`, theme/background colors) and `src/app/icon.tsx` + `src/app/apple-icon.tsx` (generated with `next/og`'s `ImageResponse`, reusing the ✦ glyph and accent color already used in the UI, so no external image-editing tool is needed). No app-store copy; this only covers "Add to Home Screen" readiness. Actual Home Screen testing on a phone waits until the app is hosted, per spec.
- [x] **Loading states** — Today, Chart, and Tasks currently `return null` while reading from localStorage (a blank-page flash, likely sub-50ms but a flash all the same). Replace with a small "Loading..." text matching the pattern already used for the reading card, instead of a blank screen.
- [x] **Empty state gap** — onboarding's place search shows nothing when a search returns zero results, indistinguishable from "still searching." Add a "No places found" message.
- [x] **Error state gaps:**
  - Chart: `computeNatalChart` runs unguarded; malformed/edge-case birth data would crash the page with no message. Wrap it and show an error message instead.
  - Tasks: saving to localStorage has no error handling; a storage failure (quota exceeded, private browsing) fails silently. Add a visible error message if a save fails.
  - Settings: `clearAllData()` has no error handling either. Same treatment.
- [x] **Accessibility pass:**
  - Onboarding: group the three time-accuracy radios in a `<fieldset>`/`<legend>`; add `aria-pressed` to the approximate-time-window buttons so a screen reader can tell which one is selected.
  - Tasks: make the delete-confirm "Yes"/"No" buttons' accessible names task-specific (e.g. "Yes, delete 'Call Mom back'") instead of generic "Yes"/"No".
  - Chart: add `scope` attributes to the aspects table's header cells.
- [x] **Verify** — `npm run check` passes (114 tests); manual browser check of every screen's loading/empty/error states, including faking a localStorage quota error and a zero-result onboarding search. Also caught and fixed a real rendering bug: the generated app icon's "✦" character came out as a broken-glyph box (the icon renderer's default font doesn't include that symbol) — replaced it with an SVG sparkle path instead of a text glyph; commit.
