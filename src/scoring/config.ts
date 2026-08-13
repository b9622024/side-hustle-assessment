import source from "./config/side-hustle-scoring-v2-rc1.json" with { type: "json" };

// Compatibility aliases keep existing report UI readable while the immutable
// FULL CONFIG remains the only source for every scoring value.
export const config = {
  ...source,
  meta: {
    ...source.meta,
    scoring_engine_version: source.meta.config_version,
    routing_rule_version: source.meta.config_version,
    questionnaire_version: "side-hustle-behavior-10q-1.0.0",
    base_config_version: "side-hustle-scoring-config-1.0.0",
  },
  type_formulas: source.formal_type_engine.type_formulas,
  frictions: source.client_metrics.frictions,
  execution_spectrums: source.client_metrics.execution_spectrums,
  dimension_normalization: {
    min: 1,
    max: 5,
    computed_max_raw_v1: source.formal_behavior_dimension_scoring.v1_normalization.computed_max_raw,
  },
  business_fit: {
    ...source.business_fit,
    levels: [
      { key: "HIGH", label: "高適配", min: 4, max: 5 },
      { key: "MEDIUM", label: "中度適配", min: 3.4, max: 3.999999999999 },
      { key: "LOW", label: "低適配", min: 1, max: 3.399999999999 },
    ],
  },
};
export type ScoringConfig = typeof config;

export const CONFIG_GAPS = {
  astrologyTypeMatrix: false,
  numerologyTypeMatrix: false,
} as const;
