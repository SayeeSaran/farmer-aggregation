import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  const password = await bcrypt.hash("password123", 12);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@carbonfarm.io" },
    update: {},
    create: { name: "Admin User", email: "admin@carbonfarm.io", hashedPassword: password, role: "ADMIN" },
  });

  const aggregator = await prisma.user.upsert({
    where: { email: "aggregator@carbonfarm.io" },
    update: {},
    create: { name: "Maria Santos", email: "aggregator@carbonfarm.io", hashedPassword: password, role: "AGGREGATOR" },
  });

  const verifier = await prisma.user.upsert({
    where: { email: "verifier@carbonfarm.io" },
    update: {},
    create: { name: "Dr. Ahmad Zaki", email: "verifier@carbonfarm.io", hashedPassword: password, role: "VERIFIER" },
  });

  const farmer1 = await prisma.user.upsert({
    where: { email: "juan@example.com" },
    update: {},
    create: { name: "Juan Dela Cruz", email: "juan@example.com", hashedPassword: password, role: "FARMER" },
  });

  const farmer2 = await prisma.user.upsert({
    where: { email: "budi@example.com" },
    update: {},
    create: { name: "Budi Santoso", email: "budi@example.com", hashedPassword: password, role: "FARMER" },
  });

  // Farms
  const farm1 = await prisma.farm.upsert({
    where: { id: "farm-1" },
    update: {},
    create: {
      id: "farm-1",
      name: "Dela Cruz Agroforestry",
      ownerId: farmer1.id,
      latitude: 7.9231,
      longitude: 125.0954,
      sizeHectares: 3.5,
      landUseHistory: "DEGRADED",
      yearsNonForest: 15,
      currentVegetation: "Sparse cogon grass, some shrubs",
      speciesPlanned: ["Teak", "Mahogany", "Bamboo"],
    },
  });

  const farm2 = await prisma.farm.upsert({
    where: { id: "farm-2" },
    update: {},
    create: {
      id: "farm-2",
      name: "Santoso Plantation",
      ownerId: farmer2.id,
      latitude: 7.8900,
      longitude: 125.1200,
      sizeHectares: 4.2,
      landUseHistory: "GRASSLAND",
      yearsNonForest: 12,
      currentVegetation: "Open grassland, formerly used for cattle",
      speciesPlanned: ["Acacia", "Eucalyptus"],
    },
  });

  // Eligibility assessments
  await prisma.eligibilityAssessment.upsert({
    where: { id: "ea-1" },
    update: {},
    create: {
      id: "ea-1",
      farmId: farm1.id,
      status: "ELIGIBLE",
      overallScore: 82.5,
      landHistoryScore: 100,
      additionalityScore: 75,
      landTenureScore: 50,
      regionEligibility: true,
      creditingPeriodYears: 30,
      criteriaDetails: {
        landHistory: { passed: true, score: 100, weight: 30, reason: "15 years non-forest, exceeds 10-year minimum." },
        additionality: { passed: true, score: 75, weight: 25, reason: "Strong evidence of financial barriers." },
        landTenure: { passed: true, score: 50, weight: 20, reason: "Self-declared; documentation required for formal registration." },
        regionEligibility: { passed: true, score: 100, weight: 15, reason: "Located in Southeast Asia eligible zone." },
        creditingPeriod: { passed: true, score: 100, weight: 10, reason: "30 years within allowed range." },
      },
    },
  });

  await prisma.eligibilityAssessment.upsert({
    where: { id: "ea-2" },
    update: {},
    create: {
      id: "ea-2",
      farmId: farm2.id,
      status: "ELIGIBLE",
      overallScore: 78.0,
      landHistoryScore: 100,
      additionalityScore: 60,
      landTenureScore: 50,
      regionEligibility: true,
      creditingPeriodYears: 25,
      criteriaDetails: {
        landHistory: { passed: true, score: 100, weight: 30, reason: "12 years non-forest." },
        additionality: { passed: true, score: 60, weight: 25, reason: "Moderate evidence." },
        landTenure: { passed: true, score: 50, weight: 20, reason: "Self-declared." },
        regionEligibility: { passed: true, score: 100, weight: 15, reason: "Southeast Asia eligible zone." },
        creditingPeriod: { passed: true, score: 100, weight: 10, reason: "25 years within range." },
      },
    },
  });

  // Carbon estimates
  await prisma.carbonEstimate.upsert({
    where: { id: "ce-1" },
    update: {},
    create: {
      id: "ce-1",
      farmId: farm1.id,
      annualSequestrationT: 18.4,
      totalSequestrationT: 552.0,
      confidenceLevel: 75,
      estimationInputs: { sizeHectares: 3.5, speciesPlanned: ["Teak", "Mahogany", "Bamboo"], creditingPeriodYears: 30 },
    },
  });

  // Pool
  const pool = await prisma.pool.upsert({
    where: { id: "pool-1" },
    update: {},
    create: {
      id: "pool-1",
      name: "Mindanao Agroforestry Collective",
      description: "Aggregating smallholder farmers in Northern Mindanao for a bundled VM0047 ARR project.",
      type: "MANAGED",
      status: "FORMING",
      regionName: "Northern Mindanao, Philippines",
      managerId: aggregator.id,
      totalHectares: 7.7,
      estimatedCredits: 1100.0,
    },
  });

  // Pool memberships
  await prisma.poolMembership.upsert({
    where: { poolId_farmId: { poolId: pool.id, farmId: farm1.id } },
    update: {},
    create: { poolId: pool.id, farmId: farm1.id },
  });

  await prisma.poolMembership.upsert({
    where: { poolId_farmId: { poolId: pool.id, farmId: farm2.id } },
    update: {},
    create: { poolId: pool.id, farmId: farm2.id },
  });

  // Monitoring reports (sample NDVI time series)
  const ndviSeries = [
    { date: "2024-01-15", ndvi: 0.18 },
    { date: "2024-03-15", ndvi: 0.22 },
    { date: "2024-05-15", ndvi: 0.29 },
    { date: "2024-07-15", ndvi: 0.35 },
    { date: "2024-09-15", ndvi: 0.41 },
    { date: "2024-11-15", ndvi: 0.44 },
  ];

  for (const entry of ndviSeries) {
    const id = `mr-${farm1.id}-${entry.date}`;
    await prisma.monitoringReport.upsert({
      where: { id },
      update: {},
      create: {
        id,
        farmId: farm1.id,
        captureDate: new Date(entry.date),
        ndviValue: entry.ndvi,
        ndviMin: entry.ndvi - 0.05,
        ndviMax: entry.ndvi + 0.05,
        changeDetected: false,
        changeType: "growth",
      },
    });
  }

  // Farmer report
  const report = await prisma.farmerReport.upsert({
    where: { id: "fr-1" },
    update: {},
    create: {
      id: "fr-1",
      farmId: farm1.id,
      reporterId: farmer1.id,
      reportType: "PLANTING",
      description: "Planted 280 teak seedlings across the upper slope. Spacing 4m x 4m.",
      speciesPlanted: ["Teak"],
      areaPlantedHa: 2.0,
      photos: [],
    },
  });

  await prisma.verificationRecord.upsert({
    where: { id: "vr-1" },
    update: {},
    create: {
      id: "vr-1",
      verifierId: verifier.id,
      farmerReportId: report.id,
      status: "APPROVED",
      findings: "Consistent with satellite NDVI data. Planting density and area match reported values.",
      verifiedAt: new Date("2024-08-01"),
    },
  });

  console.log("✅ Seed complete.");
  console.log("Test accounts (password: password123):");
  console.log("  Admin:      admin@carbonfarm.io");
  console.log("  Aggregator: aggregator@carbonfarm.io");
  console.log("  Verifier:   verifier@carbonfarm.io");
  console.log("  Farmer:     juan@example.com");
  console.log("  Farmer:     budi@example.com");
}

main().catch(console.error).finally(() => prisma.$disconnect());
