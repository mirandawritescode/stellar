export type TimeAccuracy = "exact" | "approximate" | "unknown";
export type ApproxWindow = "morning" | "afternoon" | "evening" | "night";

export interface BirthPlace {
  name: string;
  lat: number;
  lon: number;
  timeZone: string;
}

export interface BirthData {
  version: 1;
  date: string;
  timeAccuracy: TimeAccuracy;
  time?: string;
  approxWindow?: ApproxWindow;
  place: BirthPlace;
}
