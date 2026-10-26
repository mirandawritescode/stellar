import { Origin, Horoscope } from "circular-natal-horoscope-js";
import type {
  ApproxWindow,
  Aspect,
  AspectType,
  BirthData,
  NatalChart,
  Planet,
  PlanetPosition,
  Sign,
  TimeAccuracy,
} from "@/lib/types";

const PLANET_KEYS: { key: string; planet: Planet }[] = [
  { key: "sun", planet: "Sun" },
  { key: "moon", planet: "Moon" },
  { key: "mercury", planet: "Mercury" },
  { key: "venus", planet: "Venus" },
  { key: "mars", planet: "Mars" },
  { key: "jupiter", planet: "Jupiter" },
  { key: "saturn", planet: "Saturn" },
  { key: "uranus", planet: "Uranus" },
  { key: "neptune", planet: "Neptune" },
  { key: "pluto", planet: "Pluto" },
];

const APPROX_MIDPOINTS: Record<ApproxWindow, { hour: number; minute: number }> = {
  morning: { hour: 9, minute: 0 },
  afternoon: { hour: 15, minute: 0 },
  evening: { hour: 21, minute: 0 },
  night: { hour: 3, minute: 0 },
};

type TimeBound = { hour: number; minute: number };

const APPROX_WINDOW_BOUNDS: Record<ApproxWindow, [TimeBound, TimeBound]> = {
  morning: [
    { hour: 6, minute: 0 },
    { hour: 12, minute: 0 },
  ],
  afternoon: [
    { hour: 12, minute: 0 },
    { hour: 18, minute: 0 },
  ],
  evening: [
    { hour: 18, minute: 0 },
    { hour: 23, minute: 59 },
  ],
  night: [
    { hour: 0, minute: 0 },
    { hour: 6, minute: 0 },
  ],
};

const UNKNOWN_WINDOW_BOUNDS: [TimeBound, TimeBound] = [
  { hour: 0, minute: 0 },
  { hour: 23, minute: 59 },
];

const ASPECT_ANGLES: Record<AspectType, number> = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
};

export function effectiveTime(
  timeAccuracy: TimeAccuracy,
  time: string | undefined,
  approxWindow: ApproxWindow | undefined,
): TimeBound {
  if (timeAccuracy === "exact") {
    const [hour, minute] = (time ?? "12:00").split(":").map(Number);
    return { hour, minute };
  }
  if (timeAccuracy === "approximate") {
    return APPROX_MIDPOINTS[approxWindow ?? "morning"];
  }
  return { hour: 12, minute: 0 };
}

export function pickAltSign(startSign: Sign, endSign: Sign): Sign | undefined {
  return startSign !== endSign ? endSign : undefined;
}

function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function computeAspects(planets: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = [];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      const diff = angleDiff(p1.longitude, p2.longitude);
      const orbLimit =
        p1.planet === "Sun" || p1.planet === "Moon" || p2.planet === "Sun" || p2.planet === "Moon"
          ? 8
          : 6;

      let closest: { type: AspectType; orb: number } | null = null;
      for (const [type, angle] of Object.entries(ASPECT_ANGLES) as [AspectType, number][]) {
        const orb = Math.abs(diff - angle);
        if (orb <= orbLimit && (!closest || orb < closest.orb)) {
          closest = { type, orb };
        }
      }
      if (closest) {
        aspects.push({ a: p1.planet, b: p2.planet, type: closest.type, orb: closest.orb });
      }
    }
  }

  return aspects;
}

function buildHoroscope(
  date: string,
  hour: number,
  minute: number,
  lat: number,
  lon: number,
): Horoscope {
  const [year, month, day] = date.split("-").map(Number);
  const origin = new Origin({
    year,
    month: month - 1,
    date: day,
    hour,
    minute,
    latitude: lat,
    longitude: lon,
  });
  return new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    aspectPoints: [],
    aspectWithPoints: [],
    aspectTypes: [],
    customOrbs: {},
    language: "en",
  });
}

function moonSignAt(date: string, bound: TimeBound, lat: number, lon: number): Sign {
  const horoscope = buildHoroscope(date, bound.hour, bound.minute, lat, lon);
  return horoscope.CelestialBodies.moon.Sign.label as Sign;
}

export function computeNatalChart(birthData: BirthData): NatalChart {
  const { date, timeAccuracy, time, approxWindow, place } = birthData;
  const { hour, minute } = effectiveTime(timeAccuracy, time, approxWindow);
  const includeHouses = timeAccuracy !== "unknown";

  const horoscope = buildHoroscope(date, hour, minute, place.lat, place.lon);

  const planets: PlanetPosition[] = PLANET_KEYS.map(({ key, planet }) => {
    const body = horoscope.CelestialBodies[key];
    const longitude: number = body.ChartPosition.Ecliptic.DecimalDegrees;
    return {
      planet,
      longitude,
      sign: body.Sign.label as Sign,
      degreeInSign: longitude % 30,
      house: includeHouses ? (body.House.id as number) : undefined,
      retrograde: body.isRetrograde as boolean,
    };
  });

  if (timeAccuracy === "approximate" || timeAccuracy === "unknown") {
    const bounds =
      timeAccuracy === "approximate" ? APPROX_WINDOW_BOUNDS[approxWindow ?? "morning"] : UNKNOWN_WINDOW_BOUNDS;
    const startSign = moonSignAt(date, bounds[0], place.lat, place.lon);
    const endSign = moonSignAt(date, bounds[1], place.lat, place.lon);
    const altSign = pickAltSign(startSign, endSign);
    if (altSign) {
      const moon = planets.find((p) => p.planet === "Moon");
      if (moon) moon.altSign = altSign;
    }
  }

  let ascendant: NatalChart["ascendant"];
  if (includeHouses) {
    const asc = horoscope.Ascendant;
    const ascLongitude: number = asc.ChartPosition.Ecliptic.DecimalDegrees;
    ascendant = {
      sign: asc.Sign.label as Sign,
      degreeInSign: ascLongitude % 30,
      estimated: timeAccuracy === "approximate",
    };
  }

  const timeUsed = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return {
    version: 1,
    computedFrom: { date, timeUsed, timeAccuracy },
    planets,
    ascendant,
    aspects: computeAspects(planets),
  };
}
