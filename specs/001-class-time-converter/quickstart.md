# Quickstart: Class Time Converter

How to run and validate this feature end to end. Design details live in
[data-model.md](./data-model.md) and [contracts/](./contracts/).

## Prerequisites

- Node.js 20.9 or newer, npm
- Dependencies installed: `npm install`
- Feature dependencies added (see [plan.md](./plan.md) Technical Context):
  `temporal-polyfill` (runtime) and Vitest + React Testing Library + jsdom (dev)

## Automated checks

```bash
npm run lint      # ESLint, must pass
npm test          # Vitest, includes the 12 required cases in contracts/time-library.md
npm run build     # Must pass; fails if useSearchParams is not inside <Suspense>
```

Expected: all three commands exit with code 0.

## Manual validation

Start the app with `npm run dev` and open <http://localhost:3000>.

To simulate other locations, use browser DevTools → **More tools → Sensors → Location** (Chrome)
and set a time zone override, then reload.

| # | Device zone | Enter | Expect |
|---|-------------|-------|--------|
| 1 | Africa/Lagos | 2026-11-12, 7:00 PM, Mountain Time – Denver | Friday, November 13, 2026, 3:00 AM; "Next day" badge shown (Story 1) |
| 2 | Asia/Manila | 2026-03-05, 6:00 PM, Denver | Friday, March 6, 2026, 9:00 AM (Story 1) |
| 3 | any | First page load | Your zone pre-filled and editable (FR-002) |
| 4 | America/Denver | 2026-11-12, 7:00 PM, Denver | Same time; "no conversion needed" (Story 1) |
| 5 | Africa/Lagos | 2026-11-05, 7:00 PM, Denver | 3:00 AM + notice: Denver ended daylight saving on 1 Nov 2026; class is 1 hour later than last week (Story 2) |
| 6 | Africa/Lagos | 2026-11-12, 7:00 PM, Denver | No daylight saving notice (Story 2) |
| 7 | any | 2026-03-08, 2:30 AM, Denver | Explains the time does not exist; shows 3:30 AM (Edge Case) |
| 8 | any | 2026-11-01, 1:30 AM, Denver | Explains the time happens twice; shows both local times (Edge Case) |
| 9 | any | Search "Philippines", "Mountain Time", "Kolkata" | Matching zones appear (FR-003) |
| 10 | Africa/Lagos | Convert, then "Copy link"; open link with zone Asia/Manila | Same class pre-filled, shown in Manila time (Story 3) |
| 11 | any | Open `/?date=2026-02-30&time=19:00&tz=America%2FDenver` | Empty form + "link could not be read" message (contract rule 3) |
| 12 | any | Toggle 12h/24h | All times switch format (FR-009) |

## Accessibility and layout

- Complete rows 1 and 5 using only the keyboard; focus is always visible.
- With a screen reader, changing an input announces the new result (FR-012).
- Run Lighthouse / axe on `/`: zero critical accessibility issues (SC-005).
- Resize to 360px wide in light and dark mode: nothing overflows or is cut off.
