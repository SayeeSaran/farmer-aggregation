"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { farmerReportSchema } from "@/lib/utils/validators";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitFarmerReport(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const raw = {
    farmId: formData.get("farmId"),
    reportType: formData.get("reportType"),
    description: formData.get("description") || undefined,
    speciesPlanted: JSON.parse((formData.get("speciesPlanted") as string) || "[]"),
    areaPlantedHa: formData.get("areaPlantedHa")
      ? parseFloat(formData.get("areaPlantedHa") as string)
      : undefined,
    survivalRate: formData.get("survivalRate")
      ? parseFloat(formData.get("survivalRate") as string)
      : undefined,
  };

  const parsed = farmerReportSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Verify farm belongs to user
  const farm = await prisma.farm.findFirst({
    where: { id: parsed.data.farmId, ownerId: session.user.id },
  });
  if (!farm) return { error: "Farm not found." };

  const report = await prisma.farmerReport.create({
    data: {
      farmId: parsed.data.farmId,
      reporterId: session.user.id,
      reportType: parsed.data.reportType,
      description: parsed.data.description,
      speciesPlanted: parsed.data.speciesPlanted,
      areaPlantedHa: parsed.data.areaPlantedHa,
      survivalRate: parsed.data.survivalRate,
      photos: [],
    },
  });

  // Create a pending verification record
  await prisma.verificationRecord.create({
    data: {
      verifierId: session.user.id, // Will be reassigned to a verifier
      farmerReportId: report.id,
      status: "PENDING",
    },
  });

  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { success: true, reportId: report.id };
}

export async function getMyReports() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.farmerReport.findMany({
    where: { reporterId: session.user.id },
    include: {
      farm: { select: { name: true } },
      verificationRecords: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { reportDate: "desc" },
  });
}

export async function getPendingVerifications() {
  const session = await auth();
  if (!session?.user || !["VERIFIER", "ADMIN"].includes(session.user.role)) return [];

  return prisma.verificationRecord.findMany({
    where: { status: "PENDING" },
    include: {
      farmerReport: {
        include: {
          farm: { select: { name: true, latitude: true, longitude: true } },
          reporter: { select: { name: true } },
        },
      },
      monitoringReport: {
        include: { farm: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function verifyRecord(
  recordId: string,
  status: "APPROVED" | "REJECTED" | "FLAGGED",
  findings: string
) {
  const session = await auth();
  if (!session?.user || !["VERIFIER", "ADMIN"].includes(session.user.role)) {
    return { error: "Unauthorized." };
  }

  await prisma.verificationRecord.update({
    where: { id: recordId },
    data: {
      status,
      findings,
      verifierId: session.user.id,
      verifiedAt: new Date(),
      anomaliesDetected: status === "FLAGGED",
    },
  });

  revalidatePath("/verification");
  return { success: true };
}
