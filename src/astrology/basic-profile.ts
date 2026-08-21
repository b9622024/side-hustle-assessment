import { EclipticGeoMoon, SiderealTime, SunPosition } from "astronomy-engine";
import type { AstrologyElement, AstrologyModality } from "../scoring/types";
import type { AstrologyPlacement, AstrologyProfile } from "../report/types";
import { resolveBirthPlace } from "./locations";

const SIGNS = [
  ["ARIES", "牡羊座", "FIRE", "CARDINAL"], ["TAURUS", "金牛座", "EARTH", "FIXED"],
  ["GEMINI", "雙子座", "AIR", "MUTABLE"], ["CANCER", "巨蟹座", "WATER", "CARDINAL"],
  ["LEO", "獅子座", "FIRE", "FIXED"], ["VIRGO", "處女座", "EARTH", "MUTABLE"],
  ["LIBRA", "天秤座", "AIR", "CARDINAL"], ["SCORPIO", "天蠍座", "WATER", "FIXED"],
  ["SAGITTARIUS", "射手座", "FIRE", "MUTABLE"], ["CAPRICORN", "摩羯座", "EARTH", "CARDINAL"],
  ["AQUARIUS", "水瓶座", "AIR", "FIXED"], ["PISCES", "雙魚座", "WATER", "MUTABLE"],
] as const satisfies ReadonlyArray<readonly [string, string, AstrologyElement, AstrologyModality]>;

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
  const normalizedBirthTime = birthTime?.trim() || undefined;
  const birthTimeKnown = Boolean(normalizedBirthTime);
  const date = taiwanLocalDate(birthDate, normalizedBirthTime ?? "12:00");
  const points: Partial<Record<PointKey, AstrologyPlacement>> = { sun: placement(SunPosition(date).elon, "calculated_true_ecliptic_longitude") };
  if (birthTimeKnown) points.moon = placement(EclipticGeoMoon(date).lon, "calculated_from_exact_time");
  const birthPlaceResolution = resolveBirthPlace(birthPlace);
  const locationAvailable = birthTimeKnown && birthPlaceResolution.resolution_status === "RESOLVED";
  if (locationAvailable) points.ascendant = placement(ascendantLongitude(date, birthPlaceResolution.latitude!, birthPlaceResolution.longitude!), "calculated_from_exact_time_and_location");

  const includedPoints = (["sun", "moon", "ascendant"] as PointKey[]).filter((point) => points[point]);
  const excludedPoints = (["sun", "moon", "ascendant"] as PointKey[]).filter((point) => !points[point]);
  const normalizedWeights = normalizePointWeights(includedPoints);
  const precision = points.ascendant ? "SUN_MOON_ASCENDANT" : points.moon ? "SUN_MOON" : "SUN_ONLY";
  return {
    sun: points.sun!, ...(points.moon ? { moon: points.moon } : {}), ...(points.ascendant ? { ascendant: points.ascendant } : {}),
    element_distribution: distribution(points, normalizedWeights, (point) => point.element, ["FIRE", "EARTH", "AIR", "WATER"]),
    modality_distribution: distribution(points, normalizedWeights, (point) => point.modality, ["CARDINAL", "FIXED", "MUTABLE"]),
    data_completeness: { birth_time_known: birthTimeKnown, included_points: includedPoints, excluded_points: excludedPoints, normalized_weights: normalizedWeights },
    calculation: { engine: "astronomy-engine", engine_version: "2.1.19", timezone: "Asia/Taipei", precision, location_resolved: locationAvailable, birth_place: birthPlaceResolution, ...(locationAvailable ? { latitude: birthPlaceResolution.latitude!, longitude: birthPlaceResolution.longitude! } : {}) },
  };
}
