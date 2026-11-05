import { isValidDate, isValidTime } from "./convert";
import type { ClassTimeInput } from "./types";
import { normalizeZoneId } from "./zones";

/** Anything with `get(name)`, such as `URLSearchParams` or Next.js `ReadonlyURLSearchParams`. */
interface ParamReader {
  get(name: string): string | null;
}

/**
 * Reads class values from a shared link (contracts/url-state.md). If any present
 * value is invalid, all values are discarded so a tampered link never half-applies.
 */
export function parseShareParams(params: ParamReader): {
  values: Partial<ClassTimeInput>;
  invalid: boolean;
} {
  const date = params.get("date") || null;
  const time = params.get("time") || null;
  const tz = params.get("tz") || null;

  const values: Partial<ClassTimeInput> = {};
  let invalid = false;

  if (date !== null) {
    if (isValidDate(date)) values.date = date;
    else invalid = true;
  }
  if (time !== null) {
    if (isValidTime(time)) values.time = time;
    else invalid = true;
  }
  if (tz !== null) {
    const zone = normalizeZoneId(tz);
    if (zone) values.teacherZone = zone;
    else invalid = true;
  }

  return invalid ? { values: {}, invalid: true } : { values, invalid: false };
}

/**
 * Builds the query string for a shared link. Only the class date, time, and
 * teacher zone are written; unknown parameters in `existing` are kept as-is.
 */
export function toShareParams(
  input: ClassTimeInput,
  existing?: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(existing);
  params.set("date", input.date);
  params.set("time", input.time);
  params.set("tz", input.teacherZone);
  return params;
}
