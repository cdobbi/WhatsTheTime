# Whats the Time

Whats the Time helps BYU Pathway religion teachers and students understand class times across time zones and daylight saving time changes.

Enter the class date and time in your teacher's time zone (Mountain Time – Denver by default), and the app shows when that class happens where you live. It detects your time zone automatically, warns you when a daylight saving change in either location moved the class since last week, explains times that are skipped or repeated on the day clocks change, and lets you copy a link that shows the same class in each classmate's own local time. Everything runs in your browser; no account, tracking, or personal data is involved.

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Run the checks that every pull request must pass:

```bash
npm run lint
npm test
npm run build
```

Time-zone and daylight saving logic lives in `lib/time/` with its tests next to it. The feature's spec, plan, and manual test guide are in `specs/001-class-time-converter/`.
