# Visual Redesign — "Night Static" / "Day" Checklist

Not a spec milestone — a cross-cutting visual pass over the five screens already built, decided through a brainstorm with mockups (see `.superpowers/brainstorm/` for the session, not committed). Replaces the placeholder design tokens in `docs/spec.md` section 11.

## What was decided

**Two themes, not generic light/dark** — mapped to `prefers-color-scheme` so no manual toggle is needed:
- **Night** (dark preference): deep indigo-violet gradient background (`#100d20` → `#1a1434` → `#231a40`), twinkling star field, periwinkle/lavender glow accent (`#c9b8ff`).
- **Day** (light preference): sunrise gradient background (`#f1e3ee` → `#fbdccb` → `#ffd9a0`), slowly drifting clouds instead of stars, warm gold/coral glow accent.
- Both: frosted-glass cards (`backdrop-filter: blur`), a faint scanline texture for the "technology" thread, the same layout/structure in both — only the palette and sky animation differ.

**Typography** — Cormorant Garamond (italic, 500/600 weight) for headings; Inter for body text; IBM Plex Mono for small data readouts (theme strength badges, planet positions).

**Motion** — individual positioned star/cloud elements (not a flat background image) with staggered `animation-delay` so they don't pulse/drift in sync; both animations disabled under `prefers-reduced-motion: reduce`.

**Scope** — visual only. No layout, structure, or content changes to any screen.

## Build steps

- [ ] **Fonts & tokens** — load Cormorant Garamond, Inter, and IBM Plex Mono via `next/font/google` (self-hosted at build time, not a runtime `<link>` tag). Set up the Night/Day CSS custom properties (background, card, border, text, muted text, accent) in `globals.css`, switched via `prefers-color-scheme`.
- [ ] **Shared visual primitives** — reusable styles/classes for the glass card, section label, theme/strength chip, and nav bar treatment, so each page isn't duplicating the same CSS.
- [ ] **Background effects** — a `Starfield`/`Sky` component (twinkling stars for Night, drifting clouds for Day) rendered once at the layout level, behind everything; respects `prefers-reduced-motion`.
- [ ] **Apply to every screen** — Today, the three onboarding steps, Chart (Simple + Detailed), Tasks (list + form), Settings, and `BottomNav`.
- [ ] **Update the spec** — replace `docs/spec.md` section 11's placeholder design-token note with the actual decided system above.
- [ ] **Verify** — `npm run check` passes; manually check both themes (OS color-scheme toggle) across all five screens; confirm `prefers-reduced-motion` actually disables the animations; commit.
