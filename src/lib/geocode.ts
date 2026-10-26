export interface GeocodeResult {
  name: string;
  lat: number;
  lon: number;
  timeZone: string;
}

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function buildNominatimUrl(query: string): string {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("q", query);
  return url.toString();
}

export function mapNominatimResults(
  results: NominatimResult[],
  lookupTimeZone: (lat: number, lon: number) => string,
): GeocodeResult[] {
  return results.map((r) => {
    const lat = Number(r.lat);
    const lon = Number(r.lon);
    return { name: r.display_name, lat, lon, timeZone: lookupTimeZone(lat, lon) };
  });
}
