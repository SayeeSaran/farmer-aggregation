# CarbonFarm — Conceptual Product Overview

## 1. Problem Definition

### The Core Problem

The global carbon credit market pays landowners to grow trees that absorb CO₂ — but it has a **minimum viable project size of roughly 1,000+ hectares**. A farmer with 2 hectares is mathematically excluded.

Beyond access, ongoing proof of tree growth (called **MRV — Measurement, Reporting, Verification**) requires expensive consultants and field surveys that small farmers cannot afford.

**Result:** The farmers who could benefit most from carbon income — smallholders in tropical regions where reforestation has the highest climate impact — are locked out entirely.

### Intended Users

- **Smallholder farmers** in Southeast Asia, Africa, Latin America — typically 1–5 hectares, low technical literacy, primary income from agriculture
- **Aggregators / project developers** — NGOs, cooperatives, or private developers who bundle farms into certifiable projects
- **Verifiers** — independent auditors who confirm reported data is credible
- **Platform administrators** — operators managing the system

---

## 2. Core Product Concept

The platform is a **digital aggregation and monitoring layer** between smallholder farmers and the formal carbon market. Three things make it work together:

### ① Lower the entry barrier
Automate the eligibility assessment so a farmer doesn't need a consultant to find out if their land qualifies. Answer a guided questionnaire, get an instant score.

### ② Pool small farms into one project
Group geographically nearby eligible farms together so their combined acreage meets registry thresholds. What was inaccessible to one farmer at 2 hectares becomes viable as a group at 200 hectares.

### ③ Automate the monitoring
Replace expensive annual field surveys with satellite imagery (free, global, every 5 days) plus structured farmer self-reporting through a mobile-friendly interface. This makes ongoing compliance affordable at small scale.

### The underlying logic
Carbon registries don't care how many individual farmers are in a project — they care that the land area, methodology, and monitoring data meet their standards. This platform handles all the complexity of aggregation and monitoring so farmers just need to show up and plant trees.

---

## 3. User Roles

### 🌱 Farmer
The primary beneficiary.
- Registers their farm
- Runs an eligibility check
- Joins a pool
- Submits periodic field reports (photos, tree counts, growth measurements)
- Tracks estimated carbon earnings

The entire experience is designed assuming **low technical literacy** — step-by-step wizards, map-click interfaces, no jargon.

### 📊 Aggregator
A project developer, NGO, or cooperative.
- Creates and manages pools
- Monitors pool health (total hectares, farmer count, carbon estimate)
- Shepherds the pool through its lifecycle toward registry submission
- Legally responsible for the project in the eyes of the carbon registry

### 🔍 Verifier
An independent auditor.
- Reviews satellite data and farmer-reported data side by side
- Looks for inconsistencies
- Formally approves or rejects each monitoring cycle
- **Cannot edit data** — only evaluate and rule
- Decisions form the audit trail the registry requires

### 🔑 Admin
Platform operator.
- Manages user accounts
- Monitors system-wide metrics
- Handles edge cases
- Not part of the carbon credit workflow itself

### Key Design Principle
**Strict role separation.** A farmer never sees another farmer's data. A verifier can see everything but change nothing. An aggregator manages their pools but not the platform. This isn't just a UX choice — it's an integrity requirement for a system producing financial instruments.

---

## 4. Aggregation Model

