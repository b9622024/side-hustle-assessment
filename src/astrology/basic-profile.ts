import type { AstrologyElement, AstrologyModality } from "../scoring/types";
import type { AstrologyProfile } from "../report/types";

const signs = {
  CAPRICORN: { sign: "摩羯座", element: "EARTH", modality: "CARDINAL" },
  AQUARIUS: { sign: "水瓶座", element: "AIR", modality: "FIXED" },
  PISCES: { sign: "雙魚座", element: "WATER", modality: "MUTABLE" },
  ARIES: { sign: "牡羊座", element: "FIRE", modality: "CARDINAL" },
  TAURUS: { sign: "金牛座", element: "EARTH", modality: "FIXED" },
  GEMINI: { sign: "雙子座", element: "AIR", modality: "MUTABLE" },
  CANCER: { sign: "巨蟹座", element: "WATER", modality: "CARDINAL" },
  LEO: { sign: "獅子座", element: "FIRE", modality: "FIXED" },
  VIRGO: { sign: "處女座", element: "EARTH", modality: "MUTABLE" },
  LIBRA: { sign: "天秤座", element: "AIR", modality: "CARDINAL" },
  SCORPIO: { sign: "天蠍座", element: "WATER", modality: "FIXED" },
  SAGITTARIUS: { sign: "射手座", element: "FIRE", modality: "MUTABLE" },
} as const satisfies Record<string, { sign: string; element: AstrologyElement; modality: AstrologyModality }>;

const boundaries = [
  { month: 1, day: 20, key: "AQUARIUS" },
  { month: 2, day: 19, key: "PISCES" },
  { month: 3, day: 21, key: "ARIES" },
  { month: 4, day: 20, key: "TAURUS" },
  { month: 5, day: 21, key: "GEMINI" },
  { month: 6, day: 21, key: "CANCER" },
  { month: 7, day: 23, key: "LEO" },
  { month: 8, day: 23, key: "VIRGO" },
  { month: 9, day: 23, key: "LIBRA" },
  { month: 10, day: 23, key: "SCORPIO" },
  { month: 11, day: 22, key: "SAGITTARIUS" },
  { month: 12, day: 22, key: "CAPRICORN" },
] as const;

export function calculateBasicAstrologyProfile(birthDate: string): AstrologyProfile {
  const [, monthText, dayText] = birthDate.split("-");
  const month = Number(monthText);
  const day = Number(dayText);
  if (!month || !day) throw new Error("INVALID_BIRTH_DATE");
  const boundary = boundaries.find((item) => item.month === month);
  if (!boundary) throw new Error("INVALID_BIRTH_DATE");
  const previousIndex = (month + 10) % 12;
  const key = day >= boundary.day ? boundary.key : boundaries[previousIndex]?.key;
  if (!key) throw new Error("INVALID_BIRTH_DATE");
  return { sun: signs[key] };
}
