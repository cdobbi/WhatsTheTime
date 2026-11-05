---
description: "Task list for the Class Time Converter feature"
---

# Tasks: Class Time Converter

**Input**: Design documents from `specs/001-class-time-converter/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. Constitution Principle III requires automated tests for all time logic,
and [contracts/time-library.md](./contracts/time-library.md) lists 12 required cases. Write each
test task first and confirm it fails before implementing.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested
on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1, US2, US3)

## Path Conventions

Single Next.js App Router project at the repository root: UI in `app/` and `app/components/`,
time logic in `lib/time/` with co-located `*.test.ts` files. Before writing Next.js code, read
the relevant guide in `node_modules/next/dist/docs/` (see `AGENTS.md`).

## Global conventions for every task

- Use `import { Temporal } from "temporal-polyfill"` for all date/time math; never use `Date`
  arithmetic or fixed UTC offsets (Principle I, research R1).
- Functions in `lib/time/` MUST NOT read the current time or the device zone; callers pass
  everything in (contracts/time-library.md).
- Tests use explicit dates from the contract table; never "now".
- Follow `.prettierrc` and `eslint.config.mjs`; no `any` without an explaining comment.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies, test runner, and a clean starting page

- [X] T001 Add runtime dependency with `npm install temporal-polyfill` (updates `package.json` and `package-lock.json`)
- [X] T002 Add dev dependencies with `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event vite-tsconfig-paths`, and add scripts `"test": "vitest run"` and `"test:watch": "vitest"` to `package.json`
- [X] T003 Create `vitest.config.mts` per `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` (plugins `tsconfigPaths()` and `react()`, `test.environment: "jsdom"`, `test.include: ["lib/**/*.test.ts", "app/**/*.test.tsx"]`); confirm `npm test` runs with "no test files found" and exits cleanly (add `passWithNoTests: true`)
- [X] T004 [P] Update `metadata` in `app/layout.tsx` to title "Little Time Machine" and description "See your BYU Pathway Religion class time in your own time zone, including daylight saving changes."
- [X] T005 [P] Replace the Create Next App starter markup in `app/page.tsx` with a Server Component containing an `<h1>` "Little Time Machine", a one-sentence plain-language intro, and an empty `<main>` region; remove the unused `next/image` import and starter links

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and the time-zone list used by every story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create `lib/time/types.ts` exporting the types from `data-model.md`: `ClassTimeInput` (`date` "ISO calendar date `YYYY-MM-DD`" — "Required; must be a real calendar date"; `time` "Wall-clock time `HH:mm` (24-hour, internal)" — "Required; `00:00`–`23:59`"; `teacherZone` "IANA zone id" — "Required; must be in the supported zone list; defaults to `America/Denver`"), `TimeZoneOption`, `ZonedTimeView` (`weekday` "1–7 (ISO, Monday = 1)"), `DstNotice` (`direction: "forward" | "back"`), `ConversionResult` (`status: "normal" | "ambiguous" | "nonexistent"`, `dayOffset: -1 | 0 | 1`, `localAlternative` "only when `status = \"ambiguous\"`"), `ConvertOutcome`, and `DEFAULT_TEACHER_ZONE = "America/Denver"`
- [X] T007 [P] Write failing tests in `lib/time/zones.test.ts`: `listTimeZones(Temporal.PlainDate.from("2026-11-12"), "en")` includes `America/Denver` labeled "Mountain Time – Denver" with abbreviation "MST"; list is sorted by `genericName` then `city`; `searchTimeZones` finds `America/Denver` for "mountain time" and "denver", `Asia/Manila` for "Philippines", `Africa/Lagos` for "nigeria", `Asia/Kolkata` for "India", is case- and accent-insensitive ("SÃO PAULO" → `America/Sao_Paulo`), and ranks exact city/alias matches first; `isSupportedZone("Not/AZone")` is false
- [X] T008 Implement `lib/time/zones.ts` per research R2: `listTimeZones(referenceDate, locale)` from `Intl.supportedValuesOf("timeZone")`, `genericName` via `Intl.DateTimeFormat(locale, { timeZone, timeZoneName: "longGeneric" })`, `city` from the last id segment with `_` → space, `abbreviation` via `timeZoneName: "short"` at noon on `referenceDate`, `searchTerms` = genericName + city + region + a hand-maintained alias table (country names and "Mountain/Central/Eastern/Pacific Time" at minimum); `searchTimeZones(options, query)` normalizing with `toLowerCase()` and `normalize("NFD")` diacritic stripping; `isSupportedZone(id)`; `formatZoneLabel(option)` returning `"{genericName} – {city}"`. Make T007 pass.

