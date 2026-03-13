"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { farmSchema } from "@/lib/utils/validators";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createFarm(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const raw = {
    name: formData.get("name"),
    latitude: parseFloat(formData.get("latitude") as string),
    longitude: parseFloat(formData.get("longitude") as string),
    sizeHectares: parseFloat(formData.get("sizeHectares") as string),
    landUseHistory: formData.get("landUseHistory"),
    yearsNonForest: parseInt(formData.get("yearsNonForest") as string),
    currentVegetation: formData.get("currentVegetation") || undefined,
    speciesPlanned: JSON.parse((formData.get("speciesPlanned") as string) || "[]"),
    ownershipDocUrl: formData.get("ownershipDocUrl") || undefined,
  };

  const parsed = farmSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const farm = await prisma.farm.create({
    data: {
      ...parsed.data,
      ownerId: session.user.id,
      ownershipDocUrl: parsed.data.ownershipDocUrl || null,
    },
  });

  revalidatePath("/farms");
  revalidatePath("/dashboard");
  return { success: true, farmId: farm.id };
}

export async function getMyFarms() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.farm.findMany({
    where: { ownerId: session.user.id },
    include: {
      eligibilityAssessments: { orderBy: { assessedAt: "desc" }, take: 1 },
      poolMemberships: { where: { isActive: true }, include: { pool: true } },
      _count: { select: { farmerReports: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllFarms() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "AGGREGATOR", "VERIFIER"].includes(session.user.role)) {
    return [];
  }

  return prisma.farm.findMany({
    include: {
      owner: { select: { name: true, email: true } },
      eligibilityAssessments: { orderBy: { assessedAt: "desc" }, take: 1 },
      poolMemberships: { where: { isActive: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
