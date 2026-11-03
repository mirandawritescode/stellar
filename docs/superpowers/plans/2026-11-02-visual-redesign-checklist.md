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

- [x] **Fonts & tokens** — load Cormorant Garamond, Inter, and IBM Plex Mono via `next/font/google` (self-hosted at build time, not a runtime `<link>` tag). Set up the Night/Day CSS custom properties (background, card, border, text, muted text, accent) in `globals.css`, switched via `prefers-color-scheme`. Verified live: both gradients render correctly, fonts confirmed loaded via computed styles.
- [x] **Shared visual primitives** — `.glass-card`, `.section-label`, `.chip`, `.btn`/`.btn-primary`, `.field`, `.nav-link`, `.heading-display`, `.text-muted`/`.text-accent`/`.text-error`, plus `accent-color` tinting on native checkboxes/radios — all added to `globals.css`, consuming the CSS custom properties.
- [x] **Background effects** — `src/components/Sky.tsx`: both star and cloud element sets always render in the DOM (pure CSS, via `display: none`/`block` under `prefers-color-scheme`) so there's no client-side flash or hydration mismatch; mounted once in the root layout behind everything. Respects `prefers-reduced-motion` (verified by code review — the testing tool doesn't support emulating that media feature, so this wasn't exercised live).
- [x] **Apply to every screen** — Today, onboarding (all 3 steps), Chart (Simple + Detailed), Tasks (list + form), Settings, and `BottomNav`.
- [x] **Update the spec** — `docs/spec.md` section 11 and the section 15 open-decisions table now describe the real decided system instead of placeholders.
- [x] **Verify** — `npm run check` passes (95 tests); manually checked both themes across all five screens live in the browser, including the real AI reading, nav bar active state, checkbox accent tinting, and Chart's Detailed view/aspects table; commits made per logical step throughout.
