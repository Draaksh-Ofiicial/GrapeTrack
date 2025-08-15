# GitHub Copilot Guidelines for GrapeTrack

Purpose
- Provide concise, repo-specific rules for Copilot suggestions, edits, and automated changes in this Next.js + TypeScript project (Supabase/Drizzle).

Quick checklist (requirements)
- [x] Small, non-breaking edits only
- [x] Preserve repo conventions: TS + Next.js app router, Drizzle schema
- [x] No secrets in code
- [x] Add minimal tests for behavior changes
- [x] Update docs when endpoints/workflows change

Before making edits
1. Read related files: `src/api/*`, `drizzle/schema.ts`, `config/database.tsx`, `middleware.ts`, `workflow.md`, `roadmap.md`.
2. Infer up to two reasonable assumptions and state them in the PR description.
3. Write a tiny contract (inputs/outputs/errors/success) in the PR body.
4. Prefer a handler-level unit test for API changes.

Edit & commit rules
- Make the smallest patch required. Avoid reformatting unrelated code.
- When creating new files, add a one-line purpose on top.
- Commit message format: `<area>: short-summary` (e.g., `api(tasks): add assign endpoint`).
- Split large changes into multiple small PRs.

Quality gates (must pass before marking done)
- TypeScript compile (tsc)
- ESLint (project rules)
- Unit tests (happy path + 1 edge)
- Minimal manual smoke test of the changed route/page

Minimal contract template (2–4 bullets to include in PR body)
- Inputs: body/query param shapes (TS interfaces)
- Outputs: response shape + status codes
- Error modes: validation (400), auth (401/403), server (500)
- Success criteria: types compile, tests pass, smoke-check ok

Edge cases to consider
- Missing or null request fields
- Expired/invalid session
- Role/permission mismatch (RBAC)
- Concurrent updates (assignment races)
- Large result sets (pagination)

Testing guidance
- Add small unit tests close to the changed code.
- For API routes, test handler logic and mock DB/Drizzle where practical.
- Run `npm run build` and `npm test` locally before opening PR.

Docs & changelog
- Update `workflow.md` or `roadmap.md` when endpoints or user flows change.
- Add a one-line usage snippet for new API routes in `workflow.md`.

PR reviewer checklist (include in PR description)
- Short summary + why it was needed
- The tiny contract (inputs/outputs/errors)
- Commands for manual smoke test
- Any assumptions made

When to ask the maintainer (1 concise question only)
- Ask only if the change affects architecture, security, or user-facing behavior. Examples:
  - `Should role names be snake_case or camelCase?`
  - `Allow multiple assignees (UUID[]) or single assignee?`

Important paths to check before edits
- `src/api/*` (API routes)
- `drizzle/schema.ts` (DB schema)
- `config/database.tsx` (DB connection)
- `middleware.ts` (global middleware)
- `src/components/*` (UI changes)
- `workflow.md`, `roadmap.md` (update when behavior changes)

Final note
- Prefer small, reviewable patches. Include a contract, tests, and docs updates when behaviour changes.
- If a change is risky or unclear, present 2 short alternatives and ask one focused question.

---
Generated for repository: GrapeTrack
