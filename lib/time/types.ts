export const DEFAULT_TEACHER_ZONE = "America/Denver";

/** A class meeting as the teacher defines it. */
export interface ClassTimeInput {
  /** ISO calendar date `YYYY-MM-DD`. Required; must be a real calendar date. */
  date: string;
  /** Wall-clock time `HH:mm` (24-hour, internal). Required; `00:00`–`23:59`. */
  time: string;
  /** IANA zone id. Required; must be in the supported zone list. */
  teacherZone: string;
}

export interface TimeZoneOption {
  /** IANA zone id; never a fixed offset. */
  id: string;
  /** e.g. "Mountain Time" */
  genericName: string;
  /** e.g. "Denver" */
  city: string;
  /** Short name on the reference date, e.g. "MST" or "GMT+1". */
  abbreviation: string;
  /** Lower-cased, accent-stripped terms used for search. */
  searchTerms: string[];
}

export interface ZonedTimeView {
  zoneId: string;
  /** `YYYY-MM-DD` */
  date: string;
  /** 1–7 (ISO, Monday = 1) */
  weekday: number;
  /** `HH:mm` */
  time: string;
  abbreviation: string;
  offsetMinutes: number;
}

export type ConversionStatus = "normal" | "ambiguous" | "nonexistent";

export interface DstTransition {
  zoneId: string;
  /** ISO date-time with offset, in the zone that changed. */
  at: string;
  direction: "forward" | "back";
}

export interface DstNotice {
  changedZones: ("teacher" | "local")[];
  transitions: DstTransition[];
  /** The same teacher wall-clock time 7 days earlier, in the user's zone. */
  previousWeekLocal: ZonedTimeView;
  /** Local wall-clock change versus last week, e.g. +60. */
  shiftMinutes: number;
}

export interface ConversionResult {
  status: ConversionStatus;
  teacher: ZonedTimeView;
  local: ZonedTimeView;
  /** Second possible local time; only when `status = "ambiguous"`. */
  localAlternative: ZonedTimeView | null;
  /** Calendar days from the teacher's date to the local date: usually -1, 0, or 1; ±2 is possible between extreme offsets. */
  dayOffset: number;
  /** True when both zones have the same UTC offset on that date. */
  sameZone: boolean;
  dstNotice: DstNotice | null;
}

export type ConvertErrorField = "date" | "time" | "teacherZone" | "userZone";

export type ConvertOutcome =
  | { ok: true; result: ConversionResult }
  | { ok: false; errors: Partial<Record<ConvertErrorField, string>> };
