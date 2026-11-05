import { Temporal } from "temporal-polyfill";
import type { ConversionStatus, ZonedTimeView } from "./types";

function shortZoneName(zdt: Temporal.ZonedDateTime): string {
  return (
    new Intl.DateTimeFormat("en", { timeZone: zdt.timeZoneId, timeZoneName: "short" })
      .formatToParts(zdt.epochMilliseconds)
      .find((part) => part.type === "timeZoneName")?.value ?? zdt.offset
  );
}

export function toZonedTimeView(zdt: Temporal.ZonedDateTime, zoneId: string): ZonedTimeView {
  return {
    zoneId,
    date: zdt.toPlainDate().toString(),
    weekday: zdt.dayOfWeek,
    time: zdt.toPlainTime().toString({ smallestUnit: "minute" }),
    abbreviation: shortZoneName(zdt),
    offsetMinutes: zdt.offsetNanoseconds / 60_000_000_000,
  };
}

/**
 * Resolves a teacher wall-clock time to an instant, detecting times that are
 * skipped (spring forward) or repeated (fall back) by daylight saving.
 */
export function resolveTeacherTime(
  wallClock: Temporal.PlainDateTime,
  teacherZone: string,
): {
  status: ConversionStatus;
  primary: Temporal.ZonedDateTime;
  alternative: Temporal.ZonedDateTime | null;
} {
  const earlier = wallClock.toZonedDateTime(teacherZone, { disambiguation: "earlier" });
  const later = wallClock.toZonedDateTime(teacherZone, { disambiguation: "later" });
  if (earlier.epochNanoseconds === later.epochNanoseconds) {
    return { status: "normal", primary: earlier, alternative: null };
  }
  const compatible = wallClock.toZonedDateTime(teacherZone, { disambiguation: "compatible" });
  if (compatible.toPlainDateTime().equals(wallClock)) {
    return { status: "ambiguous", primary: earlier, alternative: later };
  }
  return { status: "nonexistent", primary: compatible, alternative: null };
}
