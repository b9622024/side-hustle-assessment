import rawConfig from "./config/side-hustle-scoring-config-1.0.0.json" with { type: "json" };
import calibration from "./config/side-hustle-calibration-1.0.1.json" with { type: "json" };

export const config = { ...rawConfig, meta: { ...rawConfig.meta, ...calibration.meta }, astrology_type_matrix: calibration.astrology_type_matrix, numerology_type_matrix: calibration.numerology_type_matrix, business_fit_calibration: calibration.business_fit_calibration, routing_calibration: calibration.routing_calibration };
export type ScoringConfig = typeof config;

export const CONFIG_GAPS = {
  astrologyTypeMatrix: false,
  numerologyTypeMatrix: false,
} as const;
