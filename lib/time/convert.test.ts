import { describe, expect, it } from "vitest";
import { convertClassTime } from "./convert";
import type { ClassTimeInput, ConversionResult } from "./types";

const DENVER = "America/Denver";

function convert(date: string, time: string, userZone: string, teacherZone = DENVER) {
  const input: ClassTimeInput = { date, time, teacherZone };
  const outcome = convertClassTime(input, userZone);
  if (!outcome.ok) throw new Error(`Expected success, got ${JSON.stringify(outcome.errors)}`);
  return outcome.result;
}

const local = (r: ConversionResult) => `${r.local.date} ${r.local.time}`;

describe("convertClassTime – contract cases", () => {
  it("1: Denver → Lagos moves to the next day", () => {
    const r = convert("2026-11-12", "19:00", "Africa/Lagos");
    expect(local(r)).toBe("2026-11-13 03:00");
    expect(r.local.weekday).toBe(5);
    expect(r.dayOffset).toBe(1);
    expect(r.status).toBe("normal");
    expect(r.sameZone).toBe(false);
    expect(r.teacher.abbreviation).toBe("MST");
    expect(r.local.offsetMinutes).toBe(60);
  });

  it("2: Denver → Manila before US daylight saving starts", () => {
    const r = convert("2026-03-05", "18:00", "Asia/Manila");
    expect(local(r)).toBe("2026-03-06 09:00");
    expect(r.dayOffset).toBe(1);
  });

  it("5: a skipped time is moved forward by the gap", () => {
    const r = convert("2026-03-08", "02:30", "Africa/Lagos");
    expect(r.status).toBe("nonexistent");
    expect(r.teacher.time).toBe("03:30");
    expect(r.teacher.offsetMinutes).toBe(-360);
    expect(local(r)).toBe("2026-03-08 10:30");
    expect(r.localAlternative).toBeNull();
  });

  it("6: a repeated time returns both possible local times", () => {
    const r = convert("2026-11-01", "01:30", "Africa/Lagos");
    expect(r.status).toBe("ambiguous");
    expect(r.teacher.time).toBe("01:30");
    expect(local(r)).toBe("2026-11-01 08:30");
    expect(r.localAlternative).not.toBeNull();
    expect(`${r.localAlternative!.date} ${r.localAlternative!.time}`).toBe("2026-11-01 09:30");
  });

  it("7: half-hour offset (India)", () => {
    const r = convert("2026-11-12", "19:00", "Asia/Kolkata");
    expect(local(r)).toBe("2026-11-13 07:30");
    expect(r.local.zoneId).toBe("Asia/Kolkata");
  });

  it("8: 45-minute offset (Nepal)", () => {
    expect(local(convert("2026-11-12", "19:00", "Asia/Kathmandu"))).toBe("2026-11-13 07:45");
  });

  it("9: zone without daylight saving (Arizona)", () => {
    const r = convert("2026-07-01", "19:00", "America/Phoenix");
    expect(local(r)).toBe("2026-07-01 18:00");
    expect(r.dayOffset).toBe(0);
    expect(r.sameZone).toBe(false);
  });

  it("11: same zone needs no conversion", () => {
    const r = convert("2026-11-12", "19:00", DENVER);
    expect(local(r)).toBe("2026-11-12 19:00");
    expect(r.sameZone).toBe(true);
    expect(r.dayOffset).toBe(0);
  });

  it("12: crossing the date line (Auckland)", () => {
    const r = convert("2026-11-12", "19:00", "Pacific/Auckland");
    expect(local(r)).toBe("2026-11-13 15:00");
    expect(r.dayOffset).toBe(1);
  });
});

describe("convertClassTime – other behavior", () => {
  it("moves to the previous day when converting west", () => {
    const r = convert("2026-11-12", "08:00", "Pacific/Honolulu", "Asia/Manila");
    expect(local(r)).toBe("2026-11-11 14:00");
    expect(r.dayOffset).toBe(-1);
  });

  it("reports a two-day jump across extreme offsets", () => {
    const r = convert("2026-11-12", "23:30", "Pacific/Kiritimati", "Pacific/Pago_Pago");
    expect(local(r)).toBe("2026-11-14 00:30");
    expect(r.dayOffset).toBe(2);
  });

  it("accepts legacy zone names and reports the current name", () => {
    const r = convert("2026-11-12", "19:00", "Asia/Calcutta");
    expect(r.local.zoneId).toBe("Asia/Kolkata");
  });

  it("does not set a daylight saving notice when nothing changed", () => {
    expect(convert("2026-11-12", "19:00", "Africa/Lagos").dstNotice).toBeNull();
  });

  it("4: sets a daylight saving notice the week after the teacher's clocks change", () => {
    const r = convert("2026-11-05", "19:00", "Africa/Lagos");
    expect(local(r)).toBe("2026-11-06 03:00");
    expect(r.dstNotice?.changedZones).toEqual(["teacher"]);
    expect(r.dstNotice?.shiftMinutes).toBe(60);
  });

  it("3: no notice the week before the change", () => {
    const r = convert("2026-10-29", "19:00", "Africa/Lagos");
    expect(local(r)).toBe("2026-10-30 02:00");
    expect(r.dstNotice).toBeNull();
  });

  it("10: notice names only the student's zone when only it changed", () => {
    const r = convert("2026-10-29", "19:00", "Europe/London");
    expect(local(r)).toBe("2026-10-30 01:00");
    expect(r.dstNotice?.changedZones).toEqual(["local"]);
  });
});

describe("convertClassTime – validation", () => {
  const base: ClassTimeInput = { date: "2026-11-12", time: "19:00", teacherZone: DENVER };

  it("rejects an impossible date", () => {
    const outcome = convertClassTime({ ...base, date: "2026-02-30" }, "Africa/Lagos");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.errors.date).toMatch(/real date/i);
  });

  it("rejects an out-of-range time", () => {
    const outcome = convertClassTime({ ...base, time: "25:00" }, "Africa/Lagos");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.errors.time).toMatch(/00:00 and 23:59/);
  });

  it("rejects an unknown teacher zone", () => {
    const outcome = convertClassTime({ ...base, teacherZone: "Not/AZone" }, "Africa/Lagos");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.errors.teacherZone).toBeDefined();
  });

  it("reports every empty field at once", () => {
    const outcome = convertClassTime({ date: "", time: "", teacherZone: "" }, "");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(Object.keys(outcome.errors).sort()).toEqual(
        ["date", "teacherZone", "time", "userZone"].sort(),
      );
    }
  });
});
