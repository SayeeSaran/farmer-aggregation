import { prisma } from "@/lib/prisma";
import { clusterByDistance, centroid } from "@/lib/utils/geo";
import { POOL } from "@/lib/utils/constants";

/**
 * Find all eligible farms not already in a pool and group them by proximity.
 * Creates AUTO_REGIONAL pools for qualifying clusters.
 */
export async function runAutoPooling(
  radiusKm: number = POOL.AUTO_RADIUS_KM,
  minPoolHectares: number = POOL.MIN_POOL_HECTARES
): Promise<{ created: number; message: string }> {
  // Get eligible farms not in any active pool
  const eligibleFarms = await prisma.farm.findMany({
    where: {
      eligibilityAssessments: {
        some: { status: { in: ["ELIGIBLE", "NEEDS_REVIEW"] } },
      },
      poolMemberships: {
        none: { isActive: true },
      },
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      sizeHectares: true,
      name: true,
    },
  });

  if (eligibleFarms.length === 0) {
    return { created: 0, message: "No eligible unassigned farms found." };
  }

  const clusters = clusterByDistance(eligibleFarms, radiusKm);
  let created = 0;

  for (const cluster of clusters) {
    const totalHa = cluster.reduce((s, f) => s + f.sizeHectares, 0);
    if (totalHa < minPoolHectares || cluster.length < 2) continue;

    const center = centroid(cluster);

    const pool = await prisma.pool.create({
      data: {
        name: `Auto Pool – ${center.latitude.toFixed(2)}°N ${center.longitude.toFixed(2)}°E`,
        type: "AUTO_REGIONAL",
        status: "FORMING",
        regionName: `Cluster near ${center.latitude.toFixed(1)}, ${center.longitude.toFixed(1)}`,
        totalHectares: totalHa,
        memberships: {
          create: cluster.map((farm) => ({ farmId: farm.id })),
        },
      },
    });

    // Estimate carbon for the pool
    const { estimateCarbon } = await import("./carbon-estimation");
    const estimate = estimateCarbon({
      sizeHectares: totalHa,
      speciesPlanned: [],
      creditingPeriodYears: 30,
    });

    await prisma.pool.update({
      where: { id: pool.id },
      data: { estimatedCredits: estimate.totalSequestrationT },
    });

    created++;
  }

  return {
    created,
    message: `Auto-pooling complete. Created ${created} new regional pool(s) from ${eligibleFarms.length} eligible farms.`,
  };
}
