# CLAUDE.md

Project memory for Claude Code. Read this first in every session, then `docs/spec.md` for details.

## What we're building

**Astro Planner** (working name): a free web app that reads a user's natal chart and the day's transits, writes a short AI daily reading, and ranks their to-do list for the day. Desktop-first for now; mobile support is deferred (see `docs/spec.md` section 11).

- Owner: Mira, an experienced web developer who is new to Claude Code.
- Goal: a working, portfolio-quality v1 in **2 weeks** (about 20 hours total), running **locally only** for now.
- Hard rule: **$0 running cost.** Only free tiers and open-source libraries.

Full spec: `docs/spec.md` · Longer-term plan: `docs/project-plan.md`

## Stack

- Next.js (App Router) + React + TypeScript (strict) + Tailwind CSS
- Hosting: none yet; the app runs locally (Vercel's free plan later)
- Readings: Groq free tier, model `openai/gpt-oss-120b`, called **only** from a server route
- Chart math: `circular-natal-horoscope-js` (confirm its license before shipping)
- Birth place lookup: OpenStreetMap Nominatim (via our server route) + an offline time-zone library
- Dates and time zones: Luxon
- Storage: the user's browser (localStorage); **no accounts, no database** in v1
- Tests: Vitest, run locally (no CI for now)
- Version control: local Git only (no remote)

## Commands

```bash
npm run dev        # local dev server at http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest
npm run check      # lint + typecheck + test together
```

Run `npm run check` before saying a task is done.

## Project structure

```
src/
  app/              routes and pages (App Router)
    api/reading/    POST: generates the daily reading via Groq
    api/geocode/    GET: proxies Nominatim place search
  components/       UI components
  lib/
    astro/          natal chart, transits, aspects, themes (pure functions)
    planner/        task scoring (pure functions)
    storage/        typed localStorage helpers
    types.ts        shared types (see spec, "Data model")
  test/             Vitest tests and fixture charts
public/             manifest, icons
docs/               spec, project plan, decision notes
```

## How to work with Mira

- **Plan first.** For any feature, show a short plan and wait for "go ahead" before writing code.
- **One task at a time.** Keep changes small and focused on what was asked.
- **Explain in plain language** what you changed and why, in a few sentences.
- **Ask before adding a dependency.** Say what it does, its license, and confirm it's free.
- Suggest a clear commit message when a step works.

## Code conventions

- TypeScript strict; no `any`. Shared types live in `src/lib/types.ts`.
- Astrology and planner logic are **pure functions** in `src/lib/`, with Vitest tests. UI components stay thin.
- Desktop-first for now (single column, max content width 720px); accessible color contrast; semantic HTML. Mobile-first responsive layout and touch tap-target sizing are deferred — see spec section 11 and 14.
- Handle loading, empty and error states on every screen.
- Dates: store ISO strings; do time-zone math with Luxon, never with raw `Date` offsets.

## Rules (do not break)

1. **Never commit secrets.** The only secret is `GROQ_API_KEY`, kept in `.env.local`. `.env*` stays in `.gitignore`.
2. **Local only for now.** Commit to local Git, but don't add remotes, push, or set up GitHub, CI or hosting unless Mira asks.
3. **Never call Groq from the browser.** Only `src/app/api/reading`.
4. **No paid services** and nothing that needs a credit card.
5. **Respect free-tier limits:** one reading per user per day (cached in the browser); Nominatim at most 1 request per second, with a proper User-Agent and OpenStreetMap attribution in the UI.
6. **Never send names or other personal details to Groq**, only chart facts.
7. **The AI writes, the code calculates.** Planet positions, aspects and themes come from our code; Groq only turns them into prose.
8. If the birth time is unknown, nothing (UI or reading) may mention houses or the rising sign.

## Out of scope for v1

GitHub, CI and hosting; sign-in and sync, calendar, push notifications, energy check-in, hour-by-hour view, chart wheel drawing, custom domain. Don't build these unless Mira asks; they're listed in the spec's v2 backlog.
