# M3 — Chart Checklist

Spec: [docs/spec.md](../../spec.md), section 5 (natal chart calculation) and section 13 ("M3. Chart").

- [x] **Dependencies** — install `circular-natal-horoscope-js` (planet/house/ascendant math) and `luxon` (timezone-correct date math). Both confirmed free (`circular-natal-horoscope-js` is actually Unlicense/public domain, not MIT as first guessed — corrected and still free; `luxon` is MIT).
- [x] **Fixture data** — used Barack Obama and Princess Diana's AA-rated (birth-certificate-verified) charts as fixtures, cross-checked against Astro-Databank-sourced data, in `src/test/fixtures/`.
- [x] **Natal chart calculation** (`src/lib/astro/natal.ts`) — a pure function wrapping the library so the rest of the app only sees our own types, per spec section 5:
  - Birth date/time/place is passed directly to the library's `Origin`, which derives the correct historical UTC offset from latitude/longitude internally (verified exactly against both fixtures, down to the minute) — `luxon` isn't used by this specific calculation as a result, but stays installed for the timezone-aware date math still needed in M4/M5 per `CLAUDE.md`'s standing rule.
  - Approximate time uses the window's midpoint (morning 09:00, afternoon 15:00, evening 21:00, night 03:00) with houses marked `estimated: true`; unknown time uses 12:00 local with no houses or ascendant computed at all.
  - Ambiguous Moon: when time is approximate or unknown, also compute the Moon at the window's bounds; if its sign differs, set `altSign`.
  - Natal aspects: conjunction/sextile/square/trine/opposition between the 10 planets, 8° orb for Sun/Moon aspects, 6° otherwise.
  - Fixture tests pass (signs exact, degrees within 1°) — 45 tests total.
- [x] **Chart page UI** — Simple view (Sun/Moon/rising with a sentence each, other planets as a sign+house list) and a Detailed view toggle (degrees, houses, natal aspects table); "Estimated" badges wherever time is approximate/unknown; ambiguous Moon shown as "Moon in X or Y". Verified live: Obama's chart matches reference data exactly; the ambiguous-Moon case ("Moon in Taurus or Gemini") triggered organically on real data, not just a synthetic test.
- [x] **Verify** — `npm run check` passes; commit.
