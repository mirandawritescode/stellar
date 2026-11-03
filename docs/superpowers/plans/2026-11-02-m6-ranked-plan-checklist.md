# M6 — Ranked Plan Checklist

Spec: [docs/spec.md](../../spec.md), section 7 (task ranking) and section 13 ("M6. Ranked plan").

- [x] **`rankTasks`** (`src/lib/planner/rank.ts`) — pure function: `rankTasks(tasks: Task[], day: DayThemes, today: string): RankedTask[]`. Scores each open task (completed tasks excluded):
  - Overdue: +5
  - Due today: +4
  - Due in the next 3 days: +2
  - Category matches a day theme: + that theme's strength × 2
  - Category is in `caution`: −1 (still shows; reason suggests a smaller first step)
  - Created more than 7 days ago and not done: +1
  - Ties: earlier due date first, then oldest `createdAt`.
  - Top-3 reason text, picked from the **strongest (highest-point) factor** — priority order only breaks an exact point tie (e.g. "Due today", "Overdue since Mon", "Good day for calls & messages: Mercury trine your Sun", "Go gently: try a 15-minute first step").
  - Tests: one per factor, plus ties and an empty list (per spec's explicit instruction) — 16 tests total.
- [x] **Wire into Today** — replaced the raw theme-strength list with "Best for today" (top 3 ranked tasks with reasons) and "Everything else" (remaining open tasks, ranked order, no reason shown); tasks check off inline and re-rank immediately.
- [x] **Verify** — `npm run check` passes (114 tests); manual browser check with a realistic mixed task list (overdue, due today, due soon, theme match, no due date). Caught and fixed a real bug this way: the reason-selection logic was picking by factor priority order unconditionally instead of by point value first, so a task due in 2 days showed "Due Wed" instead of its actual strongest factor (a themed match worth more points) — fixed and locked in with a regression test; commit.
