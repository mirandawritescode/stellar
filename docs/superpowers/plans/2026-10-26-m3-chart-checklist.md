# M3 — Chart Checklist

Spec: [docs/spec.md](../../spec.md), section 5 (natal chart calculation) and section 13 ("M3. Chart").

- [ ] **Dependencies** — install `circular-natal-horoscope-js` (planet/house/ascendant math) and `luxon` (timezone-correct date math). Both MIT licensed, free, confirmed.
- [ ] **Fixture data** — pick 2-3 well-documented public figures' birth data (date, time, place), cross-check expected Sun/Moon/rising signs (and houses where known) against public astrology references, save as fixtures in `src/test/fixtures/`, and write failing tests against them.
- [ ] **Natal chart calculation** (`src/lib/astro/natal.ts`) — a pure function wrapping the library so the rest of the app only sees our own types, per spec section 5:
  - Convert birth date/time/place to a UTC moment via Luxon: exact time as given; approximate time uses the window's midpoint (morning 09:00, afternoon 15:00, evening 21:00, night 03:00) with houses marked `estimated: true`; unknown time uses 12:00 local with no houses or ascendant computed at all.
  - Ambiguous Moon: when time is approximate or unknown, also compute the Moon at the window's bounds; if its sign differs, set `altSign`.
  - Natal aspects: conjunction/sextile/square/trine/opposition between the 10 planets, 8° orb for Sun/Moon aspects, 6° otherwise.
  - Fixture tests pass (signs exact, degrees within 1°).
- [ ] **Chart page UI** — Simple view (Sun/Moon/rising with a sentence each, other planets as a sign+house list) and a Detailed view toggle (degrees, houses, natal aspects table); "Estimated" badges wherever time is approximate/unknown; ambiguous Moon shown as "Moon in X or Y".
- [ ] **Verify** — `npm run check` passes; commit.
