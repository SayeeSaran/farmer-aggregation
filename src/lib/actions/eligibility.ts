"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runEligibilityAssessment } from "@/lib/services/eligibility-engine";
import { estimateCarbon } from "@/lib/services/carbon-estimation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function submitEligibilityAssessment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const farmId = formData.get("farmId") as string;
  const creditingPeriodYears = parseInt(formData.get("creditingPeriodYears") as string);
  const additionalityJustification = formData.get("additionalityJustification") as string;
  const hasOwnershipDoc = formData.get("hasOwnershipDoc") === "true";
  const selfDeclaredOwnership = formData.get("selfDeclaredOwnership") === "true";

  // Verify the farm belongs to this user
  const farm = await prisma.farm.findFirst({
    where: { id: farmId, ownerId: session.user.id },
  });
  if (!farm) return { error: "Farm not found." };

  const result = runEligibilityAssessment({
    farmId,
    yearsNonForest: farm.yearsNonForest,
    sizeHectares: farm.sizeHectares,
    landUseHistory: farm.landUseHistory,
    hasOwnershipDoc,
    selfDeclaredOwnership,
    speciesPlanned: farm.speciesPlanned,
    creditingPeriodYears,
    latitude: farm.latitude,
    longitude: farm.longitude,
    additionalityJustification,
  });

  const assessment = await prisma.eligibilityAssessment.create({
    data: {
      farmId,
      status: result.status,
      overallScore: result.overallScore,
      landHistoryScore: result.landHistoryScore,
      additionalityScore: result.additionalityScore,
      landTenureScore: result.landTenureScore,
      regionEligibility: result.regionEligibility,
      creditingPeriodYears: result.creditingPeriodYears,
      criteriaDetails: result.criteriaDetails as object,
    },
  });

  // If eligible or needs review, create a carbon estimate
  if (result.status !== "INELIGIBLE") {
    const estimate = estimateCarbon({
      sizeHectares: farm.sizeHectares,
      speciesPlanned: farm.speciesPlanned,
      creditingPeriodYears,
    });

    await prisma.carbonEstimate.create({
      data: {
        farmId,
        annualSequestrationT: estimate.annualSequestrationT,
        totalSequestrationT: estimate.totalSequestrationT,
        confidenceLevel: estimate.confidenceLevel,
        estimationInputs: estimate.inputs as object,
      },
    });
  }

  revalidatePath("/eligibility");
  revalidatePath("/dashboard");
  return { success: true, assessmentId: assessment.id };
}

export async function getAssessment(assessmentId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.eligibilityAssessment.findFirst({
    where: {
      id: assessmentId,
      farm: { ownerId: session.user.id },
    },
    include: {
      farm: {
        include: { carbonEstimates: { orderBy: { estimationDate: "desc" }, take: 1 } },
      },
    },
  });
}
