import { EligibilityStatus, LandUseHistory } from "@prisma/client";
import type { EligibilityInput, EligibilityResult, EligibilityCriterion } from "@/types";
import { VM0047 } from "@/lib/utils/constants";

// Regions where ARR projects are commonly eligible (bounding boxes)
// These are simplified; a real implementation would use proper GeoJSON boundaries
const ELIGIBLE_REGIONS = [
  { name: "Southeast Asia", minLat: -11, maxLat: 28, minLng: 92, maxLng: 141 },
  { name: "Sub-Saharan Africa", minLat: -35, maxLat: 15, minLng: -18, maxLng: 52 },
  { name: "South America", minLat: -56, maxLat: 12, minLng: -82, maxLng: -34 },
  { name: "South Asia", minLat: 6, maxLat: 37, minLng: 60, maxLng: 97 },
  { name: "Central America", minLat: 7, maxLat: 22, minLng: -92, maxLng: -77 },
];

function checkRegionEligibility(lat: number, lng: number): boolean {
  return ELIGIBLE_REGIONS.some(
    (r) => lat >= r.minLat && lat <= r.maxLat && lng >= r.minLng && lng <= r.maxLng
  );
}

function scoreLandHistory(yearsNonForest: number): EligibilityCriterion {
  const passed = yearsNonForest >= VM0047.MIN_YEARS_NON_FOREST;
  return {
    passed,
    score: passed ? 100 : Math.max(0, (yearsNonForest / VM0047.MIN_YEARS_NON_FOREST) * 60),
    weight: VM0047.WEIGHTS.LAND_HISTORY,
    reason: passed
      ? `Land has been non-forest for ${yearsNonForest} years (≥10 required by VM0047)`
      : `Land has only been non-forest for ${yearsNonForest} years. VM0047 requires at least 10 years.`,
  };
}

function scoreAdditionality(
  justification: string,
  sizeHectares: number,
  landUseHistory: LandUseHistory
): EligibilityCriterion {
  let score = 0;

  // Score justification quality (keyword analysis for MVP)
  const keywords = [
    "financial", "barrier", "incentive", "without", "would not", "economic",
    "poverty", "income", "subsistence", "degraded", "deforestation", "pressure",
  ];
  const lowerJust = justification.toLowerCase();
  const keywordHits = keywords.filter((k) => lowerJust.includes(k)).length;
  score += Math.min(50, keywordHits * 8);

  // Small farms are generally more likely to be additional
  if (sizeHectares <= 5) score += 25;
  else if (sizeHectares <= 20) score += 15;
  else if (sizeHectares <= 50) score += 5;

  // Degraded/barren land is more likely additional
  if (landUseHistory === "DEGRADED" || landUseHistory === "BARREN") score += 25;
  else if (landUseHistory === "GRASSLAND" || landUseHistory === "SHRUBLAND") score += 10;

  score = Math.min(100, score);

  return {
    passed: score >= 50,
    score,
    weight: VM0047.WEIGHTS.ADDITIONALITY,
    reason:
      score >= 75
        ? "Strong additionality evidence: financial barriers and land conditions support that this project would not occur without carbon finance."
        : score >= 50
        ? "Moderate additionality evidence. A more detailed barrier analysis will be required during formal validation."
        : "Insufficient additionality justification. Please provide more detail on financial, institutional, or barrier analysis.",
  };
}

function scoreLandTenure(hasOwnershipDoc: boolean, selfDeclared: boolean): EligibilityCriterion {
  const score = hasOwnershipDoc ? 100 : selfDeclared ? 50 : 0;
  return {
    passed: score > 0,
    score,
    weight: VM0047.WEIGHTS.LAND_TENURE,
    reason: hasOwnershipDoc
      ? "Ownership documentation provided. Land tenure is established."
      : selfDeclared
      ? "Self-declared ownership. Official documentation (title deed, lease agreement) will be required for formal registration."
      : "No ownership evidence provided. VM0047 requires clear land tenure rights.",
  };
}

function scoreRegionEligibility(lat: number, lng: number): EligibilityCriterion {
  const eligible = checkRegionEligibility(lat, lng);
  return {
    passed: eligible,
    score: eligible ? 100 : 0,
    weight: VM0047.WEIGHTS.REGION_ELIGIBILITY,
    reason: eligible
      ? "Location is within a recognised eligible region for ARR projects under VM0047."
      : "Location may not be within a pre-defined eligible region. A region-specific eligibility assessment will be required.",
  };
}

function scoreCreditingPeriod(years: number): EligibilityCriterion {
  const passed = years >= VM0047.MIN_CREDITING_PERIOD && years <= VM0047.MAX_CREDITING_PERIOD;
  return {
    passed,
    score: passed ? 100 : 0,
    weight: VM0047.WEIGHTS.CREDITING_PERIOD,
    reason: passed
      ? `Crediting period of ${years} years is within the VM0047 allowable range (20–100 years).`
      : `Crediting period of ${years} years is outside the allowed range. VM0047 requires 20–100 years.`,
  };
}

export function runEligibilityAssessment(input: EligibilityInput): EligibilityResult {
  const landHistory = scoreLandHistory(input.yearsNonForest);
  const additionality = scoreAdditionality(
    input.additionalityJustification,
    input.sizeHectares,
    input.landUseHistory
  );
  const landTenure = scoreLandTenure(input.hasOwnershipDoc, input.selfDeclaredOwnership);
  const region = scoreRegionEligibility(input.latitude, input.longitude);
  const crediting = scoreCreditingPeriod(input.creditingPeriodYears);

  // Weighted overall score
  const overallScore =
    (landHistory.score * landHistory.weight +
      additionality.score * additionality.weight +
      landTenure.score * landTenure.weight +
      region.score * region.weight +
      crediting.score * crediting.weight) /
    100;

  // Mandatory pass criteria (land history and crediting period are binary)
  const mandatoryPassed = landHistory.passed && crediting.passed && landTenure.passed;

  let status: EligibilityStatus;
  if (!mandatoryPassed || overallScore < VM0047.NEEDS_REVIEW_SCORE_THRESHOLD) {
    status = "INELIGIBLE";
  } else if (overallScore >= VM0047.ELIGIBLE_SCORE_THRESHOLD && mandatoryPassed) {
    status = "ELIGIBLE";
  } else {
    status = "NEEDS_REVIEW";
  }

  return {
    status,
    overallScore: Math.round(overallScore * 10) / 10,
    landHistoryScore: landHistory.score,
    additionalityScore: additionality.score,
    landTenureScore: landTenure.score,
    regionEligibility: region.passed,
    creditingPeriodYears: input.creditingPeriodYears,
    criteriaDetails: {
      landHistory,
      additionality,
      landTenure,
      regionEligibility: region,
      creditingPeriod: crediting,
    },
  };
}
