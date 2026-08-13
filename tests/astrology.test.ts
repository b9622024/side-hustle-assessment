import { describe, expect, it } from "vitest";
import { calculateBasicAstrologyProfile } from "../src/astrology/basic-profile";

describe("basic astrology profile", () => {
  it.each([
    ["1989-01-17", "摩羯座", "EARTH", "CARDINAL"],
    ["2000-01-21", "水瓶座", "AIR", "FIXED"],
    ["2000-03-21", "牡羊座", "FIRE", "CARDINAL"],
    ["2000-06-21", "巨蟹座", "WATER", "CARDINAL"],
    ["2000-12-21", "射手座", "FIRE", "MUTABLE"],
    ["2000-12-22", "摩羯座", "EARTH", "CARDINAL"],
  ])("maps %s to %s", (birthDate, sign, element, modality) => {
    expect(calculateBasicAstrologyProfile(birthDate).sun).toMatchObject({ sign, element, modality });
  });

  it.each([
    ["1989-01-17","11:45","台南市","摩羯座","金牛座","金牛座"],
    ["1990-04-10","22:01","台北市","牡羊座","天秤座","射手座"],
    ["1996-08-19","09:26","台中市","獅子座","天秤座","天秤座"],
  ])("calculates Sun/Moon/Ascendant for %s %s",(date,time,place,sun,moon,ascendant)=>{
    const profile=calculateBasicAstrologyProfile(date,time,place);
    expect(profile.sun.sign).toBe(sun);
    expect(profile.moon?.sign).toBe(moon);
    expect(profile.ascendant?.sign).toBe(ascendant);
    expect(profile.calculation?.location_resolved).toBe(true);
  });

  it("renormalizes available points instead of treating missing points as zero",()=>{
    const sunOnly=calculateBasicAstrologyProfile("1989-01-17");
    expect(sunOnly.moon).toBeUndefined();
    expect(sunOnly.ascendant).toBeUndefined();
    expect(sunOnly.calculation?.precision).toBe("SUN_ONLY");
  });
});
