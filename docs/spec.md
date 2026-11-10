# Stellar — v1 Build Spec

Save this file as `docs/spec.md`. It's the source of truth for v1. `CLAUDE.md` holds the working rules; this file holds what to build.

**Scope:** a 2-week, $0 v1. Chart in, to-dos in, daily reading and ranked plan out.
**Status of open decisions:** see section 15. Where a decision is still open, the default in brackets applies.

---

## 1. Product summary

Each morning the user opens the app and sees:

1. A short, personal **daily reading** based on the day's transits to their natal chart.
2. Their **to-do list ranked for today**, with a one-line reason for each of the top tasks.

They set up their birth details once. Everything is stored in their browser; there are no accounts.

### v1 goals
- Desktop-first, and responsive down to phone widths so nothing breaks or overflows there. A dedicated mobile-first redesign (its own small-screen layout/UX) and iPhone Home Screen install testing are deferred — see section 11.
- Accurate chart math, honest about missing birth details.
- Runs locally with a portfolio-quality README; hosting comes later.

### Non-goals for v1
See section 14 (v2 backlog).

---

## 2. Users and core flow

**Users:** a mix of casual astrology fans and more serious ones. v1 keeps language friendly; the chart screen offers more detail on tap.

**First visit**
1. Welcome screen: one sentence on what the app does, "Get started" button.
2. Onboarding: birth date → birth time (exact / rough / unknown) → birth place.
3. Chart summary appears; "Go to today" button.
4. Empty to-do list with a prompt to add the first tasks.

**Every day after**
1. Open app → Today screen.
2. Reading loads (cached after the first load of the day).
3. Ranked tasks below; user checks tasks off, adds new ones.

---

## 3. Screens

### 3.1 Welcome (`/welcome`)
- App name, one-line pitch, "Get started".
- Shown only when no birth data is saved; otherwise redirect to `/`.

### 3.2 Onboarding (`/onboarding`)
As of 2026-11-03, a single page, not a step wizard: all three questions on one centered, arched card (a moon-and-sparkle glyph, "Let's chart your sky"), submitted together with one button rather than Back/Next.

| Field | Input | Rules |
| --- | --- | --- |
| Name | Text | Optional; shown as a "Hi, {name}" greeting on Today. Local only — never sent to Groq (rule 6) |
| Birth date | Date picker | Required; between 1900-01-01 and today |
| Birth time | Choice: **Exact time** (time picker) · **Roughly** (a pill picker: morning 06–12, afternoon 12–18, evening 18–24, night 00–06) · **I don't know** | Required choice; helper text: "Your birth certificate usually has it"; picking "I don't know" shows a short note that houses/rising sign will be skipped |
| Birth place | Search box → results list from `/api/geocode` | Required; debounce 500 ms; show "Search results © OpenStreetMap contributors" |

All fields validate together on submit ("Reveal my chart"), showing inline errors for whichever are incomplete — there's no per-step gate. On submit: save `BirthData`, compute and save the chart, go to `/chart?first=1`.

### 3.3 Chart (`/chart`)
- **Simple view (default):** Sun, Moon and rising sign (if known) with one friendly sentence each, then the other planets as a list: planet, sign, and house (if known).
- **Detailed view (toggle):** degrees, houses, and natal aspects table.
- Badges: "Estimated" next to anything based on a rough or unknown time.
- If the Moon's sign is ambiguous (section 5.3), show "Moon in Leo or Virgo".
- Link: "Add or fix birth details" → onboarding with values prefilled.

