# Contract: Time Library (`lib/time/`)

Pure, framework-free TypeScript functions. No React, no DOM, no reading of "now" or the device
zone (callers pass everything in), so every function is deterministic and unit-testable
(Constitution Principle III). Types refer to [data-model.md](../data-model.md).

## `convertClassTime(input, userZone) → ConvertOutcome`

```ts
type ConvertOutcome =
  | { ok: true; result: ConversionResult }
  | { ok: false; errors: Partial<Record<"date" | "time" | "teacherZone" | "userZone", string>> };
```

- Validates `input` and `userZone`; errors are plain-language strings for display (FR-013).
- Resolves `status` per the state rules in the data model (FR-008).
- Sets `dayOffset`, `sameZone`, and `dstNotice` (FR-005, FR-006, FR-007).

## `findDstNotice(teacherInstant, teacherZone, userZone, wallClock) → DstNotice | null`

- Looks for clock changes in either zone in `(instant − 7 days, instant]`.
- Computes `previousWeekLocal` and `shiftMinutes` by converting the same teacher wall-clock on the
  date 7 days earlier.

## `listTimeZones(referenceDate, locale) → TimeZoneOption[]`

- Built from the runtime's supported IANA ids; sorted by `genericName`, then `city`.

## `searchTimeZones(options, query) → TimeZoneOption[]`

- Case- and accent-insensitive match on `searchTerms`; exact city/alias matches ranked first
  (FR-003).

## `formatZonedTime(view, { locale, hourCycle }) → { dateText, timeText, zoneText }`

- Formats a `ZonedTimeView` for display using the given locale; `hourCycle` is `"h12"` or
  `"h23"` (FR-004, FR-009). Example: Lagos 2026-11-13 03:00, `en-US`, `h12` →
  "Friday, November 13, 2026", "3:00 AM".

## `detectHourCycle(locale) → "h12" | "h23"`

- Default for the 12/24-hour toggle, read from `Intl.DateTimeFormat` for the locale (FR-009).

## `parseShareParams(params) → { values: Partial<ClassTimeInput>; invalid: boolean }`

## `toShareParams(input) → URLSearchParams`

- Implement [url-state.md](./url-state.md).

## Required test cases (minimum, per Principle III and SC-002)

| # | Teacher | User | Input | Expected local |
|---|---------|------|-------|----------------|
| 1 | America/Denver | Africa/Lagos | 2026-11-12 19:00 | 2026-11-13 03:00, dayOffset +1 |
| 2 | America/Denver | Asia/Manila | 2026-03-05 18:00 | 2026-03-06 09:00 |
| 3 | America/Denver | Africa/Lagos | 2026-10-29 19:00 | 2026-10-30 02:00 |
| 4 | America/Denver | Africa/Lagos | 2026-11-05 19:00 | 2026-11-06 03:00, notice: teacher, +60 |
| 5 | America/Denver | any | 2026-03-08 02:30 | status nonexistent, teacher 03:30 |
| 6 | America/Denver | any | 2026-11-01 01:30 | status ambiguous, two local times |
| 7 | America/Denver | Asia/Kolkata | 2026-11-12 19:00 | 2026-11-13 07:30 |
| 8 | America/Denver | Asia/Kathmandu | 2026-11-12 19:00 | 2026-11-13 07:45 |
| 9 | America/Denver | America/Phoenix | 2026-07-01 19:00 | 18:00 (Phoenix has no DST) |
| 10 | America/Denver | Europe/London | 2026-10-29 19:00 | 2026-10-30 01:00, notice: local only (UK changed 2026-10-25) |
| 11 | America/Denver | America/Denver | 2026-11-12 19:00 | 19:00, sameZone true |
| 12 | America/Denver | Pacific/Auckland | 2026-11-12 19:00 | 2026-11-13 15:00, dayOffset +1 |
