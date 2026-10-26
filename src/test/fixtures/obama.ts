import type { BirthData } from "@/lib/types";

// Barack Obama, AA-rated (birth certificate) data.
// Sources: https://vedastro.org/astro-databank/Barack-Obama-1961.html,
// https://astrologify.com/people/barack-obama/
export const OBAMA_BIRTH_DATA: BirthData = {
  version: 1,
  date: "1961-08-04",
  timeAccuracy: "exact",
  time: "19:24",
  place: {
    name: "Honolulu, Hawaii, USA",
    lat: 21.3069,
    lon: -157.8583,
    timeZone: "Pacific/Honolulu",
  },
};

export const OBAMA_EXPECTED = {
  sun: { sign: "Leo", degreeInSign: 12.5476, house: 6 },
  moon: { sign: "Gemini", degreeInSign: 3.3525, house: 4 },
  ascendant: { sign: "Aquarius", degreeInSign: 18.0573 },
};