**Checkpoint**: `npm test` passes for zones; user stories can begin

---

## Phase 3: User Story 1 - Convert a class time for a specific date (Priority: P1) 🎯 MVP

**Goal**: A student enters date, time, and teacher zone and sees the class in their own local
time, with both zones named, day changes highlighted, and skipped/repeated hours explained.

**Independent Test**: Quickstart rows 1–4, 7, 8, 9, 12 pass; contract cases 1, 2, 5–9, 11, 12
pass in `npm test`.

### Tests for User Story 1 ⚠️ (write first, confirm they fail)

- [X] T009 [P] [US1] Write failing tests in `lib/time/convert.test.ts` for contract cases 1, 2, 5, 6, 7, 8, 9, 11, 12 from `contracts/time-library.md` (exact expected local date/time, `dayOffset`, `status`, `sameZone`); case 5 expects `status: "nonexistent"` with teacher time `03:30`; case 6 expects `status: "ambiguous"` with `local` = earlier and `localAlternative` = later instant one hour apart; plus validation cases returning `{ ok: false }` with plain-language messages for `date: "2026-02-30"`, `time: "25:00"`, `teacherZone: "Not/AZone"`, and empty fields; assert `dstNotice` is `null` for case 1
- [X] T010 [P] [US1] Write failing tests in `lib/time/format.test.ts` for `formatZonedTime(view, { locale: "en-US", hourCycle })`: `ZonedTimeView` for Lagos 2026-11-13 03:00 renders "Friday, November 13, 2026" and "3:00 AM" with `h12` and "03:00" with `h23`, and includes the zone label

### Implementation for User Story 1

- [X] T011 [US1] Implement `convertClassTime(input, userZone)` in `lib/time/convert.ts` per `contracts/time-library.md` and research R3: validate fields (errors keyed `date | time | teacherZone | userZone`); build `Temporal.PlainDateTime`; resolve with `disambiguation` `"earlier"`, `"later"`, `"compatible"`; set `status` per the data-model state rules; build `ZonedTimeView`s via `withTimeZone(userZone)`; compute `dayOffset` from `PlainDate.compare` of local vs teacher date; `sameZone` when both offsets are equal; set `dstNotice: null` (wired in US2). Make T009 pass.
- [X] T012 [P] [US1] Implement `lib/time/format.ts` with `formatZonedTime(view, { locale, hourCycle })` returning `{ dateText, timeText, zoneText }` using `Temporal.PlainDateTime#toLocaleString` / `Intl.DateTimeFormat` with `timeZone: view.zoneId`, and `detectHourCycle(locale)` returning `"h12" | "h23"` from `Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle`. Make T010 pass.
- [X] T013 [P] [US1] Create `app/components/TimeZonePicker.tsx` (`"use client"`): accessible combobox per WAI-ARIA APG (labeled `<input role="combobox">`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, listbox of up to 50 `searchTimeZones` results, Arrow/Enter/Escape keys), props `{ id, label, value, options, onChange, error? }`, shows `formatZoneLabel` for the selected zone and renders `error` text linked via `aria-describedby`
- [X] T014 [US1] Create `app/components/ConversionResult.tsx`: renders the local time large (date, weekday, time, zone via `formatZonedTime`) and the teacher time smaller; a visible "Next day" / "Previous day" badge when `dayOffset !== 0` (text, not color only); "Same time as the teacher — no conversion needed" when `sameZone`; for `nonexistent` explain "2:30 AM doesn't exist in {teacher zone} on that date because clocks moved forward; showing 3:30 AM"; for `ambiguous` show both local times labeled "first" and "second" occurrence; wrapped in a region with `aria-live="polite"`
- [X] T015 [US1] Create `app/components/ClassTimeConverter.tsx` (`"use client"`): labeled `<input type="date">`, `<input type="time">`, teacher `TimeZonePicker` defaulting to `DEFAULT_TEACHER_ZONE`, user `TimeZonePicker` filled after mount from `Intl.DateTimeFormat().resolvedOptions().timeZone` (left empty with prompt "Choose your time zone" if unsupported, research R5), a 12h/24h toggle (radio group) defaulting to `detectHourCycle`, calls `convertClassTime` on every change, shows field errors next to each field (FR-013), renders `ConversionResult`; build zone options once with `useMemo(() => listTimeZones(today, navigator.language))`; layout single-column at 360px, two columns from `sm:`; dark-mode classes on all elements
- [X] T016 [US1] Render `<Suspense fallback={...}><ClassTimeConverter /></Suspense>` inside `<main>` in `app/page.tsx` (fallback: a static "Loading converter…" paragraph); keep `page.tsx` a Server Component
- [X] T017 [US1] Write `app/components/ClassTimeConverter.test.tsx` with React Testing Library: stub `Intl.DateTimeFormat.prototype.resolvedOptions` to return `timeZone: "Africa/Lagos"`; mock `next/navigation` (`useSearchParams`, `useRouter`); enter 2026-11-12 and 19:00 and assert "3:00 AM", "November 13, 2026", and the "Next day" badge are shown; assert the date field error appears for an empty date

