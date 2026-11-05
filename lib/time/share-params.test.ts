import { describe, expect, it } from "vitest";
import { parseShareParams, toShareParams } from "./share-params";

const input = { date: "2026-11-12", time: "19:00", teacherZone: "America/Denver" };

describe("toShareParams / parseShareParams", () => {
  it("round-trips a class time", () => {
    const params = toShareParams(input);
    expect(params.toString()).toBe("date=2026-11-12&time=19%3A00&tz=America%2FDenver");
    expect(parseShareParams(params)).toEqual({ values: input, invalid: false });
  });

  it("never includes the user's own time zone", () => {
    const keys = [...toShareParams(input).keys()];
    expect(keys.sort()).toEqual(["date", "time", "tz"]);
  });

  it("preserves unknown parameters already in the URL", () => {
    const params = toShareParams(input, new URLSearchParams("ref=class-email&tz=Asia/Manila"));
    expect(params.get("ref")).toBe("class-email");
    expect(params.get("tz")).toBe("America/Denver");
  });
});

describe("parseShareParams", () => {
  it("returns only the parameters that are present", () => {
    expect(parseShareParams(new URLSearchParams("tz=Asia%2FManila"))).toEqual({
      values: { teacherZone: "Asia/Manila" },
      invalid: false,
    });
    expect(parseShareParams(new URLSearchParams(""))).toEqual({ values: {}, invalid: false });
  });

  it("normalizes legacy zone names", () => {
    expect(parseShareParams(new URLSearchParams("tz=Asia/Calcutta")).values.teacherZone).toBe(
      "Asia/Kolkata",
    );
  });

  it.each([
    ["an impossible date", "date=2026-02-30&time=19:00&tz=America%2FDenver"],
    ["a malformed time", "date=2026-11-12&time=7pm&tz=America%2FDenver"],
    ["an unknown zone", "date=2026-11-12&time=19:00&tz=Not%2FAZone"],
    ["a fixed offset", "date=2026-11-12&time=19:00&tz=%2B05%3A00"],
  ])("ignores every value when the link has %s", (_label, query) => {
    expect(parseShareParams(new URLSearchParams(query))).toEqual({ values: {}, invalid: true });
  });

  it("ignores unknown extra parameters", () => {
    expect(parseShareParams(new URLSearchParams("date=2026-11-12&utm_source=x"))).toEqual({
      values: { date: "2026-11-12" },
      invalid: false,
    });
  });
});
