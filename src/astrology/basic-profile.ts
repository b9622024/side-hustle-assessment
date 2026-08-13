import { EclipticGeoMoon, SiderealTime, SunPosition } from "astronomy-engine";
import type { AstrologyElement, AstrologyModality } from "../scoring/types";
import type { AstrologyPlacement, AstrologyProfile } from "../report/types";

const SIGNS = [
  ["ARIES", "牡羊座", "FIRE", "CARDINAL"], ["TAURUS", "金牛座", "EARTH", "FIXED"],
  ["GEMINI", "雙子座", "AIR", "MUTABLE"], ["CANCER", "巨蟹座", "WATER", "CARDINAL"],
  ["LEO", "獅子座", "FIRE", "FIXED"], ["VIRGO", "處女座", "EARTH", "MUTABLE"],
  ["LIBRA", "天秤座", "AIR", "CARDINAL"], ["SCORPIO", "天蠍座", "WATER", "FIXED"],
  ["SAGITTARIUS", "射手座", "FIRE", "MUTABLE"], ["CAPRICORN", "摩羯座", "EARTH", "CARDINAL"],
  ["AQUARIUS", "水瓶座", "AIR", "FIXED"], ["PISCES", "雙魚座", "WATER", "MUTABLE"],
] as const satisfies ReadonlyArray<readonly [string, string, AstrologyElement, AstrologyModality]>;

const LOCATIONS: Array<{ matches: string[]; latitude: number; longitude: number }> = [
  { matches: ["台北", "臺北"], latitude: 25.033, longitude: 121.5654 },
  { matches: ["新北"], latitude: 25.012, longitude: 121.4657 }, { matches: ["基隆"], latitude: 25.1276, longitude: 121.7392 },
  { matches: ["桃園"], latitude: 24.9937, longitude: 121.301 }, { matches: ["新竹"], latitude: 24.8138, longitude: 120.9675 },
  { matches: ["苗栗"], latitude: 24.5602, longitude: 120.8214 }, { matches: ["台中", "臺中"], latitude: 24.1477, longitude: 120.6736 },
  { matches: ["彰化"], latitude: 24.0756, longitude: 120.544 }, { matches: ["南投"], latitude: 23.9609, longitude: 120.9719 },
  { matches: ["雲林"], latitude: 23.7092, longitude: 120.4313 }, { matches: ["嘉義"], latitude: 23.4801, longitude: 120.4491 },
  { matches: ["台南", "臺南"], latitude: 22.9999, longitude: 120.2269 }, { matches: ["高雄"], latitude: 22.6273, longitude: 120.3014 },
  { matches: ["屏東"], latitude: 22.5519, longitude: 120.5488 }, { matches: ["宜蘭"], latitude: 24.7021, longitude: 121.7378 },
  { matches: ["花蓮"], latitude: 23.9911, longitude: 121.6112 }, { matches: ["台東", "臺東"], latitude: 22.7554, longitude: 121.15 },
  { matches: ["澎湖"], latitude: 23.5712, longitude: 119.5793 }, { matches: ["金門"], latitude: 24.4494, longitude: 118.3767 },
  { matches: ["馬祖", "連江"], latitude: 26.1605, longitude: 119.9517 },
];

const BASE_WEIGHTS = { sun: 0.4, moon: 0.35, ascendant: 0.25 } as const;
type PointKey = keyof typeof BASE_WEIGHTS;

function placement(longitude: number, calculationStatus: string): AstrologyPlacement {
  const normalized = ((longitude % 360) + 360) % 360;
  const [signCode, signName, element, modality] = SIGNS[Math.floor(normalized / 30)]!;
  return { sign: signName, sign_code: signCode, sign_name: signName, longitude: normalized, element, modality, calculation_status: calculationStatus };
}

function taiwanLocalDate(birthDate: string, birthTime: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) throw new Error("INVALID_BIRTH_DATETIME");
  return new Date(`${birthDate}T${birthTime}:00+08:00`);
}

function ascendantLongitude(date: Date, latitude: number, longitude: number): number {
  const radians = Math.PI / 180;
  const theta = (SiderealTime(date) * 15 + longitude) * radians;
  const phi = latitude * radians;
  const obliquity = 23.4392911 * radians;
  const raw = Math.atan2(-Math.cos(theta), Math.sin(theta) * Math.cos(obliquity) + Math.tan(phi) * Math.sin(obliquity)) / radians + 180;
  return (raw + 360) % 360;
}

function normalizePointWeights(includedPoints: PointKey[]): Partial<Record<PointKey, number>> {
  const total = includedPoints.reduce((sum, point) => sum + BASE_WEIGHTS[point], 0);
  return Object.fromEntries(includedPoints.map((point) => [point, BASE_WEIGHTS[point] / total]));
}

function distribution<T extends string>(points: Partial<Record<PointKey, AstrologyPlacement>>, normalizedWeights: Partial<Record<PointKey, number>>, read: (placement: AstrologyPlacement) => T, keys: readonly T[]): Record<T, number> {
  const result = Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;
  for (const point of Object.keys(points) as PointKey[]) {
    const value = points[point];
    if (value) result[read(value)] += normalizedWeights[point] ?? 0;
  }
  return result;
}

export function calculateBasicAstrologyProfile(birthDate: string, birthTime?: string, birthPlace?: string): AstrologyProfile {
  const birthTimeKnown = Boolean(birthTime);
  const date = taiwanLocalDate(birthDate, birthTime ?? "12:00");
  const points: Partial<Record<PointKey, AstrologyPlacement>> = { sun: placement(SunPosition(date).elon, "calculated_true_ecliptic_longitude") };
  if (birthTimeKnown) points.moon = placement(EclipticGeoMoon(date).lon, "calculated_from_exact_time");
  const location = birthTimeKnown ? LOCATIONS.find((item) => item.matches.some((name) => birthPlace?.includes(name))) : undefined;
  if (location) points.ascendant = placement(ascendantLongitude(date, location.latitude, location.longitude), "calculated_from_exact_time_and_location");

  const includedPoints = (["sun", "moon", "ascendant"] as PointKey[]).filter((point) => points[point]);
  const excludedPoints = (["sun", "moon", "ascendant"] as PointKey[]).filter((point) => !points[point]);
  const normalizedWeights = normalizePointWeights(includedPoints);
  const precision = points.ascendant ? "SUN_MOON_ASCENDANT" : points.moon ? "SUN_MOON" : "SUN_ONLY";
  return {
    sun: points.sun!, ...(points.moon ? { moon: points.moon } : {}), ...(points.ascendant ? { ascendant: points.ascendant } : {}),
    element_distribution: distribution(points, normalizedWeights, (point) => point.element, ["FIRE", "EARTH", "AIR", "WATER"]),
    modality_distribution: distribution(points, normalizedWeights, (point) => point.modality, ["CARDINAL", "FIXED", "MUTABLE"]),
    data_completeness: { birth_time_known: birthTimeKnown, included_points: includedPoints, excluded_points: excludedPoints, normalized_weights: normalizedWeights },
    calculation: { engine: "astronomy-engine", engine_version: "2.1.19", timezone: "Asia/Taipei", precision, location_resolved: Boolean(location), ...(location ? { latitude: location.latitude, longitude: location.longitude } : {}) },
  };
}
