import { describe, expect, it } from "vitest";
import { detectHourCycle, formatZonedTime } from "./format";
import type { ZonedTimeView } from "./types";

const lagos: ZonedTimeView = {
  zoneId: "Africa/Lagos",
  date: "2026-11-13",
  weekday: 5,
  time: "03:00",
  abbreviation: "GMT+1",
  offsetMinutes: 60,
};

describe("formatZonedTime", () => {
  it("formats a 12-hour time with a full date", () => {
    const text = formatZonedTime(lagos, { locale: "en-US", hourCycle: "h12" });
    expect(text.dateText).toBe("Friday, November 13, 2026");
    expect(text.timeText).toBe("3:00 AM");
  });

  it("formats a 24-hour time with two-digit hours", () => {
    expect(formatZonedTime(lagos, { locale: "en-US", hourCycle: "h23" }).timeText).toBe("03:00");
  });

  it("labels the zone with a plain-language name, city, and abbreviation", () => {
    const { zoneText } = formatZonedTime(lagos, { locale: "en-US", hourCycle: "h12" });
    expect(zoneText).toContain("Lagos");
    expect(zoneText).toContain("GMT+1");
    expect(zoneText).not.toContain("Africa/");
  });

  it("does not shift the wall-clock date for zones far from UTC", () => {
    const auckland: ZonedTimeView = { ...lagos, zoneId: "Pacific/Auckland", time: "00:15", abbreviation: "GMT+13", offsetMinutes: 780 };
    expect(formatZonedTime(auckland, { locale: "en-US", hourCycle: "h23" }).dateText).toBe(
      "Friday, November 13, 2026",
    );
  });
});

describe("detectHourCycle", () => {
  it("uses 12-hour time for US English and 24-hour for UK English", () => {
    expect(detectHourCycle("en-US")).toBe("h12");
    expect(detectHourCycle("en-GB")).toBe("h23");
  });
});
