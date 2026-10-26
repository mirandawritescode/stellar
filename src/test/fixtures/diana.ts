import type { BirthData } from "@/lib/types";

// Diana, Princess of Wales, AA-rated (birth certificate) data.
// Source: https://www.astrotheme.com/Focus-Astro-celebrity-Diana-Spencer.php
export const DIANA_BIRTH_DATA: BirthData = {
  version: 1,
  date: "1961-07-01",
  timeAccuracy: "exact",
  time: "19:45",
  place: {
    name: "Sandringham, England, United Kingdom",
    lat: 52.8273,
    lon: 0.5059,
    timeZone: "Europe/London",
  },
};

export const DIANA_EXPECTED = {
  sun: { sign: "Cancer", degreeInSign: 9 },
  moon: { sign: "Aquarius", degreeInSign: 25 },
  ascendant: { sign: "Sagittarius", degreeInSign: 18 },
};
