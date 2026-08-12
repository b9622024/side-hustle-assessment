import rawConfig from "./config/side-hustle-scoring-config-1.0.0.json" with { type: "json" };

export const config = rawConfig;
export type ScoringConfig = typeof config;

export const CONFIG_GAPS = {
  astrologyTypeMatrix: !("astrology_type_matrix" in config),
  numerologyTypeMatrix: !("numerology_type_matrix" in config),
} as const;
