import { UserRole, EligibilityStatus, PoolStatus, PoolType, LandUseHistory, ReportType, VerificationStatus } from "@prisma/client";

export type { UserRole, EligibilityStatus, PoolStatus, PoolType, LandUseHistory, ReportType, VerificationStatus };

export interface EligibilityCriterion {
  passed: boolean;
  score: number;
  weight: number;
  reason: string;
}

export interface EligibilityResult {
  status: EligibilityStatus;
  overallScore: number;
  landHistoryScore: number;
  additionalityScore: number;
  landTenureScore: number;
  regionEligibility: boolean;
  creditingPeriodYears: number;
  criteriaDetails: Record<string, EligibilityCriterion>;
}

export interface EligibilityInput {
  farmId: string;
  yearsNonForest: number;
  sizeHectares: number;
  landUseHistory: LandUseHistory;
  hasOwnershipDoc: boolean;
  selfDeclaredOwnership: boolean;
  speciesPlanned: string[];
  creditingPeriodYears: number;
  latitude: number;
  longitude: number;
  additionalityJustification: string;
}

export interface PoolStats {
  memberCount: number;
  totalHectares: number;
  estimatedCredits: number;
}

export interface PhotoEvidence {
  url: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  verified: boolean;
  distanceFromFarm?: number;
}

export interface CarbonEstimationInput {
  sizeHectares: number;
  speciesPlanned: string[];
  creditingPeriodYears: number;
  regionClimateZone?: string;
  ndviValue?: number;
}

// Extend next-auth types
declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// JWT types extended via next-auth session strategy callbacks in auth.config.ts