**Checkpoint**: User Story 1 works on its own — this is the MVP

---

## Phase 4: User Story 2 - Notice daylight saving changes (Priority: P2)

**Goal**: When either location changed its clocks in the 7 days before the class, explain which
location changed, when, and how the class moved for the student.

**Independent Test**: Quickstart rows 5 and 6 pass; contract cases 3, 4, 10 pass in `npm test`.

### Tests for User Story 2 ⚠️ (write first, confirm they fail)

- [X] T018 [P] [US2] Write failing tests in `lib/time/dst.test.ts` for `findDstNotice`: case 4 (Denver → Lagos, 2026-11-05 19:00) returns `changedZones: ["teacher"]`, one transition `America/Denver` at 2026-11-01 with `direction: "back"`, `previousWeekLocal` 2026-10-30 02:00, `shiftMinutes: 60`; case 3 (2026-10-29) returns `null`; case 10 (Denver → `Europe/London`, 2026-10-29 19:00) returns `changedZones: ["local"]` with transition on 2026-10-25; 2026-11-12 19:00 Denver → Lagos returns `null`; a Denver → London date where both changed in the window lists both zones

### Implementation for User Story 2

- [X] T019 [US2] Implement `findDstNotice(teacherInstant, teacherZone, userZone, wallClock)` in `lib/time/dst.ts` per research R4: for each zone call `ZonedDateTime#getTimeZoneTransition("previous")` from the class instant and keep transitions in `(instant − 7 days, instant]`; `direction` = `"forward"` if the offset increased; compute `previousWeekLocal` by converting the same teacher wall-clock on `date − 7 days`; `shiftMinutes` = difference between local and previous-week local wall-clock times-of-day (handle day wrap). Make T018 pass.
- [X] T020 [US2] In `lib/time/convert.ts`, set `dstNotice` from `findDstNotice` for every successful conversion; extend `lib/time/convert.test.ts` with contract case 4 asserting `result.dstNotice.shiftMinutes === 60`
- [X] T021 [P] [US2] Create `app/components/DstNotice.tsx`: plain-language notice with an icon and heading (not color-only), e.g. "Heads up: this class is 1 hour later for you than last week. Denver ended daylight saving time on Sunday, November 1, 2026." Name each changed location; show last week's local time; use `role="note"`
- [X] T022 [US2] Render `DstNotice` from `app/components/ConversionResult.tsx` when `result.dstNotice` is non-null, and extend `app/components/ClassTimeConverter.test.tsx` with Lagos + 2026-11-05 19:00 asserting the notice text mentions "1 hour later" and "Denver"

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Share a class time with others (Priority: P3)

**Goal**: Copy a link that reproduces the class date, time, and teacher zone; anyone opening it
sees the class in their own local time.

**Independent Test**: Quickstart rows 10 and 11 pass; `lib/time/share-params.test.ts` passes.

### Tests for User Story 3 ⚠️ (write first, confirm they fail)

- [X] T023 [P] [US3] Write failing tests in `lib/time/share-params.test.ts` covering every rule in `contracts/url-state.md`: round-trip `toShareParams` → `parseShareParams` for 2026-11-12 / 19:00 / `America/Denver`; output never contains a user-zone key; missing params yield partial values with `invalid: false`; `date=2026-02-30`, `time=7pm`, or `tz=Not/AZone` each yield `values: {}` and `invalid: true`; unknown extra params are ignored

### Implementation for User Story 3

- [X] T024 [US3] Implement `parseShareParams(params)` and `toShareParams(input)` in `lib/time/share-params.ts` using query keys `date`, `time`, `tz` and `isSupportedZone` from `lib/time/zones.ts`. Make T023 pass.
- [X] T025 [US3] Create `app/components/ShareLinkButton.tsx` (`"use client"`): button "Copy link" that writes `window.location.origin + "/?" + toShareParams(input)` with `navigator.clipboard.writeText`, then shows "Link copied" in an `aria-live="polite"` element for 3 seconds; if the clipboard API fails, show the link in a read-only, auto-selected text field instead
- [X] T026 [US3] In `app/components/ClassTimeConverter.tsx`: initialize date/time/teacher zone from `useSearchParams()` via `parseShareParams` (show "This link couldn't be read, so we started a new conversion." when `invalid`); when all three inputs are valid, call `window.history.replaceState(null, "", "?" + params)` preserving unknown params (contract rules 4–5; replaces the original `router.replace` plan to avoid a server round trip); render `ShareLinkButton` under the result; extend `app/components/ClassTimeConverter.test.tsx` with a mocked search string `date=2026-11-12&time=19:00&tz=America%2FDenver` asserting the form is pre-filled and the result shows

