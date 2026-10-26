# M2 — Onboarding Checklist

Spec: [docs/spec.md](../../spec.md), sections 3.2 and 13 ("M2. Onboarding").

- [ ] **Onboarding steps** — three screens at `/onboarding`, one question each, with Back/Next:
  - Birth date (date picker, required, between 1900-01-01 and today)
  - Birth time (choice: **Exact time** / **Roughly** — morning 06–12, afternoon 12–18, evening 18–24, night 00–06 / **I don't know**)
  - Birth place (search box, debounced 500ms, needs 3+ characters)
- [ ] **Place search** — `/api/geocode` server route proxying Nominatim (never called directly from the browser); server-side throttle of 1 request/second; "Search results © OpenStreetMap contributors" attribution shown in the UI.
- [ ] **Time zone lookup** — confirm and install an offline lat/lon → time zone library (`tz-lookup` or `geo-tz`, per spec section 9) before using it in the geocode route.
- [ ] **Save birth data** — on finishing onboarding, save `BirthData` to localStorage and go to `/chart?first=1`; revisiting the app later skips onboarding if data's already saved.
- [ ] **Verify** — `npm run check` passes; commit.
