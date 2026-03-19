"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Loader2, X } from "lucide-react";
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

export function Questionnaire() {
  const { t } = useTranslation();
  const router = useRouter();
  const [section, setSection] = useState(1);
  const [submitting, setSubmitting] = useState(false);

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

  const toggleSpecies = (species: string) => {
    setData((prev) => {
      const current = prev.speciesTypes ?? [];
      if (current.includes(species)) {
        return { ...prev, speciesTypes: current.filter((s) => s !== species) };
      }
      return { ...prev, speciesTypes: [...current, species] };
    });
  };

  const canAdvance = (): boolean => {
    switch (section) {
      case 1: return !!data.country && !!data.landAreaHa && data.landAreaHa > 0 && !!data.activityType;
      case 2: return !!data.managedForest && !!data.timberHarvest && !!data.woodyBiomassRemoval && !!data.preExistingCover;
      case 3: return !!data.ownershipType && data.documentedRights !== undefined && !!data.creditingPeriod && !!data.regulatorySurplus;
      case 4: return !!data.treeDensity && data.treeDensity > 0 && !!data.landUseContinuity;
      case 5: return (data.speciesTypes?.length ?? 0) > 0 && !!data.climateZone;
      default: return false;
    }
  };

  const handleSubmit = () => {
    setSubmitting(true);
    sessionStorage.setItem("questionnaire", JSON.stringify(data));
    router.push("/screen/results");
  };

  const progress = (section / TOTAL_SECTIONS) * 100;

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
                onChange={(e) => update("country", e.target.value)}
              >
                <option value="">{t("questionnaire.section1.countryPlaceholder")}</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section1.landArea")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={data.landAreaHa || ""}
                  onChange={(e) => update("landAreaHa", parseFloat(e.target.value) || 0)}
                  className="max-w-[150px]"
                />
                <span className="text-sm text-muted-foreground">{t("questionnaire.section1.landAreaUnit")}</span>
              </div>
              <HelpText>{t("questionnaire.section1.landAreaHelp")}</HelpText>
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
                      {t(`questionnaire.section5.${s}`)}
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
                  .filter((s) => !(data.speciesTypes ?? []).includes(s))
                  .map((s) => (
                    <option key={s} value={s}>{t(`questionnaire.section5.${s}`)}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>{t("questionnaire.section5.climateZone")}</Label>
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
