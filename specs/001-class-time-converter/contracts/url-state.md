# Contract: Shareable URL State

**Requirement**: FR-010 (User Story 3) | **Route**: `/` (`app/page.tsx`)

## Query parameters

| Param | Format | Example | Required |
|-------|--------|---------|----------|
| `date` | `YYYY-MM-DD` | `2026-11-12` | No |
| `time` | `HH:mm`, 24-hour | `19:00` | No |
| `tz` | IANA zone id (URL-encoded) | `America%2FDenver` | No |

Example: `/?date=2026-11-12&time=19:00&tz=America%2FDenver`

## Rules

1. The user's own time zone is **never** written to the URL; the receiver always sees the result
   in their own device zone.
2. Each parameter is validated independently. A missing parameter uses the form default
   (`tz` → `America/Denver`; `date`/`time` → empty).
3. If **any** present parameter is invalid (unknown zone, impossible date, malformed time), all
   URL values are ignored, the form is shown empty with defaults, and a short message explains
   that the link could not be read (spec Edge Case).
4. When the user edits the form, the URL is updated in place (`window.history.replaceState`, no
   new history entry and no server request) once all three values are valid.
5. Unknown extra parameters are ignored and preserved as-is.
6. No other data (names, emails, location) may be added to the URL (Principle V).
