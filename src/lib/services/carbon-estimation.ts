import { CARBON, SPECIES_MULTIPLIERS } from "@/lib/utils/constants";
import type { CarbonEstimationInput } from "@/types";

function getClimateMultiplier(zone?: string): number {
  const z = zone?.toLowerCase() ?? "default";
  if (z.includes("tropical")) return CARBON.BIOMASS_GROWTH_RATE.TROPICAL;
  if (z.includes("subtropical")) return CARBON.BIOMASS_GROWTH_RATE.SUBTROPICAL;
  if (z.includes("temperate")) return CARBON.BIOMASS_GROWTH_RATE.TEMPERATE;
  return CARBON.BIOMASS_GROWTH_RATE.DEFAULT;
}

function getSpeciesMultiplier(species: string[]): number {
  if (species.length === 0) return SPECIES_MULTIPLIERS.default;
  const avg =
    species.reduce((sum, s) => {
      const key = s.toLowerCase().split(" ")[0];
      return sum + (SPECIES_MULTIPLIERS[key] ?? SPECIES_MULTIPLIERS.default);
    }, 0) / species.length;
  return avg;
}

/**
 * Estimate carbon sequestration using a simplified VM0047 allometric approach.
 * Returns annual and total CO2e values in tonnes.
 */
export function estimateCarbon(input: CarbonEstimationInput): {
  annualSequestrationT: number;
  totalSequestrationT: number;
  confidenceLevel: number;
  inputs: CarbonEstimationInput;
} {
  const baseGrowthRate = getClimateMultiplier(input.regionClimateZone); // tC/ha/year
  const speciesMultiplier = getSpeciesMultiplier(input.speciesPlanned);

  // NDVI modifier: higher NDVI = better existing conditions = slightly better growth
  const ndviModifier = input.ndviValue != null ? 1 + (input.ndviValue - 0.3) * 0.2 : 1.0;

  // Above-ground biomass annual increment (tDM/ha/year)
  const agbGrowthRate = baseGrowthRate * speciesMultiplier * ndviModifier;

  // Below-ground biomass
  const bgbGrowthRate = agbGrowthRate * CARBON.ROOT_SHOOT_RATIO;

  // Total biomass growth (tDM/ha/year)
  const totalBiomassRate = agbGrowthRate + bgbGrowthRate;

  // Carbon stock increment (tC/ha/year)
  const carbonRate = totalBiomassRate * CARBON.CARBON_FRACTION;

  // CO2e (tCO2e/ha/year)
  const co2eRate = carbonRate * CARBON.CO2_FACTOR;

  const annualSequestrationT = co2eRate * input.sizeHectares;
  const totalSequestrationT = annualSequestrationT * input.creditingPeriodYears;

  // Confidence level based on input completeness
  let confidence = 60;
  if (input.ndviValue != null) confidence += 15;
  if (input.speciesPlanned.length > 0) confidence += 15;
  if (input.regionClimateZone) confidence += 10;

  return {
    annualSequestrationT: Math.round(annualSequestrationT * 100) / 100,
    totalSequestrationT: Math.round(totalSequestrationT * 100) / 100,
    confidenceLevel: Math.min(confidence, 95),
    inputs: input,
  };
}
