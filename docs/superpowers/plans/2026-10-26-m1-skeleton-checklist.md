# M1 — Skeleton Checklist

Simplified companion to [2026-10-26-m1-skeleton.md](2026-10-26-m1-skeleton.md). Work through these one at a time.

- [ ] **Scaffold** — run `create-next-app` (Next.js + TypeScript + Tailwind), without touching `README.md`, `CLAUDE.md`, or `docs/`.
- [ ] **Git** — `git init`; confirm `.gitignore` excludes `node_modules`, `.next`, `.env*`; first commit.
- [ ] **Scripts** — add `typecheck` and `test` (Vitest) scripts, combine into `check`. *(Vitest is a new dependency — confirm before installing: MIT licensed, free, dev-only.)*
- [ ] **Tab bar** — four empty pages (Today, Tasks, Chart, Settings) with a bottom nav bar linking them.
- [ ] **Verify** — `npm run check` passes; commit.
