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

export type Planet =
  | "Sun"
  | "Moon"
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune"
  | "Pluto";

export type Sign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

export interface PlanetPosition {
  planet: Planet;
  longitude: number;
  sign: Sign;
  degreeInSign: number;
  house?: number;
  retrograde: boolean;
  altSign?: Sign;
}

export type AspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export interface Aspect {
  a: Planet;
  b: Planet;
  type: AspectType;
  orb: number;
}

export interface NatalChart {
  version: 1;
  computedFrom: { date: string; timeUsed: string; timeAccuracy: TimeAccuracy };
  planets: PlanetPosition[];
  ascendant?: { sign: Sign; degreeInSign: number; estimated: boolean };
  aspects: Aspect[];
}

export type Theme =
  | "focus"
  | "communication"
  | "creative"
  | "admin"
  | "social"
  | "selfcare"
  | "money"
  | "action";

export type TaskCategory = Theme;

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  focus: "Focus work",
  communication: "Calls & messages",
  creative: "Creative",
  admin: "Admin & errands",
  social: "Social",
  selfcare: "Self-care",
  money: "Money",
  action: "Physical & action",
};

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  dueDate?: string;
  done: boolean;
  createdAt: string;
  completedAt?: string;
}
