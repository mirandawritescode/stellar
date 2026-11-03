# M6 — Ranked Plan Checklist

Spec: [docs/spec.md](../../spec.md), section 7 (task ranking) and section 13 ("M6. Ranked plan").

- [ ] **`rankTasks`** (`src/lib/planner/rank.ts`) — pure function: `rankTasks(tasks: Task[], day: DayThemes, today: string): RankedTask[]`. Scores each open task (completed tasks excluded):
  - Overdue: +5
  - Due today: +4
  - Due in the next 3 days: +2
  - Category matches a day theme: + that theme's strength × 2
  - Category is in `caution`: −1 (still shows; reason suggests a smaller first step)
  - Created more than 7 days ago and not done: +1
  - Ties: earlier due date first, then oldest `createdAt`.
  - Top-3 reason text, picked from the strongest factor (e.g. "Due today", "Overdue since Mon", "Good day for calls: Mercury trine your Sun", "Go gently: try a 15-minute first step").
  - Tests: one per factor, plus ties and an empty list (per spec's explicit instruction).
- [ ] **Wire into Today** — replace the plain theme list with: "Best for today" (top 3 ranked tasks with reasons) and "Everything else" (remaining open tasks, ranked order, no reason shown).
- [ ] **Verify** — `npm run check` passes; manual browser check with a realistic mixed task list; commit.
