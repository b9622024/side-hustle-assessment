import { describe, expect, it } from "vitest";
import { calculateBasicAstrologyProfile } from "../src/astrology/basic-profile";

describe("basic astrology profile", () => {
  it.each([
    ["1989-01-17", "摩羯座", "EARTH", "CARDINAL"],
    ["2000-01-20", "水瓶座", "AIR", "FIXED"],
    ["2000-03-21", "牡羊座", "FIRE", "CARDINAL"],
    ["2000-06-21", "巨蟹座", "WATER", "CARDINAL"],
    ["2000-12-21", "射手座", "FIRE", "MUTABLE"],
    ["2000-12-22", "摩羯座", "EARTH", "CARDINAL"],
  ])("maps %s to %s", (birthDate, sign, element, modality) => {
    expect(calculateBasicAstrologyProfile(birthDate).sun).toEqual({ sign, element, modality });
  });
});
