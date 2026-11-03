import { Origin, Horoscope } from "circular-natal-horoscope-js";
import { ASPECT_ANGLES, angleDiff } from "@/lib/astro/natal";
import type {
  Aspect,
  AspectType,
  MoonPhase,
  NatalChart,
  Planet,
  PlanetPosition,
  Sign,
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

const TRANSIT_ORBS: Record<Planet, number> = {
  Sun: 3,
  Moon: 4,
  Mercury: 3,
  Venus: 3,
  Mars: 3,
  Jupiter: 2,
  Saturn: 2,
  Uranus: 2,
  Neptune: 2,
  Pluto: 2,
};

const RETROGRADE_TRACKED: Planet[] = ["Mercury", "Venus", "Mars"];

export interface Transits {
  date: string;
  aspects: Aspect[];
  moonPhase: MoonPhase;
  retrogradePlanets: Planet[];
}

// A fixed, always-UTC+0, no-DST location (Reykjavik) so the UTC time
// components we pass to Origin aren't shifted by the library's own
// internal lat/lon-based time zone lookup.
const UTC_REFERENCE_LOCATION = { lat: 64.1466, lon: -21.9426 };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function localDateString(localNoon: Date): string {
  return `${localNoon.getFullYear()}-${pad(localNoon.getMonth() + 1)}-${pad(localNoon.getDate())}`;
}

function buildTransitingPlanets(localNoon: Date): PlanetPosition[] {
  const origin = new Origin({
    year: localNoon.getUTCFullYear(),
    month: localNoon.getUTCMonth(),
    date: localNoon.getUTCDate(),
    hour: localNoon.getUTCHours(),
    minute: localNoon.getUTCMinutes(),
    latitude: UTC_REFERENCE_LOCATION.lat,
    longitude: UTC_REFERENCE_LOCATION.lon,
  });
  const horoscope = new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    aspectPoints: [],
    aspectWithPoints: [],
    aspectTypes: [],
    customOrbs: {},
    language: "en",
  });

  return PLANET_KEYS.map(({ key, planet }) => {
    const body = horoscope.CelestialBodies[key];
    const longitude: number = body.ChartPosition.Ecliptic.DecimalDegrees;
    return {
      planet,
      longitude,
      sign: body.Sign.label as Sign,
      degreeInSign: longitude % 30,
      retrograde: body.isRetrograde as boolean,
    };
  });
}

export function computeTransitAspects(
  transitingPlanets: PlanetPosition[],
  natalPlanets: PlanetPosition[],
): Aspect[] {
  const aspects: Aspect[] = [];

  for (const transiting of transitingPlanets) {
    const orbLimit = TRANSIT_ORBS[transiting.planet];
    for (const natal of natalPlanets) {
      const diff = angleDiff(transiting.longitude, natal.longitude);

      let closest: { type: AspectType; orb: number } | null = null;
      for (const [type, angle] of Object.entries(ASPECT_ANGLES) as [AspectType, number][]) {
        const orb = Math.abs(diff - angle);
        if (orb <= orbLimit && (!closest || orb < closest.orb)) {
          closest = { type, orb };
        }
      }
      if (closest) {
        aspects.push({ a: transiting.planet, b: natal.planet, type: closest.type, orb: closest.orb });
      }
    }
  }

  return aspects;
}

export function moonPhaseFromAngle(angle: number): MoonPhase {
  const normalized = ((angle % 360) + 360) % 360;
  if (normalized < 45) return "new";
  if (normalized < 180) return "waxing";
  if (normalized < 225) return "full";
  return "waning";
}

/** Local noon today — a stable, timezone-safe reference moment for "today's" transits. */
export function localNoonToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

export function computeTransits(natalChart: NatalChart, localNoon: Date): Transits {
  const transitingPlanets = buildTransitingPlanets(localNoon);
  const aspects = computeTransitAspects(transitingPlanets, natalChart.planets);

  const sun = transitingPlanets.find((p) => p.planet === "Sun")!;
  const moon = transitingPlanets.find((p) => p.planet === "Moon")!;
  const moonPhase = moonPhaseFromAngle(moon.longitude - sun.longitude);

  const retrogradePlanets = transitingPlanets
    .filter((p) => RETROGRADE_TRACKED.includes(p.planet) && p.retrograde)
    .map((p) => p.planet);

  return {
    date: localDateString(localNoon),
    aspects,
    moonPhase,
    retrogradePlanets,
  };
}
