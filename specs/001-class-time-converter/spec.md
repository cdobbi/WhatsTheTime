# Feature Specification: Class Time Converter

**Feature Branch**: `cdobbins`

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "Let a student pick a BYU Pathway Religion class time in the teacher's time zone and see it in their own local time, including any daylight saving change for that date."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Convert a class time for a specific date (Priority: P1)

A student knows their Religion class meets at a given time in the teacher's time zone (for
example, "Thursday 7:00 PM, Mountain Time"). They open Little Time Machine, enter the class
date, the class time, and the teacher's time zone, and immediately see what time and date that
is where they live. The answer clearly names both time zones.

**Why this priority**: This is the core problem the app exists to solve. Without it there is
no product; with only this story, a student can already avoid missing class.

**Independent Test**: Enter a date, a time, and a teacher time zone different from the
student's own; confirm the displayed local time and date match an independent reference
(e.g. a published world-clock table) for that date.

**Acceptance Scenarios**:

1. **Given** a student whose device is set to Lagos (UTC+1, no daylight saving), **When** they
   enter 2026-11-12, 7:00 PM, teacher zone "Mountain Time (Denver)", **Then** they see
   "Friday, 13 November 2026, 3:00 AM (Lagos time)".
2. **Given** a student in Manila, **When** they enter 2026-03-05, 6:00 PM, teacher zone
   "Mountain Time (Denver)", **Then** they see "Friday, 6 March 2026, 9:00 AM (Manila time)",
   and the change of day is called out.
3. **Given** a student opens the app for the first time, **When** the page loads, **Then**
   their local time zone is already filled in from their device, and they can change it.
4. **Given** the student and teacher are in the same time zone, **When** they convert,
   **Then** the result shows the same time and states that no conversion was needed.

---

### User Story 2 - Notice daylight saving changes (Priority: P2)

A student's class meets every week at the same time for the teacher. When the teacher's or
the student's location switches to or from daylight saving time, the class shifts by an hour
for the student. The student enters their class date and sees a clear notice when daylight
saving affects the result, including what the time was or will be before/after the change.

**Why this priority**: Daylight saving shifts are the most common reason Pathway students
miss class, and they are the main thing a generic clock does not explain well.

**Independent Test**: Convert the same weekly class time for a date just before and just
after a daylight saving change in the teacher's zone; confirm the local times differ by one
hour and a notice explains why.

**Acceptance Scenarios**:

1. **Given** a weekly class at 7:00 PM Mountain Time and a student in Lagos, **When** the
   student converts 2026-10-29 and then 2026-11-05 (the US change is 2026-11-01), **Then**
   the local result is 2:00 AM and 3:00 AM respectively, and the second result shows a notice
   that the class is one hour later than the previous week because the teacher's location
   ended daylight saving time on 1 November 2026.
2. **Given** a student whose own location changes daylight saving on a different date than
   the teacher's, **When** they convert a date between the two change dates, **Then** the
   notice names which location changed.
3. **Given** a date with no daylight saving change in the surrounding week for either
   location, **When** the student converts, **Then** no daylight saving notice is shown.

---

### User Story 3 - Share a class time with others (Priority: P3)

A teacher or student wants to send classmates the converted time. They copy a link from the
result; anyone opening that link sees the same class date, time, and teacher time zone,
converted to *their own* local time.

**Why this priority**: Helpful for teachers announcing class times to a whole section, but
students can still use the app without it.

**Independent Test**: Create a link from a conversion, open it on a device set to a different
time zone, and confirm the class details are pre-filled and the result is shown in that
device's local time.

**Acceptance Scenarios**:

1. **Given** a completed conversion, **When** the user chooses "Copy link", **Then** a link
   is copied and a confirmation is shown.
2. **Given** a shared link, **When** someone in another time zone opens it, **Then** they see
   the class converted to their own local time without entering anything.

---

### Edge Cases

- The class time falls in the teacher's "skipped" hour on the day daylight saving starts
  (e.g. 2:30 AM): the app explains the time does not exist that day and shows the time
  moved forward by the skipped hour (e.g. 2:30 AM → 3:30 AM).
