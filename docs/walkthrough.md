# Astro Planner — Walkthrough

A screenshot tour of every screen in the app, as of 2026-11-03 (through M7). Screenshots are from the Night theme unless noted; see the bottom of this doc for the Day theme.

---

## Onboarding

New users answer three questions, one per step, with Back/Next.

### Step 1 — Birth date

![Birth date step](walkthrough-screenshots/07-onboarding-1-birthdate.jpg)

### Step 2 — Birth time

Exact time, a rough window, or "I don't know" — the app adapts later screens to whichever is chosen (an unknown time means no houses or rising sign anywhere in the UI).

![Birth time step, approximate windows shown](walkthrough-screenshots/08-onboarding-2-birthtime.jpg)

### Step 3 — Birth place

A debounced search against OpenStreetMap Nominatim, with required attribution.

![Birth place step with live search results](walkthrough-screenshots/09-onboarding-3-birthplace.jpg)

---

## Today (`/`)

The home screen: an AI-written daily reading (generated server-side via Groq, from chart facts only — never personal details), a breakdown of the day's astrological themes, and the to-do list ranked against those themes. Each of the top 3 tasks shows the single strongest reason it's ranked where it is; every task shows its numeric score.

![Today screen with reading, themes, and ranked tasks](walkthrough-screenshots/01-today.jpg)

---

## Tasks (`/tasks`)

The full task list — open tasks first, then recently completed ones (crossed out). Add, edit, and delete (with a confirm step) all happen inline.

![Tasks list](walkthrough-screenshots/02-tasks.jpg)

### Add task form

![Add task form with a title filled in](walkthrough-screenshots/03-tasks-add-form.jpg)

---

## Chart (`/chart`)

### Simple view

Sun, Moon, and rising sign (when known) in plain language, plus the rest of the planets.

![Chart simple view](walkthrough-screenshots/04-chart-simple.jpg)

### Detailed view

Adds exact degrees, houses, and a full natal aspects table.

![Chart detailed view with aspects table](walkthrough-screenshots/05-chart-detailed-aspects.jpg)

---

## Settings (`/settings`)

![Settings screen](walkthrough-screenshots/06-settings.jpg)

Currently just the data-reset option. Edit-birth-details and About/credits are still open items for M8.

---

## Night vs. Day theme

The app follows `prefers-color-scheme` with no manual toggle — deep indigo and stars at night, a sunrise gradient and drifting clouds by day.

**Night** (see Today screenshot above) · **Day:**

![Today screen in the Day theme](walkthrough-screenshots/10-today-day-theme.jpg)

---

## Notes

- All screenshots are desktop width; the layout is also responsive down to phone widths (verified at 375px and 320px) as of the 2026-11-03 responsive pass.
- Not pictured: loading/empty/error states (e.g. "No tasks yet," a failed Groq call falling back to a quick-guide reading, a failed localStorage save) — these all exist per-screen but are harder to capture as a static screenshot.