### Auto-regional Pooling
**Fully automated.**
- Scans all eligible farms not yet assigned to a pool
- Calculates geographic distances using the **Haversine formula** (accurate great-circle distance on Earth's curved surface)
- Clusters farms within a configurable radius — e.g., 50km — into a candidate pool
- No human intervention needed
- Scales to thousands of farmers without aggregator effort

### Managed Pooling
**Human-directed.**
- An aggregator creates a pool with a specific purpose
- Perhaps targeting a donor-funded program, a specific ethnic community, or a particular tree species
- Farmers browse available pools and apply to join, or aggregators invite them directly

### Current Grouping Criteria
- **Geographic proximity** (distance between farms)
- **Eligibility status** (must have passed eligibility check, must not be in another pool)

### In a Production System You'd Add
- **Methodology compatibility** — all farms must qualify under the same rulebook
- **Species alignment** — important for carbon modelling
- **Crediting period consistency** — all farmers commit to the same duration

### Pool Lifecycle
```
FORMING → VALIDATION → REGISTERED → MONITORING → CREDIT_ISSUED
```

Each stage has different data requirements and actor responsibilities.

---

## 5. Eligibility / Feasibility Logic

The eligibility engine scores each farm against **five criteria** drawn directly from **Verra's VM0047 methodology** — the international rulebook for Afforestation, Reforestation, and Revegetation carbon projects:

| Criterion | Weight | The Rule |
|-----------|--------|----------|
| **Land history** | 30% | Land must have been non-forest for at least 10 years. If recently deforested, planting trees just reverses damage — doesn't create new carbon value |
| **Additionality** | 25% | Trees wouldn't be planted without the carbon credit incentive. Prevents claiming credit for forests that would grow anyway |
| **Land tenure** | 20% | Farmer must own or have documented rights to land for the full crediting period. A 30-year project on land without legal security is unenforceable |
| **Region eligibility** | 15% | Some geographies excluded from certain methodologies based on baseline deforestation rates |
| **Crediting period** | 10% | Must be between 20 and 100 years — Verra's hard boundary |

### Scoring Outcome

| Score | Status |
|-------|--------|
| ≥70% + all mandatory pass | **Eligible** |
| 50–69% | **Needs Human Review** |
| <50% or mandatory fail | **Ineligible** |

### Important Caveat
This scoring is a **pre-screening heuristic**, not a legally defensible assessment.

A real VM0047 project requires:
- Full Project Design Document prepared by a certified consultant
- Baseline studies
- Third-party validation audit

**What we've built:** Filters out clearly ineligible farms cheaply and quickly — the formal process follows for those who pass.

---

## 6. MRV Concept

**MRV = Measurement, Reporting, and Verification**

MRV is the heart of carbon credit integrity. Without credible, ongoing proof that trees are growing, the credits are worthless. The system uses two data streams that cross-validate each other:

### Measurement — What's actually happening on the ground

#### Satellite-derived
- **Data source:** Sentinel-2 satellite imagery (freely available from ESA, revisit time ~5 days)
- **Metric:** NDVI — Normalized Difference Vegetation Index
- **What it measures:** Difference in how vegetation reflects red vs. near-infrared light
  - Healthy, dense vegetation = high NDVI
  - Bare or degraded land = low NDVI
- **Signal:** Rising NDVI trend over months/years = trees are genuinely growing

#### Farmer-reported
- **Data types:** Structured field reports submitted through app
  - Tree survival rates
  - Height measurements
  - Photographs
- **Validation:** Photos are geo-tagged and GPS coordinates verified against registered farm location
- **Checks:** Timestamps validated for plausibility

### Reporting — Packaging the data

Each monitoring period (e.g., annually) produces a **monitoring report** combining both data streams into a structured record covering the time period. This is what gets submitted to the carbon registry.

### Verification — Independent human review

A **verifier** reviews satellite data versus farmer reports side by side. The system automatically flags **anomalies**:
- Farmer reporting 95% tree survival while NDVI is declining
- Photo GPS location 50km from registered farm
- Report submitted with timestamp predating the planting date

The verifier **investigates flags**, then formally **approves or rejects** the monitoring period. Their decision is logged immutably.

### Carbon Estimation

**Simplified allometric model:**
```
tree species + land area + estimated age
→ above-ground biomass
→ add below-ground biomass (~26% of above-ground)
→ multiply by 0.47 (carbon fraction of biomass)
→ multiply by 44/12 (molecular weight ratio of CO₂ to carbon)
→ tonnes of CO₂ equivalent
```

This number, aggregated across the pool, is the **credit volume**.

---

## 7. Data Model

### Entity Relationships

```
User (Farmer) ─── has many ──── Farms
                                   ├── has one ──── EligibilityAssessment
                                   ├── has many ─── FarmerReports
                                   ├── has many ─── MonitoringReports
                                   └── has one ──── CarbonEstimate

Pool ─── has many ──── PoolMemberships ─── links to ──── Farms
  ├── has many ──── VerificationRecords
  └── has one ─── CarbonEstimate (pooled)

User (Verifier) ─── creates ──── VerificationRecords
```

### Main Entities

| Entity | Belongs To | Purpose |
|--------|-----------|---------|
| **User** | N/A | Central actor — every other entity traces to a user by role |
| **Farm** | Farmer-User | Physical reality: GPS, boundary, size, land use history, species planned |
| **EligibilityAssessment** | Farm | VM0047 scoring: criteria scores, overall result (Eligible/Review/Ineligible) |
| **Pool** | Aggregator | Aggregation unit submitted to registry; has status in lifecycle, aggregate stats |
| **PoolMembership** | N/A | Join table between Farms and Pools; a farm in one pool only |
| **MonitoringReport** | Farm | Satellite NDVI snapshot at a point in time; many form the time-series trend |
| **FarmerReport** | Farm | Self-submitted field observation: report type, photos, measurements, GPS |
| **VerificationRecord** | Pool | Verifier's decision on monitoring cycle: approved/rejected with findings |
| **CarbonEstimate** | Farm + Pool | Estimated sequestration at individual farm level and pooled level |

### Key Architectural Decision

**The Farm is the unit of measurement; the Pool is the unit of registration.**

This separation allows:
- **Individual farmer data** stays granular (important for earnings allocation and audit)
- **Pool presents** a unified project face to the registry

---

## 8. End-to-End Workflow

### 1. ONBOARDING
```
Farmer discovers platform
→ registers account
→ selects Farmer role
→ lands on personal dashboard
```

### 2. FARM REGISTRATION
```
Adds farm details
→ pins location on map
→ declares land size, land history, planned species
→ uploads ownership document
```

### 3. ELIGIBILITY SCREENING
```
Runs 5-step VM0047 wizard
→ system scores each criterion
→ receives result with score breakdown
```

**Three possible outcomes:**
- **Ineligible** — told why, workflow ends
- **Needs review** — flagged for aggregator/admin assessment
- **Eligible** — unlocked to join pools

### 4. AGGREGATION

#### Option A — Auto
System detects eligible unassigned farm, clusters with nearby farms, proposes pool assignment

#### Option B — Manual
Farmer browses available pools near them, reviews pool details, applies to join

```
Farmer joins pool
→ aggregator approves membership
→ pool aggregate stats update
```

### 5. PROJECT REGISTRATION (Aggregator-led)
```
Aggregator reviews pool composition
→ confirms all farms eligible
→ submits pool for validation
→ pool moves to REGISTERED
```

**In reality:** Formal PDD submitted to Verra, audit conducted

### 6. MONITORING PHASE (ongoing, 20–100 years)

**Automated satellite component:**
- Every ~5 days: NDVI snapshot captured automatically

**Farmer-driven component:**
- Monthly/quarterly: farmer submits field report via app

**System accumulates both data streams continuously**

### 7. VERIFICATION (typically annual)
```
Verifier opens monitoring period
→ reviews satellite trend vs farmer reports
→ anomaly flags highlighted
→ investigates discrepancies
→ approves or rejects period with written findings
```

### 8. CREDIT ISSUANCE
```
Approved monitoring periods accumulate
→ carbon estimate finalised
→ credits issued proportional to each farm's land area contribution
→ pool status moves to CREDIT_ISSUED
```

---

## 9. Assumptions Made

### On the Methodology
VM0047 was chosen as the target standard, but real selection depends on:
- Country
- Project scale
- Buyer requirements
- Geographic scope qualification

Other standards (Gold Standard, Plan Vivo, national REDD+ programs) have different rules entirely.

### On the Scoring
The eligibility weights and thresholds are reasonable approximations but **not calibrated** against actual Verra decisions.

A real pre-screening would be validated against a dataset of approved/rejected PDD submissions.

### On Farmers
Assumes:
- Smartphone access
- Basic literacy
- Willingness to submit regular reports
- Land ownership maps onto local context

**Problem in many target regions:** Land is communally owned or informally titled — this breaks several assumptions simultaneously.

### On Satellite Data
NDVI is a reasonable biomass proxy for **screening purposes**, but professional MRV uses:
- Certified allometric equations per species
- Field plot measurements for ground-truthing
- Sometimes LiDAR

**Reality:** NDVI alone would not pass a Verra audit.

### On Connectivity
Field reports assume **internet connectivity at the farm level**. Rural areas often have none.

### On the Aggregator
Assumes a **single legal entity** owns the pool and is accountable to the registry.

Real projects often involve:
- Consortium structures
- Community land agreements
- Complex benefit-sharing contracts

None of which are modelled.

### On Carbon Price
The system estimates credit **volume** but says nothing about **price**, which fluctuates between $5 and $50+ per tonne depending on:
- Project type
- Vintage
- Buyer

---

## 10. Current Limitations

| Gap | Why it Matters |
|-----|----------------|
| **Satellite API not connected** | NDVI charts show placeholder data. Architecture wired for Sentinel Hub but integration isn't live |
| **No photo storage** | Farmer photos can be uploaded in UI but no cloud storage backend to save/serve them |
| **Eligibility is pre-screening only** | Not a substitute for formal Project Design Document or third-party validation |
| **No legal layer** | No contracts, benefit-sharing agreements, or verified land tenure — critical for projects locking in land use for 50 years |
| **No notifications** | No emails/alerts when pool status changes, verification due, or anomalies detected |
| **No credit issuance mechanism** | Credits estimated but no way to sell, transfer, or retire them |
| **Single methodology** | Only VM0047. Real deployments need multiple for different land types/countries |
| **No offline support** | Rural farmers without internet can't submit reports |
| **No multi-tenancy** | One platform instance serves all. Enterprise deployments need isolated environments per country/program |

---

## 11. Future Extensions

### Real Satellite Pipeline
Move from on-demand API calls to a **scheduled data pipeline**:
- Automated NDVI pulls every 5 days per farm
- Stored as time-series
- Anomaly detection running continuously
- Integrate change detection (sudden NDVI drop = potential deforestation)
- Instant alerts on events

### Legal and Governance Infrastructure
- Digital land rights verification against national cadastre systems
- Smart contracts encoding benefit-sharing terms
- Legally binding crediting period commitments
- Dispute resolution mechanisms

**Note:** Arguably more important than the technology — can't issue credits without clear land rights.

### Multi-methodology Engine
A **pluggable scoring engine** where each carbon methodology is a separate module:
- REDD+ (avoided deforestation)
- Improved cookstoves
- Soil carbon
- Blue carbon mangroves
- Each with own eligibility rules, carbon models, monitoring requirements

VM0047 becomes one of many.

### Carbon Credit Marketplace
- Buyer profiles
- Credit listings with project provenance data
- Price discovery
- Transaction records
- Potentially on-chain retirement of credits for public transparency (growing buyer requirement)

### Offline-first Mobile App
A **native app** allowing farmers to submit reports without internet:
- Data queues locally
- Syncs when connectivity available
- **Critical** for reaching farmers who need this most

### Field Agent Network Integration
A **fourth data stream** beyond satellite and self-reporting:
- Periodic field visits by trained agents
- Physical measurements
- Ground-truth the satellite data
- Especially important for first monitoring year when NDVI baselines established

### ML-powered Anomaly Detection
Replace rule-based flags with a **trained model** that learns from thousands of reporting cycles:
- What legitimate patterns look like
- What fraudulent or erroneous patterns look like
- Over time becomes more accurate than hand-coded rules

### Registry API Integration
**Direct programmatic submission** to Verra, Gold Standard, or national registries:
- Instead of generating PDF documents for manual upload
- Closes the last mile of automation story

---

## Through-Line

Every future extension is in service of the **same goal**: making a market that currently requires $200,000+ in upfront costs and years of consultant time accessible to someone with a 2-hectare field and a basic smartphone.

The technology is only as valuable as its ability to close that gap.

---

## Key Takeaways

| Aspect | Reality |
|--------|---------|
| **Problem we solve** | Carbon market access for smallholders who are mathematically excluded today |
| **How we solve it** | Aggregation + automation (eligibility + monitoring) |
| **Stage we're at** | MVP with architecture for satellite integration, real MRV data flows, and multi-methodology support |
| **Biggest missing pieces** | Real satellite pipeline, legal/land rights layer, marketplace mechanics |
| **Hardest challenge ahead** | Trust — farmers and verifiers need to believe in the system's integrity from day one |