**Checkpoint**: All user stories work independently

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, accessibility, and the constitution's quality gates

- [X] T027 [P] Update `README.md`: one-paragraph description of the converter, and add `npm test` to Getting Started
- [X] T028 Accessibility and layout pass on `app/components/*.tsx` and `app/globals.css`: visible focus styles, WCAG AA contrast in light and dark mode, no horizontal scroll at 360px, every input has a `<label>` (quickstart "Accessibility and layout")
- [X] T029 Run `npm run lint`, `npm test`, and `npm run build`; fix every failure (the build fails if `useSearchParams` is not inside `<Suspense>`)
- [X] T030 Walk through every row of `specs/001-class-time-converter/quickstart.md` in the browser with DevTools time-zone overrides; also confirm in the DevTools Network tab that no requests go to third-party domains (FR-011) and that the result updates immediately after each input change (SC-004); record any failures as new tasks in this file
- [ ] T031 Run a hallway test (SC-003) with at least 5 BYU Pathway students or teachers: ask each to find their local class time for quickstart rows 1 and 5 without help; record how many answered correctly on the first try in `specs/001-class-time-converter/checklists/hallway-test.md` (target: at least 90%)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on T001–T003 — blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2
- **User Story 2 (Phase 4)**: Depends on Phase 2 and on T011 (`convert.ts`) and T014 (`ConversionResult.tsx`) existing, because it plugs into them
- **User Story 3 (Phase 5)**: Depends on Phase 2 and on T015 (`ClassTimeConverter.tsx`); `share-params.ts` (T023–T024) only needs Phase 2
- **Polish (Phase 6)**: Depends on all desired stories

### Within Each User Story

- Tests are written and fail before implementation
- `lib/time/` logic before components; components before `ClassTimeConverter.tsx` wiring
- Story is complete at its checkpoint before moving on

### Task-level dependencies

- T008 ← T006, T007
- T011 ← T006, T008, T009 · T012 ← T006, T010 · T014 ← T012
- T015 ← T011, T012, T013, T014 · T016 ← T015 · T017 ← T016
- T019 ← T018 · T020 ← T019 · T022 ← T020, T021
- T024 ← T023 · T025 ← T024 · T026 ← T024, T025, T015
- T029 ← all implementation tasks · T030 ← T029 · T031 ← T030

### Parallel Opportunities

- Phase 1: T004 and T005 alongside T001–T003
- Phase 2: T007 alongside T006
- US1: T009 + T010 together; then T011 + T012 + T013 together; T014 once T012 is done
- US2: T018 and T021 together
- US3: T023–T024 can start right after Phase 2, in parallel with US1; T025 once T024 is done
- Polish: T027 alongside T028

---

## Parallel Example: User Story 1

```text
# Tests first, together:
T009 lib/time/convert.test.ts
T010 lib/time/format.test.ts

# Then, together (different files):
T011 lib/time/convert.ts
T012 lib/time/format.ts
T013 app/components/TimeZonePicker.tsx

# After T012:
T014 app/components/ConversionResult.tsx

# Then sequentially:
T015 app/components/ClassTimeConverter.tsx → T016 app/page.tsx → T017 component test
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup → Phase 2 Foundational
2. Phase 3 (US1) → **stop and validate** with quickstart rows 1–4, 7–9, 12 and `npm test`
3. Demo: a student can already convert a class time correctly

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. + US1 → MVP demo
3. + US2 → daylight saving notices
4. + US3 → shareable links
5. Polish → lint/test/build green, quickstart walk-through

### Parallel Team Strategy (3 team members)

After Phase 2:

- Member A: US1 time logic (T009, T011, T010, T012)
- Member B: US1 UI (T013, T014), then T015–T017
- Member C: US3 logic (T023, T024), then US2 logic (T018, T019) once T011 lands

---

## Notes

- [P] = different files, no dependency on incomplete tasks
- Commit after each task or logical group; each PR must pass `npm run lint`, `npm test`, `npm run build` (constitution workflow gates)
- Total: 31 tasks — Setup 5, Foundational 3, US1 9, US2 5, US3 4, Polish 5
