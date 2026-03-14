"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPoolSchema } from "@/lib/utils/validators";
import { runAutoPooling } from "@/lib/services/auto-pooling";
import { estimateCarbon } from "@/lib/services/carbon-estimation";
import { revalidatePath } from "next/cache";

export async function createPool(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !["AGGREGATOR", "ADMIN"].includes(session.user.role)) {
    return { error: "Unauthorized." };
  }

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    type: formData.get("type") || "MANAGED",
    regionName: formData.get("regionName") || undefined,
    minHectares: parseFloat((formData.get("minHectares") as string) || "0"),
    maxMembers: formData.get("maxMembers") ? parseInt(formData.get("maxMembers") as string) : undefined,
  };

  const parsed = createPoolSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const pool = await prisma.pool.create({
    data: {
      ...parsed.data,
      managerId: session.user.id,
    },
  });

  revalidatePath("/pools");
  return { success: true, poolId: pool.id };
}

export async function joinPool(poolId: string, farmId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized." };

  // Verify farm belongs to user and is eligible
  const farm = await prisma.farm.findFirst({
    where: {
      id: farmId,
      ownerId: session.user.id,
      eligibilityAssessments: { some: { status: { in: ["ELIGIBLE", "NEEDS_REVIEW"] } } },
    },
  });
  if (!farm) return { error: "Farm not found or not eligible." };

  // Check farm isn't already in this pool
  const existing = await prisma.poolMembership.findUnique({
    where: { poolId_farmId: { poolId, farmId } },
  });
  if (existing?.isActive) return { error: "Farm is already a member of this pool." };

  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool || pool.status === "CLOSED") return { error: "Pool is not accepting members." };

  if (existing) {
    await prisma.poolMembership.update({ where: { id: existing.id }, data: { isActive: true } });
  } else {
    await prisma.poolMembership.create({ data: { poolId, farmId } });
  }

  // Recalculate pool totals
  const members = await prisma.poolMembership.findMany({
    where: { poolId, isActive: true },
    include: { farm: { include: { carbonEstimates: { take: 1, orderBy: { estimationDate: "desc" } } } } },
  });

  const totalHectares = members.reduce((s, m) => s + m.farm.sizeHectares, 0);
  const estimate = estimateCarbon({ sizeHectares: totalHectares, speciesPlanned: [], creditingPeriodYears: 30 });

  await prisma.pool.update({
    where: { id: poolId },
    data: { totalHectares, estimatedCredits: estimate.totalSequestrationT },
  });

  revalidatePath(`/pools/${poolId}`);
  revalidatePath("/pools");
  return { success: true };
}

export async function leavePool(poolId: string, farmId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized." };

  const farm = await prisma.farm.findFirst({ where: { id: farmId, ownerId: session.user.id } });
  if (!farm) return { error: "Farm not found." };

  await prisma.poolMembership.updateMany({
    where: { poolId, farmId },
    data: { isActive: false },
  });

  const members = await prisma.poolMembership.findMany({
    where: { poolId, isActive: true },
    include: { farm: true },
  });
  const totalHectares = members.reduce((s, m) => s + m.farm.sizeHectares, 0);
  await prisma.pool.update({ where: { id: poolId }, data: { totalHectares } });

  revalidatePath(`/pools/${poolId}`);
  return { success: true };
}

export async function triggerAutoPooling() {
  const session = await auth();
  if (!session?.user || !["ADMIN"].includes(session.user.role)) return { error: "Admin only." };

  const result = await runAutoPooling();
  revalidatePath("/pools");
  return result;
}

export async function getPools(filters?: { status?: string; type?: string }) {
  return prisma.pool.findMany({
    where: {
      status: filters?.status ? (filters.status as never) : undefined,
      type: filters?.type ? (filters.type as never) : undefined,
    },
    include: {
      manager: { select: { name: true } },
      _count: { select: { memberships: true } },
      memberships: { where: { isActive: true }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPoolDetail(poolId: string) {
  return prisma.pool.findUnique({
    where: { id: poolId },
    include: {
      manager: { select: { name: true, email: true } },
      memberships: {
        where: { isActive: true },
        include: {
          farm: {
            include: {
              owner: { select: { name: true } },
              eligibilityAssessments: { orderBy: { assessedAt: "desc" }, take: 1 },
            },
          },
        },
      },
      carbonEstimates: { orderBy: { estimationDate: "desc" }, take: 1 },
    },
  });
}
