# Data Model: Class Time Converter

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-04

All data lives in the browser for the length of a page visit. Nothing is persisted on a server
(Constitution Principle V). The only durable form is the shareable URL (see
[contracts/url-state.md](./contracts/url-state.md)).

## ClassTimeInput

What the teacher defines and the user enters (spec entity **Class Time**).

| Field | Type | Rules |
|-------|------|-------|
| `date` | ISO calendar date `YYYY-MM-DD` | Required; must be a real calendar date (FR-001, FR-013) |
| `time` | Wall-clock time `HH:mm` (24-hour, internal) | Required; `00:00`–`23:59` |
| `teacherZone` | IANA zone id, e.g. `America/Denver` | Required; must be in the supported zone list; defaults to `America/Denver` |

## TimeZoneOption

A selectable zone (spec entity **Time Zone**).

| Field | Type | Notes |
|-------|------|-------|
| `id` | IANA zone id | Source of truth; never a fixed offset (Principle I) |
| `genericName` | string | e.g. "Mountain Time" from `Intl` `longGeneric` |
| `city` | string | Derived from the id, e.g. `America/Denver` → "Denver" |
| `abbreviation` | string | Short name for the reference date, e.g. "MST" / "GMT+1" |
| `searchTerms` | string[] | `genericName`, `city`, region, and alias-table entries (FR-003) |

Label format shown to users: `"{genericName} – {city}"`, e.g. "Mountain Time – Denver".

## ConversionResult

Output of converting a `ClassTimeInput` into the user's zone (spec entity **Converted Result**).

| Field | Type | Notes |
|-------|------|-------|
| `status` | `"normal" \| "ambiguous" \| "nonexistent"` | See state rules below (FR-008) |
| `teacher` | `ZonedTimeView` | The class time as resolved in the teacher zone |
| `local` | `ZonedTimeView` | The class time in the user zone |
| `localAlternative` | `ZonedTimeView \| null` | Second possible local time; only when `status = "ambiguous"` |
| `dayOffset` | integer | Calendar-day difference between `local.date` and `teacher.date` (FR-007); usually −1, 0 or +1, but ±2 is possible between extreme offsets (e.g. UTC−11 → UTC+14) |
| `sameZone` | boolean | `true` when both zones produce identical offsets on that date (Story 1, scenario 4) |
| `dstNotice` | `DstNotice \| null` | Present only when a clock change occurred in the prior 7 days (FR-006) |

### ZonedTimeView

| Field | Type | Example |
|-------|------|---------|
| `zoneId` | IANA id | `Africa/Lagos` |
| `date` | `YYYY-MM-DD` | `2026-11-13` |
| `weekday` | 1–7 (ISO, Monday = 1) | `5` |
| `time` | `HH:mm` | `03:00` |
| `abbreviation` | string | `GMT+1` |
| `offsetMinutes` | integer | `60` |

Formatting for display (12/24-hour, locale date) happens in the UI, not in this model.

### DstNotice

| Field | Type | Notes |
|-------|------|-------|
| `changedZones` | `("teacher" \| "local")[]` | Which location(s) changed their clocks |
| `transitions` | `{ zoneId, at: ISO date-time, direction: "forward" \| "back" }[]` | When each change happened |
| `previousWeekLocal` | `ZonedTimeView` | Same teacher time, 7 days earlier, in the user's zone |
| `shiftMinutes` | integer | `local` minus `previousWeekLocal` wall-clock difference, e.g. `+60` |

## State rules

```text
ClassTimeInput (valid)
   │ resolve wall-clock in teacherZone (earlier / later / compatible)
   ├── earlier == later ───────────────────────────────► status = normal
   ├── earlier != later, compatible keeps wall-clock ──► status = ambiguous (local + localAlternative)
   └── earlier != later, compatible moved wall-clock ──► status = nonexistent (teacher time shifted forward)
```

`dstNotice` is evaluated after resolution for every status. Invalid input yields **no**
`ConversionResult`; field-level errors are returned instead (FR-013).
