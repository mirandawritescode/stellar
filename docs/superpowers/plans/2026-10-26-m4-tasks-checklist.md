# M4 — Tasks Checklist

Spec: [docs/spec.md](../../spec.md), sections 3.5 (Tasks screen) and 4 (data model), and section 13 ("M4. Tasks").

- [ ] **Task type & storage** — add `Theme`/`TaskCategory`/`Task` types to `src/lib/types.ts` (per spec section 4). Build typed `localStorage` helpers (`src/lib/storage/tasks.ts`) for loading/saving/adding/updating/deleting tasks, plus pure, tested functions for:
  - Sorting the list: open tasks first (by due date), then completed tasks from the last 7 days.
  - Cleanup: completed tasks older than 30 days are removed automatically.
- [ ] **Tasks list UI** (`/tasks`) — shows the full list in the order above; an empty state when there are no tasks yet.
- [ ] **Add/edit form** — title (required, max 120 chars), category (required, one of the 8 labels: Focus work, Calls & messages, Creative, Admin & errands, Social, Self-care, Money, Physical & action), due date (optional). One form reused for both adding and editing.
- [ ] **Complete & delete** — check off tasks inline; delete goes through a confirm step before removing.
- [ ] **Verify** — data survives a reload; `npm run check` passes; commit.