### 3.4 Today (`/`, the home screen)
As of 2026-11-06, redesigned around a short pull-quote hero and a tabbed task list, to cut the scroll distance to "Best for today":
- **Header:** date first ("Friday · November 6", via Luxon), then "Hi, {name}" when a name was given. No arch-card/glyph on this screen (kept on Onboarding, Chart, Settings).
- **Quote hero:** the reading's one-line tip as an italic pull-quote, loading state while fetching. A "Read the full reading ›" toggle expands in place to show the full 80–120 word reading, then a "why" list — one card per today's theme and caution (LIFT/EASE badge), each a plain-language sentence built by `src/lib/astro/explain.ts`: "{Planet} says {saying}, which lifts/touches {Category} because {reason}." No astrology jargon, no houses/rising mentioned (rule 8). Toggles back via "Show less ‹".
- **Mood line:** one sentence below the quote — "Today favors A, B, and C — go gently on D, E, and F" — from the same theme/caution data (good themes bold, caution ones italic). Caution categories already shown as a "today's theme" are omitted here (a category can be both boosted and cautioned by different planets; showing it in both reads as a contradiction, though the −1 still applies to scoring either way).
- **Tabs:** "Best (N)", "Caution (N)", "All (N)" — replaces the old stacked Best/Bad/Everything-else sections. As of 2026-11-10, a task whose category is in today's caution list is always treated as a caution task regardless of its score (an overdue task can still outscore everything else while its category is flagged "go gently" — the two signals are independent): Caution = every open task whose category is in today's caution list; Best = the top 3 ranked tasks *among the rest*; All = every open task in ranked order. Each task row shows a plain-language tier chip instead of a raw point value — Best/Better/Good for Best's top 3, Gentle for caution tasks (in whichever tab they appear), Open for the rest — still backed by the real score, with the numeric breakdown available on hover/focus.
- Check off tasks inline; "Add task" button (next to the tabs) opens the add form as a modal (same `TaskFormModal` Tasks uses).
- Error and limit states in section 8.4.

`PointsChip` (`src/components/PointsChip.tsx`) takes optional `label`/`muted` props for the tier-word style above; Tasks (3.5) doesn't pass them and keeps its numeric `PTS` chip. The hover/focus popover itself is plain-language on both screens now — a bulleted list of `RankedTask.factors[].reason` text, no point values — backed by `RankedTask.factors` in `src/lib/planner/rank.ts`.

