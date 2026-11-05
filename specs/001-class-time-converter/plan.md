# Implementation Plan: Class Time Converter

**Branch**: `cdobbins` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-class-time-converter/spec.md`

## Summary

Let a BYU Pathway Religion student enter a class date, time, and the teacher's time zone and
see that class in their own local time, with daylight saving changes resolved for that exact
date and called out when they shift the class. Approach: a single Next.js page whose static
shell is a Server Component, with one Client Component for the interactive converter. All
time math lives in a pure TypeScript library (`lib/time/`) built on the Temporal API via
`temporal-polyfill`, covered by Vitest tests. Class inputs are kept in the URL so a conversion
can be shared. See [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5, React 19.3, Next.js 16.4 (App Router); Node.js >= 20.9

**Primary Dependencies**: `temporal-polyfill` (new, runtime, ~20 kB); Tailwind CSS 4 (existing)

**Storage**: None. State lives in the page and in the URL query string

**Testing**: Vitest + React Testing Library (`@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`) + jsdom + `@vitejs/plugin-react` + `vite-tsconfig-paths` (new, dev)

**Target Platform**: Current evergreen browsers, including Safari/iOS (no native Temporal)

**Project Type**: Web application, single Next.js project (frontend only; no API routes)

**Performance Goals**: Result updates within 1 second of input on a typical phone (SC-004);
conversions run client-side with no network calls

**Constraints**: Must be correct for every IANA zone including DST gaps/overlaps and non-hour
offsets; WCAG 2.2 AA; usable at 360px width; no tracking or personal data

**Scale/Scope**: 1 route (`/`), ~5 components, 1 time library; ~400 time zones

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Rule | How this plan complies | Pre-design | Post-design |
|------------------|------------------------|-----------|-------------|
| I. Time Accuracy | IANA ids only; Temporal `ZonedDateTime`; per-date DST; zone shown on every time; skipped/repeated hours handled (research R1, R3) | PASS | PASS |
| II. Clarity | No account; plain-language labels ("Mountain Time – Denver"); device zone pre-filled and editable (R2, R5) | PASS | PASS |
| III. Tested Time Logic | Pure functions in `lib/time/`; Vitest added; 12 required cases incl. DST start/end, no-DST, half-hour, date line ([contracts/time-library.md](./contracts/time-library.md)) | PASS | PASS |
| IV. Accessible & Responsive | Native labeled inputs, keyboard-operable zone combobox, `aria-live` result, 360px layout, light/dark contrast; checked in [quickstart.md](./quickstart.md) | PASS | PASS |
| V. Simplicity & Privacy | One runtime dependency, justified in R1 vs. hand-written offset math; no trackers; URL carries only class data ([contracts/url-state.md](./contracts/url-state.md)) | PASS | PASS |
| Tech constraints | Next.js 16 docs consulted (`useSearchParams` needs `<Suspense>`; Vitest guide); Server Component by default, `"use client"` only for the converter | PASS | PASS |
| Workflow gates | `npm run lint`, `npm test`, `npm run build` all required before review | PASS | PASS |

No violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-class-time-converter/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── time-library.md  # Pure function contract + required test cases
│   └── url-state.md     # Shareable link query-string contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
app/
├── layout.tsx                    # existing; update metadata title/description
├── page.tsx                      # Server Component: heading + <Suspense><ClassTimeConverter/></Suspense>
└── components/
    ├── ClassTimeConverter.tsx    # "use client": form state, URL sync, device zone detection
    ├── TimeZonePicker.tsx        # searchable, accessible zone combobox
    ├── ConversionResult.tsx      # local/teacher times, day-change flag, aria-live region
    ├── DstNotice.tsx             # daylight saving explanation
    └── ShareLinkButton.tsx       # copy link + confirmation

lib/
└── time/
    ├── types.ts                  # ClassTimeInput, ConversionResult, ... (data-model.md)
    ├── convert.ts                # convertClassTime, status resolution
    ├── dst.ts                    # findDstNotice
    ├── zones.ts                  # listTimeZones, searchTimeZones, alias table
    ├── format.ts                 # formatZonedTime, detectHourCycle (12h/24h display)
    ├── share-params.ts           # parseShareParams, toShareParams
    ├── convert.test.ts
    ├── dst.test.ts
    ├── zones.test.ts
    ├── format.test.ts
    └── share-params.test.ts

vitest.config.mts                 # per Next.js 16 Vitest guide
```

**Structure Decision**: Single Next.js App Router project. UI under `app/components/`; all time
logic isolated in `lib/time/` with co-located `*.test.ts` files so it can be tested without
React (Principle III). No backend, API routes, or database are needed.

## Complexity Tracking

No constitution violations to justify.