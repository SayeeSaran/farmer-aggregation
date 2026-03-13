// VM0047 eligibility thresholds
export const VM0047 = {
  MIN_YEARS_NON_FOREST: 10,
  MIN_CREDITING_PERIOD: 20,
  MAX_CREDITING_PERIOD: 100,
  ELIGIBLE_SCORE_THRESHOLD: 70,
  NEEDS_REVIEW_SCORE_THRESHOLD: 50,

  // Scoring weights (must sum to 100)
  WEIGHTS: {
    LAND_HISTORY: 30,
    ADDITIONALITY: 25,
    LAND_TENURE: 20,
    REGION_ELIGIBILITY: 15,
    CREDITING_PERIOD: 10,
  },
} as const;

// NDVI classification thresholds
export const NDVI = {
  BARREN: 0.1,
  SPARSE: 0.2,
  MODERATE: 0.4,
  DENSE: 0.6,
} as const;

export function classifyNdvi(value: number): string {
  if (value < NDVI.BARREN) return "Barren";
  if (value < NDVI.SPARSE) return "Sparse vegetation";
  if (value < NDVI.MODERATE) return "Moderate vegetation";
  if (value < NDVI.DENSE) return "Dense vegetation";
  return "Very dense vegetation";
}

// Pool settings
export const POOL = {
  AUTO_RADIUS_KM: 50,
  MIN_POOL_HECTARES: 5,
  SMALL_FARM_THRESHOLD_HA: 5, // farms <= this are considered "small"
} as const;

// Carbon estimation constants (simplified VM0047 allometric model)
export const CARBON = {
  // Average above-ground biomass growth rate (tC/ha/year) by climate zone
  BIOMASS_GROWTH_RATE: {
    TROPICAL: 4.5,
    SUBTROPICAL: 3.2,
    TEMPERATE: 2.1,
    DEFAULT: 3.0,
  },
  // Root-to-shoot ratio
  ROOT_SHOOT_RATIO: 0.26,
  // Carbon fraction of dry biomass
  CARBON_FRACTION: 0.47,
  // CO2 to C conversion factor
  CO2_FACTOR: 44 / 12,
} as const;

// Common plantation species and their biomass growth multipliers
export const SPECIES_MULTIPLIERS: Record<string, number> = {
  teak: 1.2,
  eucalyptus: 1.5,
  acacia: 1.3,
  bamboo: 1.8,
  mangrove: 1.1,
  pine: 1.0,
  mahogany: 0.9,
  rubber: 0.8,
  default: 1.0,
};
