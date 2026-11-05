# Little Time Machine Constitution

## Core Principles

### I. Time Accuracy (NON-NEGOTIABLE)

- All time-zone conversions MUST use IANA time-zone identifiers (e.g. `America/Denver`)
  and a standards-based implementation (`Intl` / Temporal or a maintained library).
  Fixed UTC offsets MUST NOT be stored or hard-coded for a location.
- Class times MUST be stored as a wall-clock time plus the class's home IANA zone, so
  daylight saving time (DST) transitions are resolved per date, not once.
- Every displayed time MUST show its time zone (name or abbreviation) and, where a DST
  change affects the result, MUST make that change visible to the user.
- Zones without DST, zones with non-hour offsets (e.g. `Asia/Kolkata`), and dates near
  DST transitions MUST be handled correctly.

Rationale: The app's sole purpose is telling people the right time to attend class. A wrong
time means a missed class, so correctness outranks every other concern.

### II. Clarity for Teachers and Students

- The primary user flow (pick a class time, see it in my local time) MUST be completable
  without instructions or an account.
- UI text MUST use plain language; technical terms such as "UTC offset" or "IANA" MUST NOT
  be required to understand a result.
- The user's local time zone MUST be detected from the browser by default and MUST be
  changeable manually.

Rationale: BYU Pathway teachers and students span many countries and technical skill levels;
the tool only helps if anyone can read the answer at a glance.

### III. Tested Time Logic

- Time-conversion and DST logic MUST live in pure functions separate from React components.
- Those functions MUST have automated tests covering: at least one DST start and one DST end,
  a zone without DST, a non-hour-offset zone, and a date crossing midnight or the date line.
- A bug in time output MUST be fixed with a regression test that reproduces it first.

Rationale: DST and time-zone errors are easy to introduce and hard to notice by hand; tests on
isolated logic are the only reliable guard for Principle I.

### IV. Accessible and Responsive by Default

- Pages MUST meet WCAG 2.2 AA: semantic HTML, labeled form controls, keyboard operability,
  visible focus, and sufficient color contrast in both light and dark themes.
- Layouts MUST work on phone-sized screens (360px wide) up to desktop.
- Information MUST NOT be conveyed by color alone.

Rationale: Many Pathway students use phones and assistive technology; an inaccessible time
answer is the same as a missing one.

### V. Simplicity and Privacy

- Prefer the smallest solution that meets the spec; new dependencies MUST be justified in the
  plan by a need the platform or existing dependencies cannot meet.
- The app MUST NOT include third-party trackers, analytics, or ads.
- Personal data (names, emails, locations) MUST NOT be collected unless a spec explicitly
  requires it, and then only the minimum needed.
- Secrets and credentials MUST NOT be committed; they belong in untracked `.env*` files.

Rationale: A small team on a course timeline benefits most from less code to maintain, and
students and teachers deserve a tool that does not track them.

## Technology and Platform Constraints

- Stack: Next.js 16 (App Router, `app/` directory), React 19, TypeScript, Tailwind CSS 4.
- This Next.js version has breaking changes from older releases. Before writing Next.js
  code, contributors and AI agents MUST consult the guides in `node_modules/next/dist/docs/`
  and heed deprecation notices (see `AGENTS.md`).
- TypeScript MUST be used for all application code; `any` MUST NOT be used without a comment
  explaining why.
- Server Components are the default; `"use client"` MUST be limited to components that need
  browser APIs or interactivity (e.g. detecting the user's time zone).
- Formatting follows the repository Prettier configuration; linting follows `eslint.config.mjs`.

## Development Workflow and Quality Gates

- Work happens on feature branches and merges to `main` through a pull request.
- Each pull request MUST be reviewed by at least one other team member before merging.
- Before requesting review, the author MUST confirm that `npm run lint` and `npm run build`
  pass, and that tests pass once a test runner is configured (Principle III).
- Larger features SHOULD follow the Spec Kit flow (`/speckit-specify` -> `/speckit-plan` ->
  `/speckit-tasks` -> `/speckit-implement`), and plans MUST include a check against this
  constitution.

## Governance

- This constitution supersedes other project conventions; where they conflict, this document
  wins.
- Amendments are proposed by pull request that edits this file, explains the change, and is
  approved by at least two team members.
- Versioning follows semantic versioning: MAJOR for removing or redefining a principle,
  MINOR for adding a principle or section or materially expanding guidance, PATCH for
  clarifications and wording fixes.
- Reviewers MUST check pull requests against the Core Principles; any intentional deviation
  MUST be justified in the pull request description.
- Runtime guidance for AI coding agents lives in `AGENTS.md`.

**Version**: 1.0.0 | **Ratified**: 2026-11-04 | **Last Amended**: 2026-11-04