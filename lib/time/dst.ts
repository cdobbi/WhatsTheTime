import { Temporal } from "temporal-polyfill";
import { resolveTeacherTime, toZonedTimeView } from "./resolve";
import type { DstNotice, DstTransition } from "./types";

const WINDOW_HOURS = 7 * 24;
const MINUTES_PER_DAY = 24 * 60;

/** Clock changes in `zone` during the 7 days up to and including `classInstant`. */
function recentTransitions(
  classInstant: Temporal.Instant,
  zone: string,
): DstTransition[] {
  const windowStart = classInstant.subtract({ hours: WINDOW_HOURS });
  const transitions: DstTransition[] = [];
  // "previous" is strictly before its starting point, so start 1ns later to include the class instant itself.
  let cursor = classInstant.add({ nanoseconds: 1 }).toZonedDateTimeISO(zone);
  for (;;) {
    const transition = cursor.getTimeZoneTransition("previous");
    if (!transition || Temporal.Instant.compare(transition.toInstant(), windowStart) <= 0) break;
    const before = transition.subtract({ nanoseconds: 1 });
    transitions.unshift({
      zoneId: zone,
      at: transition.toString({ timeZoneName: "never" }),
      direction: transition.offsetNanoseconds > before.offsetNanoseconds ? "forward" : "back",
    });
    cursor = transition;
  }
  return transitions;
}

function minutesOfDay(time: Temporal.PlainTime): number {
  return time.hour * 60 + time.minute;
}

/**
 * Explains a daylight saving change in either zone during the week before the class,
 * comparing the student's local time with the same teacher time one week earlier.
 */
export function findDstNotice(
  teacherInstant: Temporal.ZonedDateTime,
  teacherZone: string,
  userZone: string,
  wallClock: Temporal.PlainDateTime,
): DstNotice | null {
  const instant = teacherInstant.toInstant();
  const teacherChanges = recentTransitions(instant, teacherZone);
  const localChanges = userZone === teacherZone ? [] : recentTransitions(instant, userZone);
  if (teacherChanges.length === 0 && localChanges.length === 0) return null;

  const previousWeek = resolveTeacherTime(wallClock.subtract({ days: 7 }), teacherZone).primary;
  const previousLocal = previousWeek.withTimeZone(userZone);
  const currentLocal = teacherInstant.withTimeZone(userZone);

  let shiftMinutes =
    minutesOfDay(currentLocal.toPlainTime()) - minutesOfDay(previousLocal.toPlainTime());
  if (shiftMinutes > MINUTES_PER_DAY / 2) shiftMinutes -= MINUTES_PER_DAY;
  if (shiftMinutes <= -MINUTES_PER_DAY / 2) shiftMinutes += MINUTES_PER_DAY;

  const changedZones: DstNotice["changedZones"] = [];
  if (teacherChanges.length > 0) changedZones.push("teacher");
  if (localChanges.length > 0) changedZones.push("local");

  return {
    changedZones,
    transitions: [...teacherChanges, ...localChanges],
    previousWeekLocal: toZonedTimeView(previousLocal, userZone),
    shiftMinutes,
  };
}
