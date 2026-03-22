"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Loader2, X, Plus, Trash2 } from "lucide-react";
import type { QuestionnaireData } from "@/lib/services/mvp-eligibility";

const TOTAL_SECTIONS = 5;

const COUNTRIES = [
  "India", "Indonesia", "Vietnam", "Philippines", "Thailand", "Myanmar", "Cambodia", "Laos",
  "Malaysia", "Sri Lanka", "Bangladesh", "Nepal", "Kenya", "Tanzania", "Ethiopia", "Uganda",
  "Mozambique", "Ghana", "Nigeria", "Cameroon", "DR Congo", "Madagascar",
  "Brazil", "Colombia", "Peru", "Mexico", "Guatemala", "Honduras", "Nicaragua",
  "Costa Rica", "Panama", "Ecuador", "Bolivia", "Paraguay",
  "Other",
];

const SPECIES_OPTIONS = [
  "teak", "eucalyptus", "acacia", "bamboo", "mangrove",
  "pine", "mahogany", "rubber", "mixedNative", "otherSpecies",
];

/**
 * Climate zone lookup by country + region/state.
 * Based on Köppen-Geiger classification.
 * Returns best-guess climate zone or null if not found.
 */
const COUNTRY_CLIMATE_MAP: Record<string, string> = {
  // Default climate per country (most common zone for ARR-relevant areas)
  "India": "tropical",
  "Indonesia": "tropical",
  "Vietnam": "tropical",
  "Philippines": "tropical",
  "Thailand": "tropical",
  "Myanmar": "tropical",
  "Cambodia": "tropical",
  "Laos": "tropical",
  "Malaysia": "tropical",
  "Sri Lanka": "tropical",
  "Bangladesh": "tropical",
  "Nepal": "subtropical",
  "Kenya": "tropical",
  "Tanzania": "tropical",
  "Ethiopia": "subtropical",
  "Uganda": "tropical",
  "Mozambique": "tropical",
  "Ghana": "tropical",
  "Nigeria": "tropical",
  "Cameroon": "tropical",
  "DR Congo": "tropical",
  "Madagascar": "tropical",
  "Brazil": "tropical",
  "Colombia": "tropical",
  "Peru": "tropical",
  "Mexico": "subtropical",
  "Guatemala": "tropical",
  "Honduras": "tropical",
  "Nicaragua": "tropical",
  "Costa Rica": "tropical",
  "Panama": "tropical",
  "Ecuador": "tropical",
  "Bolivia": "subtropical",
  "Paraguay": "subtropical",
};

/**
 * Region/state-level overrides for countries with diverse climates.
 * Key format: "Country:region_keyword" (lowercase)
 */
const REGION_CLIMATE_OVERRIDES: Record<string, string> = {
  // India
  "india:rajasthan": "arid",
  "india:gujarat": "arid",
  "india:kutch": "arid",
  "india:thar": "arid",
  "india:ladakh": "arid",
  "india:jammu": "temperate",
  "india:kashmir": "temperate",
  "india:himachal": "temperate",
  "india:uttarakhand": "temperate",
  "india:shimla": "temperate",
  "india:manali": "temperate",
  "india:darjeeling": "subtropical",
  "india:shillong": "subtropical",
  "india:northeast": "subtropical",
  "india:assam": "subtropical",
  "india:meghalaya": "subtropical",
  "india:nagaland": "subtropical",
  "india:manipur": "subtropical",
  "india:mizoram": "subtropical",
  "india:arunachal": "subtropical",
  "india:sikkim": "subtropical",
  "india:nilgiris": "subtropical",
  "india:ooty": "subtropical",
  "india:kodaikanal": "subtropical",
  "india:munnar": "subtropical",
  "india:punjab": "subtropical",
  "india:haryana": "subtropical",
  "india:delhi": "subtropical",
  "india:uttar pradesh": "subtropical",
  "india:madhya pradesh": "subtropical",
  "india:tamil nadu": "tropical",
  "india:kerala": "tropical",
  "india:karnataka": "tropical",
  "india:andhra pradesh": "tropical",
  "india:telangana": "tropical",
  "india:maharashtra": "tropical",
  "india:goa": "tropical",
  "india:odisha": "tropical",
  "india:west bengal": "tropical",
  "india:bihar": "subtropical",
  "india:jharkhand": "subtropical",
  "india:chhattisgarh": "tropical",
  // Brazil
  "brazil:south": "subtropical",
  "brazil:parana": "subtropical",
  "brazil:santa catarina": "subtropical",
  "brazil:rio grande do sul": "subtropical",
  "brazil:sao paulo": "subtropical",
  "brazil:northeast": "arid",
  "brazil:caatinga": "arid",
  "brazil:sertao": "arid",
  // Mexico
  "mexico:sonora": "arid",
  "mexico:chihuahua": "arid",
  "mexico:baja": "arid",
  "mexico:yucatan": "tropical",
  "mexico:chiapas": "tropical",
  "mexico:tabasco": "tropical",
  "mexico:veracruz": "tropical",
  // Kenya
  "kenya:nairobi": "subtropical",
  "kenya:highlands": "subtropical",
  "kenya:coast": "tropical",
  "kenya:north": "arid",
  "kenya:turkana": "arid",
  // Ethiopia
  "ethiopia:highlands": "subtropical",
  "ethiopia:addis": "subtropical",
  "ethiopia:lowlands": "arid",
  "ethiopia:afar": "arid",
  "ethiopia:ogaden": "arid",
};

