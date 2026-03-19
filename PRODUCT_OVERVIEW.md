# CarbonFarm.io — Product & System Design Overview

> **Context for Claude Chat continuity:** This document captures the full state of the CarbonFarm.io project as of March 2026. Use it to resume work in any Claude session. The codebase lives at `github.com/SayeeSaran/farmer-aggregation` and is deployed at `farmer-aggregation.vercel.app`.

---

## What Changed Since V1

The first version was a full-stack dashboard platform with login, farm registration, pool management, satellite monitoring, and verification workflows. After reviewing the MVP scope, we made significant changes:

| Area | V1 (Dashboard Platform) | V2 (MVP Screener) |
|------|------------------------|-------------------|
| **Entry point** | Login required for everything | Public landing page + questionnaire, no auth needed |
| **Core flow** | Register → add farm → run eligibility → join pool → monitor | Answer 14 questions → get verdict + carbon estimate |
| **Eligibility** | 5-criterion weighted percentage score (≥70% = eligible) | 6-criterion hard-exclusion + soft-flag (pass/flag/fail per criterion) |
| **New criteria** | — | Pre-existing canopy cover (§6.2), Regulatory surplus (§7.3.1) |
| **Removed criteria** | Additionality self-assessment, region bounding boxes | Removed — not for farmers to self-report |
| **Carbon model** | Fixed 0.26 root-to-shoot ratio, generic growth rates | IPCC 2019 Table 4.4 root-to-shoot ratios + Table 4.12 MAI by species/climate |
| **Species** | Single species selection | Multi-species with weighted averaging |
| **Pooling** | Interactive pool management + Haversine auto-clustering | Explainer text only — "your X ha joins a pool, we handle aggregation" |
| **Satellite/NDVI** | Sentinel Hub integration with NDVI charts | Removed from MVP — placeholder data undermines trust |
| **Verifier role** | Full verification workflow | Removed from MVP |
| **File uploads** | Photo uploads with EXIF geo-validation | Removed — zero friction questionnaire only |
| **i18n** | None | English + Tamil (ta-IN) via react-i18next, all strings externalized |
| **Methodology page** | None | Full VM0047 reference mapping every question to methodology sections |
| **Design tone** | Dashboard/startup feel | Lightweight pre-feasibility memo, professional and plain language |
| **Deployment** | Local only | Vercel (farmer-aggregation.vercel.app) |

**The V1 code is still in the repo** — old dashboard pages exist under `src/app/(platform)/` and `src/app/(auth)/` but aren't linked from the public screening flow. They're accessible by URL but protected behind auth middleware. Nothing was deleted.

---

## 1. Problem Definition

**The problem:** The voluntary carbon market requires projects to meet rigorous standards (Verra VM0047 for tree planting), but smallholder farmers in the Global South have no way to know if their land even qualifies. Assessment typically costs thousands of dollars in consultant fees, takes months, and requires technical knowledge of carbon methodologies. This creates a barrier where the farmers who could benefit most from carbon credit income are locked out before they even start.

Beyond individual eligibility, carbon registries require minimum project sizes (typically 100+ hectares), making it impossible for a farmer with 2–5 hectares to register a project alone.

**Intended users:**
- **Primary:** Smallholder farmers and landowners (1–50 ha) in tropical/subtropical regions (India, Southeast Asia, Sub-Saharan Africa, Latin America) who want to know if their plantation or restoration activity could earn carbon credits
- **Secondary:** Project aggregators/developers who bundle small farms into registry-scale projects
- **Future:** Verifiers, buyers, and platform administrators

---

## 2. Core Product Concept

CarbonFarm.io is a **VM0047 ARR pre-feasibility screening tool**. The core idea:

1. **A farmer answers 14 questions** about their land (no uploads, no signup, no jargon)
2. **The system checks their answers against VM0047 criteria** and returns a clear verdict: Eligible, Needs Review, or Ineligible — with a one-sentence explanation for each criterion
3. **A carbon credit estimate** shows the potential value of their land over 20, 30, or 50 years — presented as a range, not a guaranteed figure
4. **A pooling explainer** tells small landholders how CarbonFarm handles aggregation so they don't need 100+ hectares themselves

