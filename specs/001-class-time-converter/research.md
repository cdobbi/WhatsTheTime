# Research: Class Time Converter

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-04

## R1. Date/time engine for time-zone and daylight saving math

- **Decision**: Use the `Temporal` API through the `temporal-polyfill` package, imported
  explicitly (`import { Temporal } from "temporal-polyfill"`) in `lib/time/`.
- **Rationale**: Temporal models exactly what the spec needs: a wall-clock date-time in a
  named IANA zone (`ZonedDateTime`), explicit handling of nonexistent and repeated times
  (`disambiguation: "earlier" | "later"`), and zone transition lookup
  (`getTimeZoneTransition("previous")`). As of October 2026 it is native in Chrome/Edge 144+,
  Firefox 139+ and Node 26, but **not** in shipping Safari/iOS (MDN, Oct 2026) and not in the
  project's Node 22 (verified: `typeof Temporal === "undefined"`). `temporal-polyfill` is listed
  as the stable polyfill by the TC39 proposal repo and costs about 20 kB. Importing it explicitly
  (instead of only when missing) gives identical behavior in every browser and in tests.
- **Alternatives considered**:
  - Plain `Date` + `Intl.DateTimeFormat`: no way to construct a date-time *in* a zone; would
    require hand-written offset searching for DST gaps/overlaps — the most error-prone option
    and a direct risk to Constitution Principle I.
  - Luxon / `date-fns` + `@date-fns/tz`: workable, but ambiguous-time handling is less
    explicit and they are replaced by Temporal long-term.
  - Native Temporal only: excludes Safari and iOS, which many Pathway students use.

## R2. Time-zone data and friendly names

- **Decision**: Build the zone list from `Intl.supportedValuesOf("timeZone")` at runtime and
  label each zone with `Intl.DateTimeFormat(..., { timeZoneName: "longGeneric" })` plus its city
  (from the IANA id) and current short abbreviation. Add a small hand-maintained alias table for
  common search terms ("Mountain Time", "Philippines", "Nigeria", "India", etc.).
- **Rationale**: No zone database is shipped by the app; the browser's IANA data is kept current
  by browser updates (spec assumption). `longGeneric` produces "Mountain Time" style names, which
  satisfies Principle II's plain-language rule. Verified in Node 22: 417 zones and
  `"Mountain Time"` for `America/Denver`.
- **Alternatives considered**: Shipping a static zone list (goes stale, adds weight); a third-party
  zone picker component (extra dependency, accessibility not guaranteed).

## R3. Nonexistent and repeated (ambiguous) times

- **Decision**: Resolve the teacher's wall-clock time with both `disambiguation: "earlier"` and
  `"later"`.
  - Both results have the same instant → **normal** time.
  - Instants differ and both results keep the entered wall-clock time → **ambiguous** (repeated
    hour); show both local times.
  - Instants differ and the `"compatible"` result's wall-clock time differs from what was entered
    → **nonexistent** (skipped hour); show the time pushed forward by the gap (Temporal's
    `"compatible"` behavior) and explain.
- **Rationale**: Uses only standard Temporal behavior; no manual offset math; deterministic
  and unit-testable.
- **Alternatives considered**: `disambiguation: "reject"` with try/catch — throws for both cases
  and cannot tell them apart.

## R4. Daylight saving notice (FR-006, User Story 2)

- **Decision**: For the resolved class instant `T`, call
  `getTimeZoneTransition("previous")` on the teacher zone and the user zone. A transition that
  falls within `(T − 7 days, T]` triggers a notice. The shift shown to the user is computed by
  converting the same teacher wall-clock time on the date 7 days earlier and comparing local
  times.
- **Rationale**: Matches the weekly-class mental model ("this week class is an hour later than
  last week"), names which location changed, and handles the case where the two locations
  change on different dates.
- **Alternatives considered**: Only checking whether the date is "in DST" — does not tell the
  student that anything *changed*, which is the actual cause of missed classes.

## R5. User time zone detection and 12/24-hour default

- **Decision**: In a Client Component, read `Intl.DateTimeFormat().resolvedOptions().timeZone`
  and `.hourCycle` after mount. If the zone is missing or not in the supported list, leave the
  field empty and prompt the user to choose (Edge Case).
- **Rationale**: Device time zone is only known in the browser; reading it after mount avoids
  server/client hydration mismatches. No data leaves the device (Principle V).

## R6. Shareable link and Next.js 16 URL state

- **Decision**: Keep the class inputs in the URL query string: `?date=YYYY-MM-DD&time=HH:mm&tz=<IANA id>`.
  The converter Client Component reads them once with `useSearchParams` and updates them with
  `window.history.replaceState` (no history spam, no server round trip; the Next.js 16 docs in
  `01-app/01-getting-started/04-linking-and-navigating.md` confirm it syncs with
  `useSearchParams`). The component is wrapped in `<Suspense>` in `app/page.tsx`.
- **Rationale**: Per the bundled Next.js 16 docs
  (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`),
  a prerendered page calling `useSearchParams` from a Client Component **must** be wrapped in a
  `Suspense` boundary or the production build fails. This lets the page shell stay static.
  The user's own zone is deliberately excluded from the URL (FR-010).
- **Alternatives considered**: Reading the `searchParams` page prop in a Server Component makes
  the whole route dynamic for no benefit; local storage cannot be shared.

## R7. Testing

- **Decision**: Add Vitest with React Testing Library and jsdom, following the bundled guide
  `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`. Add an `npm test` script.
  Time logic tests run in the Node environment with fixed IANA zones and explicit dates (never
  "now").
- **Rationale**: Constitution Principle III requires automated tests for time logic; Vitest is
  the officially documented option for this Next.js version and runs TypeScript without extra
  config.
- **Alternatives considered**: Jest (more configuration for ESM/TypeScript); Playwright E2E only
  (too slow and coarse for 20+ conversion cases).