function detectClimateZone(country: string, location: string): string | null {
  if (!country) return null;

  // Try region-level override first
  if (location) {
    const key = `${country.toLowerCase()}:${location.toLowerCase().trim()}`;
    for (const [pattern, zone] of Object.entries(REGION_CLIMATE_OVERRIDES)) {
      if (key.includes(pattern) || pattern.includes(location.toLowerCase().trim())) {
        return zone;
      }
    }
  }

  // Fall back to country default
  return COUNTRY_CLIMATE_MAP[country] || null;
}

interface LandParcel {
  id: string;
  name: string;
  areaHa: number;
}

function RadioGroup({ name, options, value, onChange }: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            value === opt.value
              ? "border-green-600 bg-green-50 text-green-900"
              : "border-border hover:border-green-300 hover:bg-green-50/50"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            value === opt.value ? "border-green-600" : "border-muted-foreground/40"
          }`}>
            {value === opt.value && <div className="w-2 h-2 rounded-full bg-green-600" />}
          </div>
          <span className="text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground mt-1">{children}</p>;
}

function MethodologyRef({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground/70 italic mt-0.5">{children}</p>;
}

let parcelCounter = 1;

export function Questionnaire() {
  const { t } = useTranslation();
  const router = useRouter();
  const [section, setSection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [customSpecies, setCustomSpecies] = useState("");
  const [location, setLocation] = useState("");
  const [suggestedClimate, setSuggestedClimate] = useState<string | null>(null);

  const [parcels, setParcels] = useState<LandParcel[]>([
    { id: "parcel-1", name: "", areaHa: 0 },
  ]);

  const [data, setData] = useState<Partial<QuestionnaireData>>({
    activityType: undefined,
    managedForest: undefined,
    timberHarvest: undefined,
    woodyBiomassRemoval: undefined,
    preExistingCover: undefined,
    ownershipType: undefined,
    documentedRights: undefined,
    creditingPeriod: undefined,
    regulatorySurplus: undefined,
    landUseContinuity: undefined,
    climateZone: undefined,
    speciesTypes: [],
  });

  const update = <K extends keyof QuestionnaireData>(key: K, value: QuestionnaireData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  // Compute total land area from all parcels
  const totalLandArea = parcels.reduce((sum, p) => sum + (p.areaHa || 0), 0);

  // Sync total area to data whenever parcels change
  const updateParcel = (id: string, field: "name" | "areaHa", value: string | number) => {
    setParcels((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      );
      const total = updated.reduce((sum, p) => sum + (p.areaHa || 0), 0);
      setData((d) => ({ ...d, landAreaHa: Math.round(total * 10) / 10 }));
      return updated;
    });
  };

  const addParcel = () => {
    parcelCounter++;
    setParcels((prev) => [...prev, { id: `parcel-${parcelCounter}`, name: "", areaHa: 0 }]);
  };

  const removeParcel = (id: string) => {
    setParcels((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      const total = updated.reduce((sum, p) => sum + (p.areaHa || 0), 0);
      setData((d) => ({ ...d, landAreaHa: Math.round(total * 10) / 10 }));
      return updated;
    });
  };

  const toggleSpecies = (species: string) => {
    setData((prev) => {
      const current = prev.speciesTypes ?? [];
      if (current.includes(species)) {
        return { ...prev, speciesTypes: current.filter((s) => s !== species) };
      }
      return { ...prev, speciesTypes: [...current, species] };
    });
  };

  const addCustomSpecies = () => {
    const trimmed = customSpecies.trim();
    if (!trimmed) return;
    const key = `custom:${trimmed}`;
    setData((prev) => {
      const current = prev.speciesTypes ?? [];
      if (current.includes(key)) return prev;
      return { ...prev, speciesTypes: [...current, key] };
    });
    setCustomSpecies("");
  };

  // Auto-detect climate zone when country or location changes
  const handleCountryChange = (country: string) => {
    update("country", country);
    const detected = detectClimateZone(country, location);
    setSuggestedClimate(detected);
    if (detected) {
      update("climateZone", detected as QuestionnaireData["climateZone"]);
    }
  };

  const handleLocationChange = (loc: string) => {
    setLocation(loc);
    if (data.country) {
      const detected = detectClimateZone(data.country, loc);
      setSuggestedClimate(detected);
      if (detected) {
        update("climateZone", detected as QuestionnaireData["climateZone"]);
      }
    }
  };

  const canAdvance = (): boolean => {
    switch (section) {
      case 1: return !!data.country && totalLandArea > 0 && !!data.activityType;
      case 2: return !!data.managedForest && !!data.timberHarvest && !!data.woodyBiomassRemoval && !!data.preExistingCover;
      case 3: return !!data.ownershipType && data.documentedRights !== undefined && !!data.creditingPeriod && !!data.regulatorySurplus;
      case 4: return !!data.treeDensity && data.treeDensity > 0 && !!data.landUseContinuity;
      case 5: return (data.speciesTypes?.length ?? 0) > 0 && !!data.climateZone;
      default: return false;
    }
  };

  const handleSubmit = () => {
    setSubmitting(true);
    // Ensure total area is synced
    const submitData = { ...data, landAreaHa: totalLandArea, parcels };
    sessionStorage.setItem("questionnaire", JSON.stringify(submitData));
    router.push("/screen/results");
  };

  const progress = (section / TOTAL_SECTIONS) * 100;

  // Helper to get display name for species (handles custom species)
  const getSpeciesLabel = (s: string) => {
    if (s.startsWith("custom:")) return s.replace("custom:", "");
    return t(`questionnaire.section5.${s}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {t("questionnaire.progress", { current: section, total: TOTAL_SECTIONS })}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card className="p-6 md:p-8">
        {/* Section 1 — Basic Info */}
        {section === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{t("questionnaire.section1.title")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("questionnaire.section1.subtitle")}</p>
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section1.country")}</Label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                value={data.country || ""}
                onChange={(e) => handleCountryChange(e.target.value)}
              >
                <option value="">{t("questionnaire.section1.countryPlaceholder")}</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Location for climate detection */}
            <div className="space-y-2">
              <Label>{t("questionnaire.section1.location")}</Label>
              <Input
                type="text"
                placeholder={t("questionnaire.section1.locationPlaceholder")}
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
              />
              <HelpText>{t("questionnaire.section1.locationHelp")}</HelpText>
            </div>

            {/* Land Parcels */}
            <div className="space-y-3">
              <Label>{t("questionnaire.section1.landArea")}</Label>
              <HelpText>{t("questionnaire.section1.landParcelsHelp")}</HelpText>

              {parcels.map((parcel, idx) => (
                <div key={parcel.id} className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder={t("questionnaire.section1.parcelName", { number: idx + 1 })}
                    value={parcel.name}
                    onChange={(e) => updateParcel(parcel.id, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0.1}
                    step={0.1}
                    placeholder="ha"
                    value={parcel.areaHa || ""}
                    onChange={(e) => updateParcel(parcel.id, "areaHa", parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground w-6">ha</span>
                  {parcels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeParcel(parcel.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addParcel}
                className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {t("questionnaire.section1.addParcel")}
              </button>

              {totalLandArea > 0 && (
                <div className="text-sm font-medium text-foreground pt-1">
                  {t("questionnaire.section1.totalArea")}: {Math.round(totalLandArea * 10) / 10} {t("questionnaire.section1.landAreaUnit")}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section1.activityType")}</Label>
              <RadioGroup
                name="activityType"
                value={data.activityType || ""}
                onChange={(v) => update("activityType", v as QuestionnaireData["activityType"])}
                options={[
                  { value: "direct_planting", label: t("questionnaire.section1.directPlanting") },
                  { value: "direct_seeding", label: t("questionnaire.section1.directSeeding") },
                  { value: "assisted_regeneration", label: t("questionnaire.section1.assistedRegeneration") },
                  { value: "not_sure", label: t("questionnaire.section1.notSure") },
                ]}
              />
            </div>
          </div>
        )}

        {/* Section 2 — Land History */}
        {section === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{t("questionnaire.section2.title")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("questionnaire.section2.subtitle")}</p>
              <MethodologyRef>{t("questionnaire.section2.methodologyRef")}</MethodologyRef>
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section2.managedForest")}</Label>
              <HelpText>{t("questionnaire.section2.managedForestHelp")}</HelpText>
              <RadioGroup
                name="managedForest"
                value={data.managedForest || ""}
                onChange={(v) => update("managedForest", v as QuestionnaireData["managedForest"])}
                options={[
                  { value: "yes", label: t("questionnaire.section2.yes") },
                  { value: "no", label: t("questionnaire.section2.no") },
                  { value: "not_sure", label: t("questionnaire.section2.notSure") },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section2.timberHarvest")}</Label>
              <HelpText>{t("questionnaire.section2.timberHarvestHelp")}</HelpText>
              <RadioGroup
                name="timberHarvest"
                value={data.timberHarvest || ""}
                onChange={(v) => update("timberHarvest", v as QuestionnaireData["timberHarvest"])}
                options={[
                  { value: "yes", label: t("questionnaire.section2.yes") },
                  { value: "no", label: t("questionnaire.section2.no") },
                  { value: "not_sure", label: t("questionnaire.section2.notSure") },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section2.woodyBiomassRemoval")}</Label>
              <HelpText>{t("questionnaire.section2.woodyBiomassHelp")}</HelpText>
              <RadioGroup
                name="woodyBiomass"
                value={data.woodyBiomassRemoval || ""}
                onChange={(v) => update("woodyBiomassRemoval", v as QuestionnaireData["woodyBiomassRemoval"])}
                options={[
                  { value: "yes", label: t("questionnaire.section2.yes") },
                  { value: "no", label: t("questionnaire.section2.no") },
                  { value: "not_sure", label: t("questionnaire.section2.notSure") },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section2.preExistingCover")}</Label>
              <HelpText>{t("questionnaire.section2.preExistingCoverHelp")}</HelpText>
              <RadioGroup
                name="preExistingCover"
                value={data.preExistingCover || ""}
                onChange={(v) => update("preExistingCover", v as QuestionnaireData["preExistingCover"])}
                options={[
                  { value: "below_10", label: t("questionnaire.section2.coverBelow10") },
                  { value: "10_to_30", label: t("questionnaire.section2.cover10to30") },
                  { value: "above_30", label: t("questionnaire.section2.coverAbove30") },
                  { value: "not_sure", label: t("questionnaire.section2.notSure") },
                ]}
              />
            </div>
          </div>
        )}

        {/* Section 3 — Land Tenure */}
        {section === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{t("questionnaire.section3.title")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("questionnaire.section3.subtitle")}</p>
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section3.ownershipType")}</Label>
              <RadioGroup
                name="ownershipType"
                value={data.ownershipType || ""}
                onChange={(v) => update("ownershipType", v as QuestionnaireData["ownershipType"])}
                options={[
                  { value: "owned", label: t("questionnaire.section3.owned") },
                  { value: "leased", label: t("questionnaire.section3.leased") },
                  { value: "communal", label: t("questionnaire.section3.communal") },
                  { value: "government", label: t("questionnaire.section3.government") },
                  { value: "other", label: t("questionnaire.section3.other") },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section3.documentedRights")}</Label>
              <HelpText>{t("questionnaire.section3.documentedRightsHelp")}</HelpText>
              <RadioGroup
                name="documentedRights"
                value={data.documentedRights === undefined ? "" : data.documentedRights ? "yes" : "no"}
                onChange={(v) => update("documentedRights", v === "yes")}
                options={[
                  { value: "yes", label: t("questionnaire.section2.yes") },
                  { value: "no", label: t("questionnaire.section2.no") },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section3.creditingPeriod")}</Label>
              <HelpText>{t("questionnaire.section3.creditingPeriodHelp")}</HelpText>
              <RadioGroup
                name="creditingPeriod"
                value={data.creditingPeriod || ""}
                onChange={(v) => update("creditingPeriod", v as QuestionnaireData["creditingPeriod"])}
                options={[
                  { value: "less_than_20", label: t("questionnaire.section3.lessThan20") },
                  { value: "20_to_30", label: t("questionnaire.section3.twentyToThirty") },
                  { value: "30_to_50", label: t("questionnaire.section3.thirtyToFifty") },
                  { value: "50_plus", label: t("questionnaire.section3.fiftyPlus") },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section3.regulatorySurplus")}</Label>
              <HelpText>{t("questionnaire.section3.regulatorySurplusHelp")}</HelpText>
              <MethodologyRef>{t("questionnaire.section3.regulatorySurplusRef")}</MethodologyRef>
              <RadioGroup
                name="regulatorySurplus"
                value={data.regulatorySurplus || ""}
                onChange={(v) => update("regulatorySurplus", v as QuestionnaireData["regulatorySurplus"])}
                options={[
                  { value: "yes", label: t("questionnaire.section3.regulatoryYes") },
                  { value: "no", label: t("questionnaire.section3.regulatoryNo") },
                  { value: "not_sure", label: t("questionnaire.section2.notSure") },
                ]}
              />
            </div>
          </div>
        )}

        {/* Section 4 — Planting Design */}
        {section === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{t("questionnaire.section4.title")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("questionnaire.section4.subtitle")}</p>
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section4.treeDensity")}</Label>
              <HelpText>{t("questionnaire.section4.treeDensityHelp")}</HelpText>
              <Input
                type="number"
                min={100}
                step={100}
                placeholder={t("questionnaire.section4.treeDensityPlaceholder")}
                value={data.treeDensity || ""}
                onChange={(e) => update("treeDensity", parseInt(e.target.value) || 0)}
                className="max-w-[200px]"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section4.landUseContinuity")}</Label>
              <HelpText>{t("questionnaire.section4.landUseContinuityHelp")}</HelpText>
              <RadioGroup
                name="landUseContinuity"
                value={data.landUseContinuity || ""}
                onChange={(v) => update("landUseContinuity", v as QuestionnaireData["landUseContinuity"])}
                options={[
                  { value: "yes", label: t("questionnaire.section4.landUseContinuityYes") },
                  { value: "no", label: t("questionnaire.section4.landUseContinuityNo") },
                  { value: "unsure", label: t("questionnaire.section4.landUseContinuityUnsure") },
                ]}
              />
            </div>
          </div>
        )}

        {/* Section 5 — Carbon Estimate Inputs */}
        {section === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{t("questionnaire.section5.title")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("questionnaire.section5.subtitle")}</p>
            </div>

            <div className="space-y-3">
              <Label>{t("questionnaire.section5.speciesType")}</Label>
              <HelpText>{t("questionnaire.section5.speciesMultiHelp")}</HelpText>

              {/* Selected species tags */}
              {(data.speciesTypes?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.speciesTypes!.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
                    >
                      {getSpeciesLabel(s)}
                      <button
                        type="button"
                        onClick={() => toggleSpecies(s)}
                        className="hover:text-green-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Species dropdown to add */}
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                value=""
                onChange={(e) => {
                  if (e.target.value) toggleSpecies(e.target.value);
                }}
              >
                <option value="">{t("questionnaire.section5.speciesPlaceholder")}</option>
                {SPECIES_OPTIONS
                  .filter((s) => s !== "otherSpecies")
                  .filter((s) => !(data.speciesTypes ?? []).includes(s))
                  .map((s) => (
                    <option key={s} value={s}>{t(`questionnaire.section5.${s}`)}</option>
                  ))}
                {!(data.speciesTypes ?? []).some((s) => s === "otherSpecies" || s.startsWith("custom:")) && (
                  <option value="otherSpecies">{t("questionnaire.section5.otherSpecies")}</option>
                )}
              </select>

              {/* Custom species input — shows when "Other" was selected or custom species exist */}
              {(data.speciesTypes ?? []).some((s) => s === "otherSpecies" || s.startsWith("custom:")) && (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder={t("questionnaire.section5.customSpeciesPlaceholder")}
                    value={customSpecies}
                    onChange={(e) => setCustomSpecies(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSpecies(); } }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addCustomSpecies}
                    disabled={!customSpecies.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section5.climateZone")}</Label>
              {suggestedClimate && (
                <p className="text-xs text-green-600 font-medium">
                  {t("questionnaire.section5.climateSuggested", {
                    zone: t(`questionnaire.section5.${suggestedClimate}`),
                    location: location || data.country,
                  })}
                </p>
              )}
              <RadioGroup
                name="climateZone"
                value={data.climateZone || ""}
                onChange={(v) => update("climateZone", v as QuestionnaireData["climateZone"])}
                options={[
                  { value: "tropical", label: t("questionnaire.section5.tropical") },
                  { value: "subtropical", label: t("questionnaire.section5.subtropical") },
                  { value: "temperate", label: t("questionnaire.section5.temperate") },
                  { value: "arid", label: t("questionnaire.section5.arid") },
                ]}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          {section > 1 ? (
            <Button variant="ghost" onClick={() => setSection((s) => s - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("common.back")}
            </Button>
          ) : (
            <div />
          )}

          {section < TOTAL_SECTIONS ? (
            <Button
              onClick={() => setSection((s) => s + 1)}
              disabled={!canAdvance()}
              className="bg-green-600 hover:bg-green-700"
            >
              {t("common.next")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canAdvance() || submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("common.loading")}</>
              ) : (
                t("common.submit")
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
