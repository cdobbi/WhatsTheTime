import type { ZonedTimeView } from "./types";
import { cityFromZoneId } from "./zones";

export type HourCycle = "h12" | "h23";

export interface FormattedZonedTime {
  /** e.g. "Friday, November 13, 2026" */
  dateText: string;
  /** e.g. "3:00 AM" or "03:00" */
  timeText: string;
  /** e.g. "West Africa Standard Time – Lagos (GMT+1)" */
  zoneText: string;
}

/**
 * Formats a wall-clock view for display. Date and time are formatted from the
 * view's own wall-clock fields (pinned to UTC) so the browser's zone never shifts them.
 */
export function formatZonedTime(
  view: ZonedTimeView,
  { locale, hourCycle }: { locale: string; hourCycle: HourCycle },
): FormattedZonedTime {
  const [year, month, day] = view.date.split("-").map(Number);
  const [hour, minute] = view.time.split(":").map(Number);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);

  const dateText = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(wallClockAsUtc);

  const timeText = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    hour: hourCycle === "h23" ? "2-digit" : "numeric",
    minute: "2-digit",
    hourCycle,
  }).format(wallClockAsUtc);

  const instant = wallClockAsUtc - view.offsetMinutes * 60_000;
  const genericName =
    new Intl.DateTimeFormat(locale, { timeZone: view.zoneId, timeZoneName: "longGeneric" })
      .formatToParts(instant)
      .find((part) => part.type === "timeZoneName")?.value ?? view.zoneId;

  return {
    dateText,
    timeText,
    zoneText: `${genericName} – ${cityFromZoneId(view.zoneId)} (${view.abbreviation})`,
  };
}

export function detectHourCycle(locale?: string): HourCycle {
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return cycle === "h23" || cycle === "h24" ? "h23" : "h12";
}
