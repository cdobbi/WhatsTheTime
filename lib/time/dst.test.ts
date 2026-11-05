import { describe, expect, it } from "vitest";
import { Temporal } from "temporal-polyfill";
import { findDstNotice } from "./dst";

const DENVER = "America/Denver";

function notice(date: string, time: string, userZone: string, teacherZone = DENVER) {
  const wallClock = Temporal.PlainDateTime.from(`${date}T${time}`);
  const instant = wallClock.toZonedDateTime(teacherZone);
  return findDstNotice(instant, teacherZone, userZone, wallClock);
}

describe("findDstNotice", () => {
  it("4: teacher's zone ended daylight saving — class is 1 hour later", () => {
    const n = notice("2026-11-05", "19:00", "Africa/Lagos");
    expect(n).not.toBeNull();
    expect(n!.changedZones).toEqual(["teacher"]);
    expect(n!.transitions).toHaveLength(1);
    expect(n!.transitions[0].zoneId).toBe(DENVER);
    expect(n!.transitions[0].at.slice(0, 10)).toBe("2026-11-01");
    expect(n!.transitions[0].direction).toBe("back");
    expect(`${n!.previousWeekLocal.date} ${n!.previousWeekLocal.time}`).toBe("2026-10-30 02:00");
    expect(n!.shiftMinutes).toBe(60);
  });

  it("teacher's zone started daylight saving — class is 1 hour earlier", () => {
    const n = notice("2026-03-12", "19:00", "Africa/Lagos");
    expect(n!.changedZones).toEqual(["teacher"]);
    expect(n!.transitions[0].direction).toBe("forward");
    expect(n!.shiftMinutes).toBe(-60);
  });

  it("3: no notice the week before the change", () => {
    expect(notice("2026-10-29", "19:00", "Africa/Lagos")).toBeNull();
  });

  it("no notice when nothing changed in the past week", () => {
    expect(notice("2026-11-12", "19:00", "Africa/Lagos")).toBeNull();
  });

  it("10: only the student's zone changed (UK ends a week before the US)", () => {
    const n = notice("2026-10-29", "19:00", "Europe/London");
    expect(n!.changedZones).toEqual(["local"]);
    expect(n!.transitions[0].zoneId).toBe("Europe/London");
    expect(n!.transitions[0].at.slice(0, 10)).toBe("2026-10-25");
    expect(n!.shiftMinutes).toBe(-60);
  });

  it("both zones changed the same week — time is unchanged for the student", () => {
    const n = notice("2026-11-05", "19:00", "America/Toronto");
    expect(n!.changedZones).toEqual(["teacher", "local"]);
    expect(n!.shiftMinutes).toBe(0);
  });

  it("includes a change that happens on the class day before class", () => {
    const n = notice("2026-11-01", "19:00", "Africa/Lagos");
    expect(n!.changedZones).toEqual(["teacher"]);
    expect(n!.shiftMinutes).toBe(60);
  });
});
