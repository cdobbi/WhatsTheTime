import { Temporal } from "temporal-polyfill";
import { findDstNotice } from "./dst";
import { resolveTeacherTime, toZonedTimeView } from "./resolve";
import type { ClassTimeInput, ConvertErrorField, ConvertOutcome } from "./types";
import { normalizeZoneId } from "./zones";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  try {
    Temporal.PlainDate.from(value, { overflow: "reject" });
    return true;
  } catch {
    return false;
  }
}

export function convertClassTime(input: ClassTimeInput, userZone: string): ConvertOutcome {
  const errors: Partial<Record<ConvertErrorField, string>> = {};

  if (!input.date) errors.date = "Enter the class date.";
  else if (!isValidDate(input.date)) errors.date = "Enter a real date, for example 2026-11-12.";

  if (!input.time) errors.time = "Enter the class time.";
  else if (!isValidTime(input.time)) errors.time = "Enter a time between 00:00 and 23:59.";

  const teacherZone = input.teacherZone ? normalizeZoneId(input.teacherZone) : null;
  if (!input.teacherZone) errors.teacherZone = "Choose the teacher's time zone.";
  else if (!teacherZone) errors.teacherZone = "Choose the teacher's time zone from the list.";

  const localZone = userZone ? normalizeZoneId(userZone) : null;
  if (!userZone) errors.userZone = "Choose your time zone.";
  else if (!localZone) errors.userZone = "Choose your time zone from the list.";

  if (Object.keys(errors).length > 0 || !teacherZone || !localZone) {
    return { ok: false, errors };
  }

  const wallClock = Temporal.PlainDateTime.from(`${input.date}T${input.time}`);
  const { status, primary, alternative } = resolveTeacherTime(wallClock, teacherZone);
  const local = primary.withTimeZone(localZone);

  return {
    ok: true,
    result: {
      status,
      teacher: toZonedTimeView(primary, teacherZone),
      local: toZonedTimeView(local, localZone),
      localAlternative: alternative
        ? toZonedTimeView(alternative.withTimeZone(localZone), localZone)
        : null,
      dayOffset: primary.toPlainDate().until(local.toPlainDate(), { largestUnit: "days" }).days,
      sameZone: primary.offsetNanoseconds === local.offsetNanoseconds,
      dstNotice: findDstNotice(primary, teacherZone, localZone, wallClock),
    },
  };
}
