import { describe, it, expect } from "vitest";
import { buildNominatimUrl, mapNominatimResults } from "@/lib/geocode";

describe("buildNominatimUrl", () => {
  it("includes the required Nominatim query parameters", () => {
    const url = new URL(buildNominatimUrl("Paris"));
    expect(url.origin + url.pathname).toBe("https://nominatim.openstreetmap.org/search");
    expect(url.searchParams.get("format")).toBe("jsonv2");
    expect(url.searchParams.get("limit")).toBe("5");
    expect(url.searchParams.get("addressdetails")).toBe("0");
    expect(url.searchParams.get("q")).toBe("Paris");
  });

  it("encodes special characters in the query", () => {
    const url = new URL(buildNominatimUrl("São Paulo"));
    expect(url.searchParams.get("q")).toBe("São Paulo");
  });
});

describe("mapNominatimResults", () => {
  it("maps display_name, lat and lon, and calls the time zone lookup with numeric coordinates", () => {
    const calls: Array<[number, number]> = [];
    const lookupTimeZone = (lat: number, lon: number) => {
      calls.push([lat, lon]);
      return "America/New_York";
    };

    const results = mapNominatimResults(
      [{ display_name: "New York, USA", lat: "40.7128", lon: "-74.0060" }],
      lookupTimeZone,
    );

    expect(results).toEqual([
      { name: "New York, USA", lat: 40.7128, lon: -74.006, timeZone: "America/New_York" },
    ]);
    expect(calls).toEqual([[40.7128, -74.006]]);
  });

  it("returns an empty array for no results", () => {
    expect(mapNominatimResults([], () => "UTC")).toEqual([]);
  });
});
