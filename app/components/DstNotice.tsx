import { useId } from "react";
import { formatZonedTime, type HourCycle } from "@/lib/time/format";
import type { DstNotice as Notice } from "@/lib/time/types";
import { cityFromZoneId } from "@/lib/time/zones";

interface DstNoticeProps {
  notice: Notice;
  locale: string;
  hourCycle: HourCycle;
}

function durationText(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts = [];
  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (rest) parts.push(`${rest} minutes`);
  return parts.join(" ");
}

function transitionDateText(isoDateTime: string, locale: string): string {
  const [year, month, day] = isoDateTime.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(Date.UTC(year, month - 1, day));
}

export default function DstNotice({ notice, locale, hourCycle }: DstNoticeProps) {
  const headingId = useId();
  const shift = notice.shiftMinutes;
  const previous = formatZonedTime(notice.previousWeekLocal, { locale, hourCycle });

  const summary =
    shift === 0
      ? "Your class time is the same as last week."
      : `This class is ${durationText(Math.abs(shift))} ${shift > 0 ? "later" : "earlier"} for you than last week.`;

  return (
    <div
      role="note"
      aria-labelledby={headingId}
      className="rounded-md border-2 border-amber-700 bg-amber-50 p-4 text-amber-950 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-50"
    >
      <h3 id={headingId} className="flex items-center gap-2 font-semibold">
        <span aria-hidden="true">⏰</span>
        Heads up: daylight saving time changed
      </h3>
      <p className="mt-1">{summary}</p>
      <ul className="mt-1 list-disc pl-5">
        {notice.transitions.map((transition) => (
          <li key={`${transition.zoneId}-${transition.at}`}>
            {cityFromZoneId(transition.zoneId)}{" "}
            {transition.direction === "back" ? "ended" : "started"} daylight saving time on{" "}
            {transitionDateText(transition.at, locale)}.
          </li>
        ))}
      </ul>
      {shift !== 0 && (
        <p className="mt-1">
          Last week this class was at {previous.timeText} on {previous.dateText}.
        </p>
      )}
    </div>
  );
}
