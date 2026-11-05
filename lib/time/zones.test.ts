import { describe, expect, it } from "vitest";
import { Temporal } from "temporal-polyfill";
import {
  formatZoneLabel,
  isSupportedZone,
  listTimeZones,
  normalizeZoneId,
  searchTimeZones,
} from "./zones";

const options = listTimeZones(Temporal.PlainDate.from("2026-11-12"), "en");
const ids = (query: string) => searchTimeZones(options, query).map((o) => o.id);

describe("listTimeZones", () => {
  it("labels Denver as Mountain Time with its November abbreviation", () => {
    const denver = options.find((o) => o.id === "America/Denver");
    expect(denver).toBeDefined();
    expect(formatZoneLabel(denver!)).toBe("Mountain Time – Denver");
    expect(denver!.abbreviation).toBe("MST");
  });

  it("uses current IANA names regardless of the runtime's legacy aliases", () => {
    const list = options.map((o) => o.id);
    expect(list).toContain("Asia/Kolkata");
    expect(list).toContain("Asia/Kathmandu");
    expect(list).not.toContain("Asia/Calcutta");
  });

  it("is sorted by generic name, then city", () => {
    for (let i = 1; i < options.length; i++) {
      const a = options[i - 1];
      const b = options[i];
      const order =
        a.genericName.localeCompare(b.genericName) || a.city.localeCompare(b.city);
      expect(order).toBeLessThanOrEqual(0);
    }
  });
});

describe("searchTimeZones", () => {
  it("finds zones by common name and city", () => {
    expect(ids("mountain time")).toContain("America/Denver");
    expect(ids("denver")[0]).toBe("America/Denver");
  });

  it("finds zones by country alias", () => {
    expect(ids("Philippines")[0]).toBe("Asia/Manila");
    expect(ids("nigeria")[0]).toBe("Africa/Lagos");
    expect(ids("India")[0]).toBe("Asia/Kolkata");
  });

  it("is case- and accent-insensitive", () => {
    expect(ids("SÃO PAULO")[0]).toBe("America/Sao_Paulo");
  });

  it("ranks exact alias matches first", () => {
    expect(ids("Mountain Time")[0]).toBe("America/Denver");
  });

  it("returns nothing for an empty query", () => {
    expect(ids("   ")).toEqual([]);
  });
});

describe("isSupportedZone / normalizeZoneId", () => {
  it("accepts IANA ids and their legacy aliases", () => {
    expect(isSupportedZone("America/Denver")).toBe(true);
    expect(isSupportedZone("Asia/Calcutta")).toBe(true);
    expect(normalizeZoneId("Asia/Calcutta")).toBe("Asia/Kolkata");
  });

  it("rejects unknown ids and fixed offsets", () => {
    expect(isSupportedZone("Not/AZone")).toBe(false);
    expect(isSupportedZone("+05:00")).toBe(false);
    expect(isSupportedZone("")).toBe(false);
    expect(normalizeZoneId("Not/AZone")).toBeNull();
  });
});
