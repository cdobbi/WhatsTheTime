"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Temporal } from "temporal-polyfill";
import { convertClassTime, isValidDate, isValidTime } from "@/lib/time/convert";
import type { HourCycle } from "@/lib/time/format";
import { parseShareParams, toShareParams } from "@/lib/time/share-params";
import { DEFAULT_TEACHER_ZONE, type ConvertErrorField } from "@/lib/time/types";
import { isSupportedZone, listTimeZones } from "@/lib/time/zones";
import ConversionResult from "./ConversionResult";
import ShareLinkButton from "./ShareLinkButton";
import TimeZonePicker from "./TimeZonePicker";
import { useDeviceSettings } from "./device";

const inputClass =
  "w-full rounded-md border border-zinc-500 bg-white px-3 py-2 text-base text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 aria-[invalid=true]:border-red-700 dark:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-50 dark:[color-scheme:dark] dark:focus-visible:outline-blue-400 dark:aria-[invalid=true]:border-red-400";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm font-medium text-red-700 dark:text-red-400">
      {message}
    </p>
  );
}

export default function ClassTimeConverter() {
  const id = useId();
  const device = useDeviceSettings();
  const searchParams = useSearchParams();
  const [sharedLink] = useState(() => parseShareParams(searchParams));

  const [date, setDate] = useState(sharedLink.values.date ?? "");
  const [time, setTime] = useState(sharedLink.values.time ?? "");
  const [teacherZone, setTeacherZone] = useState(
    sharedLink.values.teacherZone ?? DEFAULT_TEACHER_ZONE,
  );
  const [userZoneChoice, setUserZoneChoice] = useState<string | null>(null);
  const [hourCycleChoice, setHourCycleChoice] = useState<HourCycle | null>(null);
  const [touched, setTouched] = useState<Set<ConvertErrorField>>(() => new Set());

  const [zoneOptions] = useState(() => listTimeZones(Temporal.Now.plainDateISO(), "en"));

  const userZone = userZoneChoice ?? device.timeZone;
  const hourCycle = hourCycleChoice ?? device.hourCycle;

  const outcome = useMemo(
    () => convertClassTime({ date, time, teacherZone }, userZone),
    [date, time, teacherZone, userZone],
  );
  const errors = outcome.ok ? {} : outcome.errors;
  const visibleError = (field: ConvertErrorField) =>
    touched.has(field) ? errors[field] : undefined;
  const touch = (field: ConvertErrorField) =>
    setTouched((current) => (current.has(field) ? current : new Set(current).add(field)));

  // Keep the shareable URL in sync with the class inputs (contracts/url-state.md, rule 4).
  useEffect(() => {
    if (!isValidDate(date) || !isValidTime(time) || !isSupportedZone(teacherZone)) return;
    const current = new URLSearchParams(window.location.search);
    const next = toShareParams({ date, time, teacherZone }, current);
    if (next.toString() !== current.toString()) {
      window.history.replaceState(null, "", `?${next}`);
    }
  }, [date, time, teacherZone]);

  const userZoneHint =
    device.ready && !device.timeZone && !userZoneChoice
      ? "We couldn't detect your time zone. Please choose it."
      : undefined;

  return (
    <div className="flex flex-col gap-8">
      {sharedLink.invalid && (
        <p
          role="status"
          className="rounded-md border-l-4 border-amber-700 bg-amber-50 p-3 text-amber-950 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-50"
        >
          This link couldn&apos;t be read, so we started a new conversion.
        </p>
      )}
      <form
        className="grid grid-cols-1 gap-5 rounded-lg border border-zinc-300 bg-white p-4 sm:grid-cols-2 sm:p-6 dark:border-zinc-700 dark:bg-zinc-950"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-date`} className="font-medium">
            Class date
          </label>
          <input
            id={`${id}-date`}
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              touch("date");
            }}
            onBlur={() => touch("date")}
            aria-invalid={visibleError("date") ? true : undefined}
            aria-describedby={visibleError("date") ? `${id}-date-error` : undefined}
            className={inputClass}
          />
          <FieldError id={`${id}-date-error`} message={visibleError("date")} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-time`} className="font-medium">
            Class time (teacher&apos;s time)
          </label>
          <input
            id={`${id}-time`}
            type="time"
            value={time}
            onChange={(event) => {
              setTime(event.target.value);
              touch("time");
            }}
            onBlur={() => touch("time")}
            aria-invalid={visibleError("time") ? true : undefined}
            aria-describedby={visibleError("time") ? `${id}-time-error` : undefined}
            className={inputClass}
          />
          <FieldError id={`${id}-time-error`} message={visibleError("time")} />
        </div>

        <TimeZonePicker
          label="Teacher's time zone"
          value={teacherZone}
          options={zoneOptions}
          onChange={(zone) => {
            setTeacherZone(zone);
            touch("teacherZone");
          }}
          error={visibleError("teacherZone")}
        />

        <TimeZonePicker
          label="Your time zone"
          value={userZone}
          options={zoneOptions}
          onChange={(zone) => {
            setUserZoneChoice(zone);
            touch("userZone");
          }}
          hint={userZoneHint}
          error={visibleError("userZone")}
        />

        <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:col-span-2">
          <legend className="mb-1 font-medium">Show times as</legend>
          {(["h12", "h23"] as const).map((cycle) => (
            <label key={cycle} className="flex items-center gap-2">
              <input
                type="radio"
                name={`${id}-hour-cycle`}
                value={cycle}
                checked={hourCycle === cycle}
                onChange={() => setHourCycleChoice(cycle)}
                className="h-4 w-4 accent-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:accent-blue-400"
              />
              {cycle === "h12" ? "12-hour (7:00 PM)" : "24-hour (19:00)"}
            </label>
          ))}
        </fieldset>
      </form>

      <section
        aria-live="polite"
        aria-label="Converted class time"
        className="rounded-lg border border-zinc-300 bg-white p-4 sm:p-6 dark:border-zinc-700 dark:bg-zinc-950"
      >
        {outcome.ok ? (
          <ConversionResult
            result={outcome.result}
            enteredTime={time}
            locale={device.locale}
            hourCycle={hourCycle}
          >
            <ShareLinkButton input={{ date, time, teacherZone }} />
          </ConversionResult>
        ) : (
          <p className="text-zinc-700 dark:text-zinc-300">
            Enter the class date and time to see when it is for you.
          </p>
        )}
      </section>
    </div>
  );
}