- The class time falls in the teacher's "repeated" hour on the day daylight saving ends: the
  app states the time is ambiguous and shows both possible local times.
- The conversion moves the class to the previous or next calendar day for the student: the
  result highlights the different day.
- Locations with half-hour or 45-minute offsets (e.g. India, Nepal) and locations with no
  daylight saving (e.g. Arizona, Philippines, Nigeria) convert correctly.
- The device's time zone cannot be detected: the student is asked to choose their time zone.
- Required fields are missing or the date is invalid: the app explains what to fix next to
  the field and does not show a result.
- A shared link contains invalid or tampered values: the app ignores the bad values and shows
  an empty form with a short explanation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to enter a class date, a class time, and the teacher's time
  zone.
- **FR-002**: The system MUST pre-select the user's own time zone from their device and MUST
  let the user change it.
- **FR-003**: Users MUST be able to find a time zone by searching a city, country, or common
  name (e.g. "Mountain Time", "Denver", "Philippines").
- **FR-004**: The system MUST show the converted local date, weekday, and time, labeled with
  the user's time-zone name, alongside the original teacher time labeled with its zone.
- **FR-005**: The system MUST apply the daylight saving rules in effect on the selected date
  for both the teacher's and the user's locations.
- **FR-006**: The system MUST show a daylight saving notice when either location changed its
  clock during the 7 days leading up to the class time (up to and including the class time
  itself), stating which location changed, on what date, and how the class time shifted for
  the user.
- **FR-007**: The system MUST visibly indicate when the converted date is a different
  calendar day than the teacher's date.
- **FR-008**: The system MUST handle nonexistent and repeated times on daylight saving change
  days as described in Edge Cases.
- **FR-009**: Users MUST be able to switch between 12-hour and 24-hour time display; the
  default follows the user's device setting.
- **FR-010**: Users MUST be able to copy a link that reproduces the class date, time, and
  teacher time zone (but not the user's own time zone).
- **FR-011**: The conversion MUST work without creating an account or signing in, and the
  system MUST NOT collect personal data or use third-party tracking.
- **FR-012**: All controls MUST be usable by keyboard and screen reader, and results MUST be
  announced to assistive technology when they change.
- **FR-013**: Validation errors MUST be shown in plain language next to the affected field.

### Key Entities

- **Class Time**: A single class meeting as the teacher defines it: a calendar date, a
  wall-clock time, and the teacher's time zone.
- **Time Zone**: A named location-based zone (e.g. "Mountain Time – Denver") with its own
  daylight saving rules; shown to users by a friendly name, city, and abbreviation.
- **Converted Result**: The class time expressed in the user's time zone: local date,
  weekday, time, zone label, a day-change flag, and an optional daylight saving notice.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can enter a class time and read the converted local time in
  under 30 seconds.
- **SC-002**: 100% of conversions in a reference test set (at least 12 cases covering daylight
  saving start/end, no-DST zones, half-hour zones, and day changes) match an authoritative
  world-clock source.
- **SC-003**: In hallway testing with at least 5 students or teachers, at least 90% correctly
  state what local time they should attend class on the first try.
- **SC-004**: The converted result appears within 1 second of the last input change on a
  typical phone connection.
- **SC-005**: The page passes an accessibility audit at WCAG 2.2 AA with zero critical issues
  and is fully usable on a 360px-wide screen.

## Assumptions

- Users enter the class time themselves; the app does not include a built-in catalog of BYU
  Pathway class schedules in this feature.
- One class meeting date is converted at a time; recurring schedules are handled by the
  user entering another date (User Story 2 compares neighboring weeks automatically).
- The teacher's time zone defaults to "Mountain Time – Denver" because BYU Pathway is
  headquartered there, but any time zone can be selected.
- English is the only interface language for this feature; dates are formatted for the
  user's device locale. Result text in the acceptance scenarios (e.g. "Friday, 13 November
  2026, 3:00 AM (Lagos time)") is illustrative: the date, time, and time-zone values must
  match, but exact wording and order follow the device's language and region settings.
- Time-zone and daylight saving rules come from the standard world time-zone database
  available on the user's device or from the app, kept reasonably current.
- No user data is stored on a server; shared links carry only the class date, time, and
  teacher zone.