The product intentionally feels like a **pre-feasibility memo**, not a dashboard. It's designed for a farmer in rural Tamil Nadu to complete on their phone in under 5 minutes, in their own language.

---

## 3. User Roles

**In the live MVP:** No user roles. The screening is completely anonymous — no login, no account creation, no data stored server-side. Questionnaire answers live in browser sessionStorage only.

**In the V1 platform code (still in repo, not public-facing):**
- **FARMER** — Register farms, run eligibility, join pools, submit field reports
- **AGGREGATOR** — Create/manage pools, oversee project lifecycle
- **VERIFIER** — Review satellite + farmer data side-by-side, approve/reject
- **ADMIN** — System-wide visibility, user management

These roles exist in the Prisma schema and auth system but are not part of the current MVP flow.

---

## 4. Aggregation Model

**In the live MVP:** Pooling is presented as a concept, not an interactive feature. After the eligibility result, a card explains:

> "Your X ha would join a larger pool of nearby landowners. Carbon registries typically require projects of 100+ hectares. CarbonFarm handles the aggregation — grouping your land with others in your region into a single registered project."

**In the V1 code (not public):**
- **Auto-regional pooling** uses Haversine distance to cluster eligible farms within 25 km radius. Clusters ≥100 ha and ≥2 farms automatically form a pool.
- **Managed pooling** lets aggregators manually create pools with specific criteria.
- Pool lifecycle: FORMING → VALIDATION → REGISTERED → MONITORING → CREDIT_ISSUED → CLOSED

**Criteria used:** Geographic proximity (primary), eligibility status (must be eligible), pool membership (must not already be in an active pool). Species compatibility and crediting period alignment are not yet factored in but should be for real project bundling.

---

## 5. Eligibility / Feasibility Logic

The MVP eligibility engine checks **6 criteria** derived from VM0047 v1.1:

| # | Criterion | VM0047 Section | Logic | Hard Fail Trigger |
|---|-----------|---------------|-------|-------------------|
| 1 | **Land History** | §4.4.1, §4.4.2 | Was land managed forest / timber harvested / woody biomass removed in last 10 years? | Any "yes" → INELIGIBLE |
| 2 | **Pre-existing Canopy Cover** | §6.2 | Current tree cover percentage | >30% → INELIGIBLE (already forest) |
| 3 | **Land Tenure** | General requirement | Ownership type + documented proof | Weak ownership + no documents → INELIGIBLE |
| 4 | **Crediting Period** | §3.2 | How long can land be committed? | <20 years → INELIGIBLE |
| 5 | **Regulatory Surplus** | §7.3.1 | Is planting required by law? | "Yes" → INELIGIBLE (not additional) |
| 6 | **Planting Design** | Land use continuity | Will land stay planted? | "No" → INELIGIBLE (reversal risk) |

**Verdict logic:**
- Any criterion fails → **INELIGIBLE**
- No failures but ≥1 "not sure" / uncertain → **NEEDS_REVIEW**
- All pass → **ELIGIBLE**

**What we deliberately removed from V1:**
- Additionality self-assessment ("would you plant without carbon income?") — not appropriate for farmer self-reporting
- Region eligibility bounding boxes — too coarse, replaced by country selection
- Weighted percentage scoring — replaced with binary pass/flag/fail per criterion

**Monitoring approach determination** (VM0047 §4.3):
- ≤50 trees/ha + direct planting → Census-based (count every tree)
- Everything else → Area-based (sample plots + remote sensing)

---

## 6. MRV Concept

**In the live MVP:** MRV is not implemented. The screening tool is pre-project — it determines whether MRV is worth pursuing, not how to do it.

**In the V1 code (not public):**

| Component | Approach | Data Source |
|-----------|----------|-------------|
| **Measurement** | NDVI time-series from Sentinel-2 satellite imagery | Sentinel Hub API (not connected — was placeholder data) |
| **Measurement** | Farmer self-reporting: tree counts, growth, geo-tagged photos | Mobile upload with EXIF GPS verification |
| **Reporting** | Aggregation of satellite + farmer data into monitoring reports | MonitoringReport + FarmerReport models |
| **Verification** | Side-by-side comparison panel for verifiers | VerificationRecord with APPROVED/REJECTED/FLAGGED |

