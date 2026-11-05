import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClassTimeConverter from "./ClassTimeConverter";

const device = vi.hoisted(() => ({ timeZone: "Africa/Lagos" }));
const url = vi.hoisted(() => ({ search: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(url.search),
}));

vi.mock("./device", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./device")>();
  return {
    ...actual,
    useDeviceSettings: () => ({
      ready: true,
      timeZone: device.timeZone,
      locale: "en-US",
      hourCycle: "h12" as const,
    }),
  };
});

function enterClass(date: string, time: string) {
  fireEvent.change(screen.getByLabelText("Class date"), { target: { value: date } });
  fireEvent.change(screen.getByLabelText(/Class time/), { target: { value: time } });
}

const result = () => screen.getByRole("region", { name: "Converted class time" });

describe("ClassTimeConverter", () => {
  beforeEach(() => {
    device.timeZone = "Africa/Lagos";
    url.search = "";
    window.history.replaceState(null, "", "/");
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("pre-fills the device time zone and the default teacher zone", () => {
    render(<ClassTimeConverter />);
    expect(screen.getByRole("combobox", { name: "Your time zone" })).toHaveProperty(
      "value",
      "West Africa Standard Time – Lagos",
    );
    expect(screen.getByRole("combobox", { name: "Teacher's time zone" })).toHaveProperty(
      "value",
      "Mountain Time – Denver",
    );
  });

  it("converts a Denver class to Lagos time and flags the next day", () => {
    render(<ClassTimeConverter />);
    enterClass("2026-11-12", "19:00");
    expect(result().textContent).toContain("3:00 AM");
    expect(result().textContent).toContain("Friday, November 13, 2026");
    expect(result().textContent).toContain("Next day");
  });

  it("switches to 24-hour time", async () => {
    render(<ClassTimeConverter />);
    enterClass("2026-11-12", "19:00");
    await userEvent.click(screen.getByLabelText(/24-hour/));
    expect(result().textContent).toContain("03:00");
    expect(result().textContent).not.toContain("3:00 AM");
  });

  it("shows a plain-language error when the date is cleared", () => {
    render(<ClassTimeConverter />);
    enterClass("2026-11-12", "19:00");
    fireEvent.change(screen.getByLabelText("Class date"), { target: { value: "" } });
    expect(screen.getByText("Enter the class date.")).toBeTruthy();
    expect(screen.getByLabelText("Class date").getAttribute("aria-invalid")).toBe("true");
  });

  it("lets the user search for and choose a different time zone", async () => {
    const user = userEvent.setup();
    render(<ClassTimeConverter />);
    enterClass("2026-11-12", "19:00");
    const picker = screen.getByRole("combobox", { name: "Your time zone" });
    await user.click(picker);
    await user.keyboard("Philippines");
    await user.keyboard("{Enter}");
    expect(result().textContent).toContain("10:00 AM");
  });

  it("asks the user to choose a zone when the device zone is unknown", () => {
    device.timeZone = "";
    render(<ClassTimeConverter />);
    expect(screen.getByText(/couldn't detect your time zone/)).toBeTruthy();
  });

  it("explains a daylight saving change in the teacher's zone", () => {
    render(<ClassTimeConverter />);
    enterClass("2026-11-05", "19:00");
    const note = screen.getByRole("note", { name: /daylight saving/ });
    expect(note.textContent).toContain("1 hour later");
    expect(note.textContent).toContain("Denver ended daylight saving time on Sunday, November 1, 2026");
    expect(note.textContent).toContain("Last week this class was at 2:00 AM");
  });

  it("shows no daylight saving notice when nothing changed", () => {
    render(<ClassTimeConverter />);
    enterClass("2026-11-12", "19:00");
    expect(screen.queryByRole("note", { name: /daylight saving/ })).toBeNull();
  });

  it("pre-fills the class from a shared link and converts it to the device zone", () => {
    url.search = "date=2026-11-12&time=19:00&tz=America%2FDenver";
    render(<ClassTimeConverter />);
    expect(screen.getByLabelText("Class date")).toHaveProperty("value", "2026-11-12");
    expect(screen.getByLabelText(/Class time/)).toHaveProperty("value", "19:00");
    expect(result().textContent).toContain("3:00 AM");
  });

  it("starts fresh and explains when a shared link is invalid", () => {
    url.search = "date=2026-02-30&time=19:00&tz=America%2FDenver";
    render(<ClassTimeConverter />);
    expect(screen.getByRole("status").textContent).toMatch(/couldn't be read/);
    expect(screen.getByLabelText("Class date")).toHaveProperty("value", "");
  });

  it("keeps the URL in sync without the user's own time zone", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    render(<ClassTimeConverter />);
    enterClass("2026-11-12", "19:00");
    expect(replaceState).toHaveBeenLastCalledWith(
      null,
      "",
      "?date=2026-11-12&time=19%3A00&tz=America%2FDenver",
    );
    expect(window.location.search).not.toContain("Lagos");
  });

  it("copies a share link and confirms it", async () => {
    const user = userEvent.setup();
    render(<ClassTimeConverter />);
    enterClass("2026-11-12", "19:00");
    await user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await screen.findByText("Link copied")).toBeTruthy();
    expect(await navigator.clipboard.readText()).toBe(
      "http://localhost:3000/?date=2026-11-12&time=19%3A00&tz=America%2FDenver",
    );
  });

  it("shows the link to copy by hand when the clipboard is unavailable", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    render(<ClassTimeConverter />);
    enterClass("2026-11-12", "19:00");
    await user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(
      (await screen.findByLabelText(/Copy this link/)).getAttribute("value"),
    ).toContain("tz=America%2FDenver");
  });
});
