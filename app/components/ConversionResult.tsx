import { formatZonedTime, type HourCycle } from "@/lib/time/format";
import { cityFromZoneId } from "@/lib/time/zones";
import type { ConversionResult as Result } from "@/lib/time/types";
import DstNotice from "./DstNotice";

interface ConversionResultProps {
  result: Result;
  /** The time the user typed, `HH:mm`; differs from `result.teacher.time` when it was skipped. */
  enteredTime: string;
  locale: string;
  hourCycle: HourCycle;
  children?: React.ReactNode;
}

function dayOffsetLabel(dayOffset: number): string | null {
  if (dayOffset === 1) return "Next day";
  if (dayOffset === -1) return "Previous day";
  if (dayOffset > 1) return `${dayOffset} days later`;
  if (dayOffset < -1) return `${-dayOffset} days earlier`;
  return null;
}

export default function ConversionResult({
  result,
  enteredTime,
  locale,
  hourCycle,
  children,
}: ConversionResultProps) {
  const options = { locale, hourCycle };
  const local = formatZonedTime(result.local, options);
  const teacher = formatZonedTime(result.teacher, options);
  const teacherCity = cityFromZoneId(result.teacher.zoneId);
  const enteredText = formatZonedTime({ ...result.teacher, time: enteredTime }, options).timeText;
  const alternative = result.localAlternative
    ? formatZonedTime(result.localAlternative, options)
    : null;
  const dayLabel = dayOffsetLabel(result.dayOffset);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-medium text-zinc-700 dark:text-zinc-300">
          Your class time
        </h2>
        {alternative ? (
          <p className="mt-1 text-lg">
            Your class is at <strong className="font-semibold">{local.timeText}</strong> or{" "}
            <strong className="font-semibold">{alternative.timeText}</strong>
          </p>
        ) : (
          <p className="mt-1 text-4xl font-semibold tracking-tight">{local.timeText}</p>
        )}
        <p className="mt-1 flex flex-wrap items-center gap-2 text-lg">
          <span>{local.dateText}</span>
          {dayLabel && (
            <span className="rounded-full border border-amber-800 bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-950 dark:border-amber-300 dark:bg-amber-950 dark:text-amber-100">
              {dayLabel}
            </span>
          )}
        </p>
        <p className="text-zinc-700 dark:text-zinc-300">{local.zoneText}</p>
      </div>

      {result.status === "nonexistent" && (
        <p role="note" className="rounded-md border-l-4 border-blue-700 bg-blue-50 p-3 dark:border-blue-400 dark:bg-blue-950">
          {enteredText} doesn&apos;t exist in {teacherCity} on that date because the clocks moved
          forward an hour. Showing {teacher.timeText} instead.
        </p>
      )}

      {result.status === "ambiguous" && alternative && (
        <p role="note" className="rounded-md border-l-4 border-blue-700 bg-blue-50 p-3 dark:border-blue-400 dark:bg-blue-950">
          {teacher.timeText} happens twice in {teacherCity} on that date because the clocks moved
          back an hour. The first time is {local.timeText} for you; the second is{" "}
          {alternative.timeText}. Check with your teacher which one they mean.
        </p>
      )}

      {result.sameZone && (
        <p className="text-zinc-700 dark:text-zinc-300">
          Same time as the teacher — no conversion needed.
        </p>
      )}

      {result.dstNotice && (
        <DstNotice notice={result.dstNotice} locale={locale} hourCycle={hourCycle} />
      )}

      {children}

      <p className="border-t border-zinc-300 pt-3 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
        Teacher&apos;s time: {teacher.dateText}, {teacher.timeText}, {teacher.zoneText}
      </p>
    </div>
  );
}