**Why removed from MVP:** Placeholder satellite data undermines trust. MRV is Phase 2.

---

## 7. Data Model

**12 Prisma models** in the database schema:

```
User ──────── has many ──── Farm
                              ├── EligibilityAssessment
                              ├── MonitoringReport ── VerificationRecord
                              ├── FarmerReport ────── VerificationRecord
                              ├── CarbonEstimate
                              └── PoolMembership ──── Pool

Pool ──────── managed by ── User (AGGREGATOR)
              has many ──── PoolMembership, CarbonEstimate
```

**Note:** The MVP screening flow does NOT use the database. Questionnaire answers are stored in browser sessionStorage, processed client-side, and never sent to a server.

---

## 8. Workflow

### MVP Flow (Live at farmer-aggregation.vercel.app)
```
Landing page → "Start Free Eligibility Check"
  ↓
Section 1: Country, land area, activity type
Section 2: Land history (4 questions including canopy cover)
Section 3: Land tenure (4 questions including regulatory surplus)
Section 4: Planting design (tree density, land use continuity)
Section 5: Carbon inputs (multi-species selection, climate zone)
  ↓
Results page (two-column):
  LEFT:  Verdict → 6 criteria breakdown → approach indicator → pooling explainer
  RIGHT: Sticky carbon estimate card (period toggle, tCO₂e range, price range, CTA)
  ↓
"Discuss Next Steps" → mailto:hello@carbonfarm.io
```

### V1 Platform Flow (In Code, Not Public)
```
Register → Login → Dashboard → Register farm on map → Eligibility wizard
→ Join pool → Monitoring (satellite + field reports) → Verification → Credits
```

---

## 9. Assumptions Made

| Assumption | Reality Check |
|-----------|---------------|
| VM0047 v1.1 is the right methodology | Most relevant for ARR, but other standards exist |
| IPCC default values sufficient for pre-feasibility | Yes for screening; formal validation needs site-specific data |
| ±30% uncertainty band covers estimation error | Conservative for pre-feasibility |
| $5–15/tCO₂e price range | Reasonable for voluntary market; no VM0047 credits issued yet |
| Farmers can accurately report land history | They know their land, but technical terms may need simpler language |
| 10% canopy cover = non-forest threshold | Country-specific; we use 10% pass, 10–30% flag, >30% fail |
| Equal weighting across species | Simplification; real projects allocate area per species |

---

## 10. Current Limitations

| Limitation | Impact |
|-----------|--------|
| No server-side data persistence | Results lost when browser session ends |
| No Sentinel Hub integration | Satellite monitoring prepared but not connected |
| No file uploads | Can't collect ownership documents or site photos |
| Country-specific forest definitions not implemented | Using simplified canopy cover brackets |
| No leakage assessment (VMD0054) | Required by VM0047, out of scope |
| No stocking index / permanence buffer | VM0047 discount not modeled |
| No baseline carbon calculation | Gross sequestration only, not net |
| Static price estimate ($5–15) | No marketplace integration |
| No lead capture | mailto link only, no CRM |
| Tamil translation needs native review | Machine-quality, especially technical terms |

---

## 11. Future Extensions

**Phase 2 (Near Term):** Lead capture form, save/share results via URL, real satellite integration, stocking index, country-specific forest definitions, species area allocation

**Phase 3 (Medium Term):** Offline-first mobile app, legal/governance layer, multi-methodology support (REDD+, Gold Standard), aggregator dashboard revival, automated MRV pipeline

**Phase 4 (Long Term):** Credit marketplace, registry API integration, ML anomaly detection, payment infrastructure, multi-language expansion (Hindi, Bahasa, Swahili, Spanish)

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, TypeScript, App Router |
| UI | Tailwind CSS 4, shadcn/ui, Lucide icons |
| Database | PostgreSQL + Prisma 7 |
| Auth | Auth.js v5 (NextAuth) |
| i18n | react-i18next (English + Tamil) |
| Carbon Model | IPCC 2019/2006 allometric tables |
| Deployment | Vercel |
| Repo | github.com/SayeeSaran/farmer-aggregation |
| Live URL | farmer-aggregation.vercel.app |

---

*Last updated: March 2026*