### 3.5 Tasks (`/tasks`)
- Full list: open tasks first, then completed (last 7 days). As of 2026-11-03, a "Sort by" toggle (shown once birth data exists) switches the open-task order between due date and today's points — same scoring as Today, with the same points chip and hover/focus breakdown on each open task. Completed tasks stay at the end either way.
- Add / edit form: title (required, max 120 chars), category (required), due date (optional). Opens as a modal (`TaskFormModal`, shared with Today's "Add task").
- Delete with a confirm step. Completed tasks older than 30 days are removed automatically.

### 3.6 Settings (`/settings`)
- **Appearance:** as of 2026-11-06, an Auto/Day/Night toggle — Auto (default) follows the system setting; Day/Night pin it regardless. See section 11.
- Edit birth details.
- Reading tone (if Mira enables the choice later; v1 uses the fixed default).
- "Delete all my data" (clears localStorage after confirmation).
- About: credits for OpenStreetMap, the chart library, and Groq.

**Navigation:** bottom tab bar with Today, Tasks, Chart, Settings.

---

## 4. Data model

All types live in `src/lib/types.ts`. Everything is stored in localStorage under keys prefixed `ap:` with a `version` field for future migrations.

```ts
type TimeAccuracy = "exact" | "approximate" | "unknown";
type ApproxWindow = "morning" | "afternoon" | "evening" | "night";

interface BirthPlace {
  name: string;        // display name from Nominatim
  lat: number;
  lon: number;
  timeZone: string;    // IANA, e.g. "America/New_York"
}

interface BirthData {
  version: 1;
  name?: string;             // optional, local display only — never sent to Groq
  date: string;              // "1990-06-15"
  timeAccuracy: TimeAccuracy;
  time?: string;             // "14:30", only when exact
  approxWindow?: ApproxWindow; // only when approximate
  place: BirthPlace;
}

type Planet =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars"
  | "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";

type Sign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
  | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

interface PlanetPosition {
  planet: Planet;
  longitude: number;    // 0–360, tropical
  sign: Sign;
  degreeInSign: number;
  house?: number;       // 1–12, only when birth time is exact or approximate
  retrograde: boolean;
  altSign?: Sign;       // Moon only, when its sign is ambiguous (5.3)
}

type AspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition";

interface Aspect {
  a: Planet;            // for transits: the moving planet
  b: Planet;            // for transits: the natal planet
  type: AspectType;
  orb: number;          // degrees from exact
}

interface NatalChart {
  version: 1;
  computedFrom: { date: string; timeUsed: string; timeAccuracy: TimeAccuracy };
  planets: PlanetPosition[];
  ascendant?: { sign: Sign; degreeInSign: number; estimated: boolean };
  aspects: Aspect[];
}

type Theme =
  | "focus" | "communication" | "creative" | "admin"
  | "social" | "selfcare" | "money" | "action";

type TaskCategory = Theme;   // tasks use the same vocabulary as themes

interface DayThemes {
  date: string;                          // local date, "2026-11-03"
  themes: { theme: Theme; strength: number; reasons: string[] }[]; // strength 1–3
  caution: { theme: Theme; reasons: string[] }[]; // as of 2026-11-03, with why (e.g. "Venus square your Saturn")
  moonPhase: "new" | "waxing" | "full" | "waning";
}

interface Task {
  id: string;            // crypto.randomUUID()
  title: string;
  category: TaskCategory;
  dueDate?: string;      // "2026-11-05"
  done: boolean;
  createdAt: string;     // ISO
  completedAt?: string;  // ISO
}

interface DailyReading {
  date: string;          // local date it was generated for
  title: string;
  reading: string;       // 80–120 words
  tip: string;           // one sentence
  themes: Theme[];
  source: "ai" | "fallback";
}
```

**Category labels shown in the UI:** Focus work, Calls & messages, Creative, Admin & errands, Social, Self-care, Money, Physical & action.

---

## 5. Natal chart calculation (`src/lib/astro/natal.ts`)

### 5.1 Library
Use `circular-natal-horoscope-js` for planet positions, houses and the ascendant. Wrap it so the rest of the app only sees our types. Tropical zodiac. House system: **Placidus** [default; switch to Whole Sign if the library handles it more reliably].

If the library can't meet a requirement here, stop and propose an alternative (e.g., Auseklis, MIT) before switching.

### 5.2 Converting birth time to a moment
- Use Luxon with `place.timeZone` to turn local date and time into UTC, so historical daylight saving time is correct.
- **Exact:** use the given time.
- **Approximate:** use the window's midpoint (morning 09:00, afternoon 15:00, evening 21:00, night 03:00). Houses and ascendant are computed but marked `estimated: true`.
- **Unknown:** use 12:00 local. Do **not** compute or show houses or the ascendant.

### 5.3 Ambiguous Moon
When time is approximate or unknown, also compute the Moon at the start and end of the possible window (approximate: the window's bounds; unknown: 00:00 and 23:59 local). If the Moon's sign differs, set `altSign` and show both.

### 5.4 Natal aspects
Major aspects only, between the 10 planets: conjunction 0°, sextile 60°, square 90°, trine 120°, opposition 180°. Orbs: 8° for aspects involving Sun or Moon, 6° otherwise.

### 5.5 Tests
Fixture charts in `src/test/fixtures/` with expected signs (and houses where known). Mira will supply 2–3 charts she has checked against a trusted chart site. Signs must match exactly; degrees within 1°.

---

## 6. Daily transits and themes (`src/lib/astro/transits.ts`, `themes.ts`)

### 6.1 Transits
- Compute planet positions for **12:00 local time today** in the user's current browser time zone.
- Find aspects from each transiting planet to each natal planet. Transit orbs: Moon 4°, Sun/Mercury/Venus/Mars 3°, Jupiter–Pluto 2°.
- Moon phase from the Sun–Moon angle: new (0–45°), waxing (45–135° and 135–180°), full (180–225°), waning (225–360°) [simplified four-phase model].
- Note retrograde for Mercury, Venus and Mars.

### 6.2 Planet → themes
| Transiting planet | Themes |
| --- | --- |
| Sun | focus |
| Moon | selfcare |
| Mercury | communication, admin |
| Venus | social, creative, money |
| Mars | action, focus |
| Jupiter | money, social |
| Saturn | admin, focus |
| Uranus | creative |
| Neptune | creative, selfcare |
| Pluto | focus |

### 6.3 Starter rules (Mira will refine these)
1. **Harmonious aspect** (trine, sextile) from a planet → its themes gain +1 strength.
2. **Conjunction** → its themes gain +1 strength and are flagged "intense".
3. **Challenging aspect** (square, opposition) → its themes go into `caution` (do them, but in smaller pieces).
4. Aspects to the natal **Sun or Moon** count double.
5. **Moon phase:** new → +1 focus (start things); waxing → +1 action; full → +1 social, finish and review; waning → +1 admin (clear the decks).
6. **Mercury retrograde** → +1 admin (review, edit, follow up); communication goes into `caution`.
7. **Venus retrograde** → money goes into `caution`.
8. **Mars retrograde** → action goes into `caution`; +1 selfcare.
9. If no theme reaches strength 1, default to focus 1 and admin 1.
10. Cap strength at 3; keep the top 3 themes; keep a human-readable reason for each boost (e.g., "Mercury trine your Sun").

Each rule is data-driven (a list of rule objects), so Mira can edit rules without touching logic. Unit-test each rule.

---

## 7. Task ranking (`src/lib/planner/rank.ts`)

One pure function:

```ts
function rankTasks(tasks: Task[], day: DayThemes, today: string): RankedTask[];

interface RankedTask {
  task: Task;
  score: number;
  reason?: string;   // shown for the top 3
}
```

**Score for each open task:**

| Factor | Points |
| --- | --- |
| Overdue | +5 |
| Due today | +4 |
| Due in the next 3 days | +2 |
| Category matches a day theme | + that theme's strength × 2 |
| Category is in `caution` | −1 (it still shows; the reason suggests a smaller first step) |
| Created more than 7 days ago and not done | +1 (nudge stale tasks) |

Ties: earlier due date first, then oldest `createdAt`. Completed tasks are excluded.

**Reasons** (top 3 only), from the strongest factor: "Due today", "Overdue since Mon", "Calls & messages is favored today", "Go gently on Calls & messages today". As of 2026-11-06, the theme-match and caution reasons are plain-language (`shortThemeReason` in `src/lib/astro/explain.ts`) rather than raw aspect text — the full astrology detail still lives in `DayThemes.themes[].reasons`/`caution[].reasons` and surfaces in Today's "why" list (3.4) instead.

A category can be both a top theme and in caution at once (different planets driving each). As of 2026-11-10, the caution factor (and its −1) is dropped entirely whenever that task's category also matched a theme — once a category is favored today, it's just favored, with no separate "go gently"/tougher-aspect footnote or scoring penalty. Today's tab/tier placement (3.4) uses the same theme-filtered caution list, so a task is never labeled Gentle for a category the mood line just called favored.

Write the tests first: one test per factor, plus ties and an empty list.

---

## 8. Daily reading (`src/app/api/reading/route.ts`)

### 8.1 Flow
1. Today screen checks localStorage for `ap:reading:<local-date>`. If present, show it; done.
2. Otherwise POST to `/api/reading` with chart facts, today's transits, `DayThemes`, and which birth details are missing. **No names or birth place.**
3. Server calls Groq, validates the JSON, returns a `DailyReading`.
4. Client caches it for the day.

### 8.2 Groq call
- Model: `openai/gpt-oss-120b` [fallback model: `llama-3.3-70b-versatile`]. Read the model name from an env var `GROQ_MODEL` with that default.
- Use Groq's OpenAI-compatible chat completions endpoint with JSON output.
- Temperature 0.7; max output about 400 tokens.
- Timeout 15 s.

### 8.3 Prompt (starting point)
**System:**
> You are the voice of Stellar, a daily planning app. Write a short daily reading from the astrological facts provided. Tone: [warm and practical, lightly mystical]. Ground every statement in the facts given; never invent placements or aspects. If the birth time is unknown, never mention houses or the rising sign. No predictions about health, money outcomes, or relationships ending. Return JSON only: {"title": string (max 6 words), "reading": string (80–120 words), "tip": string (one sentence linking today's themes to getting things done), "themes": array of the theme names given}.

**User:** a compact JSON block with natal Sun/Moon/rising (when known), today's transit aspects with orbs, moon phase, retrogrades, `DayThemes`, and `missing: ["birthTime"]` when relevant.

### 8.4 Limits and failures
- **Groq rate limit (429), timeout or invalid JSON:** return a `fallback` reading built from `DayThemes` and template sentences (e.g., "Today leans toward communication and admin. A good day to clear messages and small tasks."). Show a small note: "Today's full reading is taking a break; here's your quick guide."
- Basic abuse guard: at most 5 requests per IP per hour, kept in memory on the server (good enough for v1).
- Never log request bodies.

---

## 9. Birth place lookup (`src/app/api/geocode/route.ts`)

- `GET /api/geocode?q=<text>` → proxies Nominatim search (`format=jsonv2`, `limit=5`, `addressdetails=0`).
- Send a descriptive `User-Agent` with a contact email, as Nominatim's usage policy requires. Read it from an env var `CONTACT_EMAIL`.
- Server-side throttle: at most 1 request per second; client debounces 500 ms and needs at least 3 characters.
- Return `{ name, lat, lon, timeZone }[]`, with `timeZone` from an offline lookup library (e.g., `tz-lookup` or `geo-tz`; confirm license and bundle size, ask before adding).

---

## 10. Installable web app (PWA)

Built in M7: manifest and icons via Next.js's own file conventions (`src/app/manifest.ts`, generated `icon.tsx`/`apple-icon.tsx`/192px+512px icons), so "Add to Home Screen" is ready. Actual Home Screen testing on an iPhone waits until the app is hosted somewhere a phone can reach — see section 11.

- A minimal service worker is optional in v1; if added, cache only the app shell, never API responses.

---

## 11. Design

- **Desktop-first, responsive down to phone widths.** Single column, max content width 640px, centered; the same layout reflows to fit narrow screens without overflowing or breaking (verified down to 320px). A dedicated mobile-first redesign — its own small-screen layout/UX, not just "doesn't break" — is deferred to a later pass; see section 14.
- **"Night" and "Day," not generic light/dark.** Defaults to `prefers-color-scheme` (dark → Night, light → Day). As of 2026-11-06, Settings → Appearance has an Auto/Day/Night override (`data-theme` on `<html>`, stored in `localStorage` as `ap:theme`; a `beforeInteractive` script applies it before first paint so there's no flash on reload):
  - **Night**: deep indigo-violet gradient background (`#100d20` → `#1a1434` → `#231a40`), a twinkling star field, periwinkle/lavender glow accent (`#c9b8ff`).
  - **Day**: sunrise gradient background (`#f1e3ee` → `#fbdccb` → `#ffd9a0`), slowly drifting clouds instead of stars, warm gold/coral glow accent (`#d98a4f`).
  - Both: frosted-glass cards (`backdrop-filter: blur`), a faint scanline texture, individually-animated star/cloud elements (staggered `animation-delay`, not synchronized) — all defined as CSS custom properties in `src/app/globals.css`, consumed by shared primitives (`.glass-card`, `.chip`, `.btn`, `.field`, `.nav-link`) rather than one-off styling per screen.
- **Typography**: Cormorant Garamond (italic, 500/600 weight) for headings; Inter for body text; IBM Plex Mono for small data readouts (theme strength badges, planet positions, aspect orbs). Loaded via `next/font/google`.
- Contrast at least WCAG AA; visible focus states; both animations disabled under `prefers-reduced-motion: reduce`.
- Tone of UI copy: friendly, short, never preachy.

---

## 12. Environment variables

| Name | Where | Notes |
| --- | --- | --- |
| `GROQ_API_KEY` | `.env.local` | Server only. Never prefix with `NEXT_PUBLIC_` |
| `GROQ_MODEL` | `.env.local`, optional | Defaults to `openai/gpt-oss-120b` |
| `CONTACT_EMAIL` | `.env.local` | Used in the Nominatim User-Agent |

Commit a `.env.example` with names only.

---

## 13. Build order and acceptance criteria

Work in this order. Each milestone ends with `npm run check` passing and a local Git commit.

**M1. Skeleton (days 1–2)**
- [ ] Local Git repo initialized, with `.gitignore` covering `node_modules`, `.next` and `.env*`.
- [ ] Next.js + TypeScript + Tailwind app runs at http://localhost:3000.
- [ ] ESLint, `typecheck` script, Vitest and a combined `check` script set up.
- [ ] Bottom tab bar with four empty pages.

**M2. Onboarding (days 2–3)**
- [ ] All three steps work with Back/Next and validation.
- [ ] Place search returns results via `/api/geocode`, with attribution.
- [ ] Birth data saved; revisiting the app skips onboarding.

**M3. Chart (days 4–5)**
- [ ] Natal chart computed per section 5, including unknown and approximate times.
- [ ] Fixture tests pass.
- [ ] Simple and detailed views; "Estimated" badges; ambiguous Moon shown correctly.

**M4. Tasks (days 6–7)**
- [ ] Add, edit, complete, delete; categories; due dates; stored in localStorage.
- [ ] Data survives reloads; old completed tasks cleaned up.

**M5. Transits, themes, reading (days 8–9)**
- [ ] `DayThemes` computed per section 6, with tests for each rule.
- [ ] `/api/reading` returns valid readings; cached once per day.
- [ ] Fallback reading appears when Groq fails (test by using a bad key).

**M6. Ranked plan (days 10–11)**
- [ ] `rankTasks` passes its tests.
- [ ] Today screen shows reading, themes, top 3 with reasons, and the rest.

**M7. Install and polish (day 12)**
- [ ] Manifest and icons in place (Home Screen testing on iPhone waits until the app is hosted).
- [ ] Loading, empty and error states on every screen; basic accessibility pass.

**M8. Wrap-up (days 13–14)**
- [x] Tested end to end in a desktop browser and in phone-sized view (browser dev tools); top issues fixed.
- [x] README updated: demo GIF, screenshots, stack, how it works, how to run it locally.
- [x] Settings → About lists credits.

---

## 14. v2 backlog (not in v1)

- Dedicated mobile-first redesign: its own small-screen layout/UX (not just the responsive safety-net reflow built in v1), Home Screen/PWA install testing on iPhone Safari (deferred in section 11 — desktop-first for now)
- Push to GitHub, CI with GitHub Actions, and hosting on Vercel's free plan
- Morning energy check-in that adjusts the day's load
- Hour-by-hour plan view
- Chart wheel drawing (AstroChart, MIT)
- Optional sign-in and sync (Supabase free tier)
- Read-only calendar (Google Calendar; iCloud via calendar link)
- Push notifications for Home Screen users
- Reading tone choice in Settings
- Custom domain

---

## 15. Open decisions (defaults in brackets)

| Decision | Default until Mira decides |
| --- | --- |
| App name | Decided — Stellar |
| Reading tone | [warm and practical, lightly mystical] |
| Astrology system | [Western tropical] |
| House system | [Placidus] |
| Colors and fonts | Decided — Night/Day theme, see section 11 |
| Chart library license | Decided — Unlicense (public domain), confirmed |
