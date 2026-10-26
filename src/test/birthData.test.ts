import { describe, it, expect } from "vitest";
import { parseBirthData } from "@/lib/storage/birthData";
import type { BirthData } from "@/lib/types";

const VALID: BirthData = {
  version: 1,
  date: "1990-06-15",
  timeAccuracy: "unknown",
  place: { name: "Portland, Oregon", lat: 45.52, lon: -122.67, timeZone: "America/Los_Angeles" },
};

describe("parseBirthData", () => {
  it("returns null for null input", () => {
    expect(parseBirthData(null)).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseBirthData("not json")).toBeNull();
  });

  it("returns null when version is missing", () => {
    const withoutVersion: Record<string, unknown> = { ...VALID };
    delete withoutVersion.version;
    expect(parseBirthData(JSON.stringify(withoutVersion))).toBeNull();
  });

  it("returns null when version doesn't match", () => {
    expect(parseBirthData(JSON.stringify({ ...VALID, version: 2 }))).toBeNull();
  });

  it("returns the parsed data for a valid version 1 record", () => {
    expect(parseBirthData(JSON.stringify(VALID))).toEqual(VALID);
  });
});
