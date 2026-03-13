import { z } from "zod";
import { LandUseHistory, ReportType, PoolType } from "@prisma/client";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  role: z.enum(["FARMER", "AGGREGATOR"]).default("FARMER"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const farmSchema = z.object({
  name: z.string().min(2, "Farm name required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  sizeHectares: z.number().positive("Size must be positive"),
  landUseHistory: z.nativeEnum(LandUseHistory),
  yearsNonForest: z.number().int().min(0),
  currentVegetation: z.string().optional(),
  speciesPlanned: z.array(z.string()).min(1, "At least one species required"),
  ownershipDocUrl: z.union([z.string().url(), z.literal(""), z.undefined()]).optional(),
});

export const eligibilitySchema = z.object({
  farmId: z.string().cuid(),
  creditingPeriodYears: z.number().int().min(20).max(100),
  additionalityJustification: z.string().min(50, "Please provide a detailed justification (min 50 chars)"),
  selfDeclaredOwnership: z.boolean().default(false),
});

export const createPoolSchema = z.object({
  name: z.string().min(3, "Pool name required"),
  description: z.string().optional(),
  type: z.nativeEnum(PoolType),
  regionName: z.string().optional(),
  minHectares: z.number().min(0).default(0),
  maxMembers: z.number().int().positive().optional(),
});

export const farmerReportSchema = z.object({
  farmId: z.string().cuid(),
  reportType: z.nativeEnum(ReportType),
  description: z.string().optional(),
  speciesPlanted: z.array(z.string()).default([]),
  areaPlantedHa: z.number().positive().optional(),
  survivalRate: z.number().min(0).max(100).optional(),
  activityData: z.record(z.string(), z.unknown()).optional(),
});
