"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, AlertTriangle, XCircle, TreePine,
  ArrowLeft, Mail, TrendingUp, Ruler, BookOpen,
} from "lucide-react";
import { runMvpEligibility, type QuestionnaireData, type EligibilityResult } from "@/lib/services/mvp-eligibility";
import { estimateCarbonRange, type CarbonEstimate } from "@/lib/services/mvp-carbon-estimate";

const PERIOD_OPTIONS = [20, 30, 50] as const;

function StatusIcon({ status }: { status: "pass" | "flag" | "fail" }) {
  switch (status) {
    case "pass": return <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />;
    case "flag": return <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
    case "fail": return <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
  }
}

function StatusBadge({ status, t }: { status: "pass" | "flag" | "fail"; t: (k: string) => string }) {
  const colors = {
    pass: "bg-green-100 text-green-800",
    flag: "bg-amber-100 text-amber-800",
    fail: "bg-red-100 text-red-800",
  };
  const labels = {
    pass: t("results.pass"),
    flag: t("results.flag"),
    fail: t("results.fail"),
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function ResultsView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [estimate, setEstimate] = useState<CarbonEstimate | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);

  useEffect(() => {
    const stored = sessionStorage.getItem("questionnaire");
    if (!stored) {
      router.push("/screen");
      return;
    }
    const data = JSON.parse(stored) as QuestionnaireData;
    setQuestionnaire(data);

    const eligResult = runMvpEligibility(data);
    setResult(eligResult);

    const est = estimateCarbonRange({
      landAreaHa: data.landAreaHa,
      species: data.speciesTypes,
      climateZone: data.climateZone,
      periodYears: selectedPeriod,
    });
    setEstimate(est);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculate when period changes
  useEffect(() => {
    if (!questionnaire) return;
    const est = estimateCarbonRange({
      landAreaHa: questionnaire.landAreaHa,
      species: questionnaire.speciesTypes,
      climateZone: questionnaire.climateZone,
      periodYears: selectedPeriod,
    });
    setEstimate(est);
  }, [selectedPeriod, questionnaire]);

  if (!result || !estimate || !questionnaire) {
    return null;
  }

  const verdictConfig = {
    ELIGIBLE: {
      icon: <CheckCircle2 className="h-8 w-8 text-green-600" />,
      bg: "bg-green-50 border-green-200",
      title: t("results.eligible"),
      desc: t("results.eligibleDesc"),
    },
    NEEDS_REVIEW: {
      icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
      bg: "bg-amber-50 border-amber-200",
      title: t("results.needsReview"),
      desc: t("results.needsReviewDesc"),
    },
    INELIGIBLE: {
      icon: <XCircle className="h-8 w-8 text-red-500" />,
      bg: "bg-red-50 border-red-200",
      title: t("results.ineligible"),
      desc: t("results.ineligibleDesc"),
    },
  };

  const v = verdictConfig[result.verdict];
  const speciesLabels = questionnaire.speciesTypes
    .map((s) => s.startsWith("custom:") ? s.replace("custom:", "") : t(`questionnaire.section5.${s}`))
    .join(", ");

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* LEFT COLUMN — Verdict + Criteria */}
        <div className="lg:col-span-3 space-y-6">
          {/* Verdict */}
          <Card className={`p-6 border-2 ${v.bg}`}>
            <div className="flex items-start gap-4">
              {v.icon}
              <div>
                <h2 className="text-xl font-bold">{v.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{v.desc}</p>
              </div>
            </div>
          </Card>

          {/* Criteria Breakdown */}
          <div>
            <h3 className="font-semibold mb-3">{t("results.criteriaBreakdown")}</h3>
            <div className="space-y-3">
              {result.criteria.map((c) => (
                <Card key={c.key} className="p-4">
                  <div className="flex items-start gap-3">
                    <StatusIcon status={c.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{t(c.label)}</span>
                        <StatusBadge status={c.status} t={t} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {c.key === "creditingPeriod"
                          ? t(c.reason, { years: result.creditingPeriodYears })
                          : t(c.reason)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Approach indicator */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Ruler className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{t("results.approach")}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {result.approach === "census" ? t("results.censusBased") : t("results.areaBased")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.approach === "census"
                    ? t("results.censusBasedDesc", { density: questionnaire.treeDensity })
                    : t("results.areaBasedDesc", { density: questionnaire.treeDensity })}
                </p>
              </div>
            </div>
          </Card>

          {/* Pooling Explainer */}
          <Card className="p-5 border-green-200 bg-green-50/50">
            <div className="flex items-start gap-3">
              <TreePine className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-green-900 mb-2">{t("results.poolingTitle")}</h4>
                <p className="text-sm text-green-800">
                  {t("results.poolingExplainer", { hectares: questionnaire.landAreaHa })}
                </p>
                <p className="text-xs text-green-700 mt-2">{t("results.poolingNote")}</p>
              </div>
            </div>
          </Card>

          {/* Methodology reference link */}
          <Link
            href="/screen/methodology"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            {t("results.methodologyLink")}
          </Link>

          {/* Start Over */}
          <div>
            <Button
              variant="ghost"
              onClick={() => { sessionStorage.removeItem("questionnaire"); router.push("/screen"); }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.startOver")}
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN — Carbon Estimate Card (sticky) */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <Card className="p-6 border-2 border-green-600">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="font-bold">{t("results.carbonEstimate")}</h3>
              </div>

              {/* Period toggle */}
              <div className="mb-5">
                <p className="text-xs text-muted-foreground mb-2">{t("results.period")}</p>
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                  {PERIOD_OPTIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPeriod(p)}
                      className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
                        selectedPeriod === p
                          ? "bg-green-600 text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p} yr
                    </button>
                  ))}
                </div>
              </div>

              {/* Total credits range */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground">{t("results.totalCredits")}</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatNumber(estimate.totalLow)} – {formatNumber(estimate.totalHigh)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">tCO₂e</span>
                </p>
              </div>

              {/* Annual average */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground">{t("results.annualAverage")}</p>
                <p className="text-lg font-semibold">
                  {formatNumber(estimate.annualLow)} – {formatNumber(estimate.annualHigh)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">tCO₂e/yr</span>
                </p>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4 py-3 border-t border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("results.landArea")}</span>
                  <span className="font-medium">{questionnaire.landAreaHa} ha</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("results.species")}</span>
                  <span className="font-medium text-right max-w-[60%]">{speciesLabels}</span>
                </div>
              </div>

              {/* Price range */}
              <div className="mb-5">
                <p className="text-xs text-muted-foreground">{t("results.priceRange")}</p>
                <p className="text-xl font-bold text-green-700">
                  {formatUsd(estimate.priceLowUsd)} – {formatUsd(estimate.priceHighUsd)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">USD</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t("results.priceDisclaimer")}</p>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground mb-5 italic">{t("common.disclaimer")}</p>

              {/* CTA */}
              <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                <a href="mailto:hello@carbonfarm.io?subject=Carbon Credit Inquiry">
                  <Mail className="h-4 w-4 mr-2" />
                  {t("common.discussNextSteps")}
                </a>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
