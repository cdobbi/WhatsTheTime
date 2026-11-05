"use client";

import { useSyncExternalStore } from "react";
import { detectHourCycle, type HourCycle } from "@/lib/time/format";
import { normalizeZoneId } from "@/lib/time/zones";

const noSubscription = () => () => {};

/** The device's IANA time zone, or "" if it is unknown or unsupported. */
export function getDeviceTimeZone(): string {
  return normalizeZoneId(Intl.DateTimeFormat().resolvedOptions().timeZone) ?? "";
}

export function getDeviceLocale(): string {
  return navigator.language || "en-US";
}

export interface DeviceSettings {
  /** False during server rendering and hydration. */
  ready: boolean;
  timeZone: string;
  locale: string;
  hourCycle: HourCycle;
}

/** Reads device settings after hydration; the server snapshot uses neutral defaults. */
export function useDeviceSettings(): DeviceSettings {
  const ready = useSyncExternalStore(noSubscription, () => true, () => false);
  const timeZone = useSyncExternalStore(noSubscription, getDeviceTimeZone, () => "");
  const locale = useSyncExternalStore(noSubscription, getDeviceLocale, () => "en-US");
  return { ready, timeZone, locale, hourCycle: ready ? detectHourCycle(locale) : "h12" };
}
