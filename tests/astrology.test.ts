import { describe, expect, it } from "vitest";
import { calculateBasicAstrologyProfile } from "../src/astrology/basic-profile";

describe("Astrology V2.1 profile", () => {
  it("calculates Sun, Moon, Ascendant and normalized distributions with Astronomy Engine", () => {
    const profile = calculateBasicAstrologyProfile("1989-01-17", "11:45", "台南市");
    expect(profile.sun.sign_name).toBe("摩羯座");
    expect(profile.moon?.sign_name).toBe("金牛座");
    expect(profile.ascendant?.sign_name).toBe("金牛座");
    expect(profile.data_completeness.included_points).toEqual(["sun", "moon", "ascendant"]);
    expect(profile.data_completeness.normalized_weights).toEqual({ sun: 0.4, moon: 0.35, ascendant: 0.25 });
    expect(Object.values(profile.element_distribution).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12);
    expect(Object.values(profile.modality_distribution).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12);
    expect(profile.calculation).toMatchObject({ engine: "astronomy-engine", engine_version: "2.1.19", precision: "SUN_MOON_ASCENDANT", location_resolved: true });
  });

  it("uses Sun only when exact birth time is unavailable", () => {
    const profile = calculateBasicAstrologyProfile("1990-02-03");
    expect(profile.moon).toBeUndefined();
    expect(profile.ascendant).toBeUndefined();
    expect(profile.data_completeness).toEqual({
      birth_time_known: false,
      included_points: ["sun"],
      excluded_points: ["moon", "ascendant"],
      normalized_weights: { sun: 1 },
    });
  });

  it("treats an empty birth time from the form as unavailable", () => {
    const profile = calculateBasicAstrologyProfile("1989-01-17", "", "台南市");

    expect(profile.data_completeness.birth_time_known).toBe(false);
    expect(profile.data_completeness.included_points).toEqual(["sun"]);
    expect(profile.moon).toBeUndefined();
    expect(profile.ascendant).toBeUndefined();
  });

  it("renormalizes Sun and Moon when the location cannot support Ascendant", () => {
    const profile = calculateBasicAstrologyProfile("1990-02-03", "10:30", "未解析地點");
    expect(profile.moon).toBeDefined();
    expect(profile.ascendant).toBeUndefined();
    expect(profile.data_completeness.normalized_weights.sun).toBeCloseTo(0.4 / 0.75, 12);
    expect(profile.data_completeness.normalized_weights.moon).toBeCloseTo(0.35 / 0.75, 12);
  });
});
