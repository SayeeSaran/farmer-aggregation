/**
 * MVP Eligibility Engine — VM0047 v1.1 Pre-Screening
 *
 * Uses hard exclusions + soft flags (not percentage scoring).
 * Output: ELIGIBLE | NEEDS_REVIEW | INELIGIBLE
 */

export type CriterionStatus = "pass" | "flag" | "fail";

export interface CriterionResult {
  key: string;
  status: CriterionStatus;
  label: string;
  reason: string;
}

export type EligibilityVerdict = "ELIGIBLE" | "NEEDS_REVIEW" | "INELIGIBLE";

export interface QuestionnaireData {
  // Section 1 — Basic Info
  country: string;
  landAreaHa: number;
  activityType: "direct_planting" | "direct_seeding" | "assisted_regeneration" | "not_sure";

  // Section 2 — Land History (VM0047 §4.4.1, §4.4.2)
  managedForest: "yes" | "no" | "not_sure";
  timberHarvest: "yes" | "no" | "not_sure";
  woodyBiomassRemoval: "yes" | "no" | "not_sure";
  preExistingCover: "below_10" | "10_to_30" | "above_30" | "not_sure";

  // Section 3 — Land Tenure
  ownershipType: "owned" | "leased" | "communal" | "government" | "other";
  documentedRights: boolean;
  creditingPeriod: "less_than_20" | "20_to_30" | "30_to_50" | "50_plus";
  regulatorySurplus: "yes" | "no" | "not_sure";

  // Section 4 — Planting Design
  treeDensity: number;
  landUseContinuity: "yes" | "no" | "unsure";

  // Section 5 — Carbon Estimate Inputs
  speciesTypes: string[];  // Multiple species allowed
  climateZone: "tropical" | "subtropical" | "temperate" | "arid";
}

export interface EligibilityResult {
  verdict: EligibilityVerdict;
  criteria: CriterionResult[];
  approach: "census" | "area";
  creditingPeriodYears: number;
}

function getCreditingYears(period: QuestionnaireData["creditingPeriod"]): number {
  switch (period) {
    case "less_than_20": return 15;
    case "20_to_30": return 25;
    case "30_to_50": return 40;
    case "50_plus": return 50;
  }
}

export function runMvpEligibility(data: QuestionnaireData): EligibilityResult {
  const criteria: CriterionResult[] = [];

  // ── Land History (hard exclusions per VM0047 §4.4.1, §4.4.2) ──

  const landHistoryExclusions = [
    data.managedForest,
    data.timberHarvest,
    data.woodyBiomassRemoval,
  ];

  const hasHardExclusion = landHistoryExclusions.includes("yes");
  const hasUncertainHistory = landHistoryExclusions.includes("not_sure");

  criteria.push({
    key: "landHistory",
    status: hasHardExclusion ? "fail" : hasUncertainHistory ? "flag" : "pass",
    label: "results.criteria.landHistory",
    reason: hasHardExclusion
      ? "results.criteria.landHistoryFail"
      : hasUncertainHistory
        ? "results.criteria.landHistoryFlag"
        : "results.criteria.landHistoryPass",
  });

  // ── Pre-existing Woody Biomass Cover (VM0047 §6.2) ──
  // The project area must have <10% canopy cover to qualify as non-forest.
  // 10–30% is a flag; >30% is a hard exclusion (it's already forest).

  let coverStatus: CriterionStatus;
  if (data.preExistingCover === "below_10") {
    coverStatus = "pass";
  } else if (data.preExistingCover === "above_30") {
    coverStatus = "fail";
  } else {
    // 10_to_30 or not_sure → needs review
    coverStatus = "flag";
  }

  criteria.push({
    key: "preExistingCover",
    status: coverStatus,
    label: "results.criteria.preExistingCover",
    reason: coverStatus === "pass"
      ? "results.criteria.preExistingCoverPass"
      : coverStatus === "fail"
        ? "results.criteria.preExistingCoverFail"
        : "results.criteria.preExistingCoverFlag",
  });

  // ── Land Tenure ──

  const tenureWeak = data.ownershipType === "other" || data.ownershipType === "communal";
  const tenureStrong = data.ownershipType === "owned" || data.ownershipType === "leased" || data.ownershipType === "government";
  const hasDocuments = data.documentedRights;

  let tenureStatus: CriterionStatus;
  if (tenureStrong && hasDocuments) {
    tenureStatus = "pass";
  } else if (tenureWeak && !hasDocuments) {
    tenureStatus = "fail";
  } else {
    tenureStatus = "flag";
  }

  criteria.push({
    key: "landTenure",
    status: tenureStatus,
    label: "results.criteria.landTenure",
    reason: tenureStatus === "pass"
      ? "results.criteria.landTenurePass"
      : tenureStatus === "fail"
        ? "results.criteria.landTenureFail"
        : "results.criteria.landTenureFlag",
  });

  // ── Crediting Period ──

  const creditingYears = getCreditingYears(data.creditingPeriod);
  const creditingOk = creditingYears >= 20;

  criteria.push({
    key: "creditingPeriod",
    status: creditingOk ? "pass" : "fail",
    label: "results.criteria.creditingPeriod",
    reason: creditingOk
      ? "results.criteria.creditingPeriodPass"
      : "results.criteria.creditingPeriodFail",
  });

  // ── Regulatory Surplus (VM0047 §7.3.1) ──
  // The project must not be required by existing laws or regulations.
  // "yes" = the planting IS required by law → fail
  // "no" = the planting is voluntary → pass
  // "not_sure" → flag for review

  let regulatoryStatus: CriterionStatus;
  if (data.regulatorySurplus === "no") {
    regulatoryStatus = "pass";
  } else if (data.regulatorySurplus === "yes") {
    regulatoryStatus = "fail";
  } else {
    regulatoryStatus = "flag";
  }

  criteria.push({
    key: "regulatorySurplus",
    status: regulatoryStatus,
    label: "results.criteria.regulatorySurplus",
    reason: regulatoryStatus === "pass"
      ? "results.criteria.regulatorySurplusPass"
      : regulatoryStatus === "fail"
        ? "results.criteria.regulatorySurplusFail"
        : "results.criteria.regulatorySurplusFlag",
  });

  // ── Planting Design ──

  let plantingStatus: CriterionStatus;
  if (data.landUseContinuity === "yes") {
    plantingStatus = "pass";
  } else if (data.landUseContinuity === "no") {
    plantingStatus = "fail";
  } else {
    plantingStatus = "flag";
  }

  criteria.push({
    key: "plantingDesign",
    status: plantingStatus,
    label: "results.criteria.plantingDesign",
    reason: plantingStatus === "pass"
      ? "results.criteria.plantingDesignPass"
      : plantingStatus === "fail"
        ? "results.criteria.plantingDesignFail"
        : "results.criteria.plantingDesignFlag",
  });

  // ── Determine monitoring approach ──

  // VM0047 §4.3: census-based applies only to direct planting with ≤50 planting units/ha
  const approach: "census" | "area" =
    data.treeDensity <= 50 && data.activityType === "direct_planting" ? "census" : "area";

  // ── Final verdict ──

  const hasFail = criteria.some((c) => c.status === "fail");
  const hasFlag = criteria.some((c) => c.status === "flag");

  let verdict: EligibilityVerdict;
  if (hasFail) {
    verdict = "INELIGIBLE";
  } else if (hasFlag) {
    verdict = "NEEDS_REVIEW";
  } else {
    verdict = "ELIGIBLE";
  }

  return {
    verdict,
    criteria,
    approach,
    creditingPeriodYears: creditingYears,
  };
}
