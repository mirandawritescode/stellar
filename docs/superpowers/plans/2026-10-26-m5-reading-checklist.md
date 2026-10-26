# M5 — Transits, Themes & Reading Checklist

Spec: [docs/spec.md](../../spec.md), sections 6 (transits & themes), 8 (daily reading), and section 13 ("M5. Transits, themes, reading").

- [x] **Transits** (`src/lib/astro/transits.ts`) — compute transiting planet positions for 12:00 local time today, in the user's current browser time zone. Find aspects from each transiting planet to each natal planet. Transit orbs: Moon 4°, Sun/Mercury/Venus/Mars 3°, Jupiter–Pluto 2°. Moon phase from the Sun–Moon angle (new/waxing/full/waning, simplified four-phase model). Note retrograde for Mercury, Venus, Mars. Verified via a self-consistency check against the independently-verified natal chart pipeline (same moment, same UTC+0 reference location → every planet comes back conjunct itself at ~0° orb).
- [x] **Themes** (`src/lib/astro/themes.ts`) — planet → themes mapping, plus the 10 starter rules from spec section 6.3 (data-driven rule objects, each unit-tested), producing `DayThemes`: top 3 themes with strength (capped at 3) and human-readable reasons, a `caution` list, and the moon phase. *(Design note: rule 9's "no theme reaches strength 1" fallback checks right after the aspect rules, before the always-on moon-phase/retrograde modifiers — otherwise moon phase alone would make the fallback unreachable every day.)*
- [ ] **Daily reading** (`src/app/api/reading/route.ts` + client caching) —
  - Client checks `localStorage` (`ap:reading:<local-date>`) first; if present, use it.
  - Otherwise POST chart facts + today's transits + `DayThemes` + which birth details are missing to the route — **no names or birth place**, chart facts only.
  - Server calls Groq (`GROQ_MODEL` env var, default `openai/gpt-oss-120b`), validates the returned JSON, caches it client-side for the day.
  - Fallback: on Groq rate limit (429), timeout (15s), or invalid JSON, return a template-built `fallback` reading from `DayThemes` instead, with a small "taking a break" note.
  - Abuse guard: at most 5 requests per IP per hour, kept in memory on the server.
- [ ] **Verify** — fallback path tested with a bad/missing `GROQ_API_KEY`; `npm run check` passes; commit.
