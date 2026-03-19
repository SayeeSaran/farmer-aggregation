"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, FlaskConical } from "lucide-react";

function Section({ title, desc, items }: {
  title: string;
  desc: string;
  items: string[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
      <div className="space-y-2 pl-1">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="text-muted-foreground/50 select-none">•</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MethodologyView() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/screen/results">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("methodology.backToResults")}
          </Link>
        </Button>
        <div className="flex items-start gap-3">
          <BookOpen className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h1 className="text-2xl font-bold">{t("methodology.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("methodology.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Section 1 */}
        <Card className="p-6">
          <Section
            title={t("methodology.section1Title")}
            desc={t("methodology.section1Desc")}
            items={[
              t("methodology.countryRef"),
              t("methodology.landAreaRef"),
              t("methodology.activityTypeRef"),
            ]}
          />
        </Card>

        {/* Section 2 */}
        <Card className="p-6">
          <Section
            title={t("methodology.section2Title")}
            desc={t("methodology.section2Desc")}
            items={[
              t("methodology.managedForestRef"),
              t("methodology.timberHarvestRef"),
              t("methodology.woodyBiomassRef"),
              t("methodology.preExistingCoverRef"),
            ]}
          />
        </Card>

        {/* Section 3 */}
        <Card className="p-6">
          <Section
            title={t("methodology.section3Title")}
            desc={t("methodology.section3Desc")}
            items={[
              t("methodology.ownershipRef"),
              t("methodology.creditingPeriodRef"),
              t("methodology.regulatorySurplusRef"),
            ]}
          />
        </Card>

        {/* Section 4 */}
        <Card className="p-6">
          <Section
            title={t("methodology.section4Title")}
            desc={t("methodology.section4Desc")}
            items={[
              t("methodology.treeDensityRef"),
              t("methodology.landUseContinuityRef"),
            ]}
          />
        </Card>

        {/* Section 5 */}
        <Card className="p-6">
          <Section
            title={t("methodology.section5Title")}
            desc={t("methodology.section5Desc")}
            items={[
              t("methodology.speciesRef"),
              t("methodology.climateZoneRef"),
            ]}
          />
        </Card>

        {/* Carbon Method */}
        <Card className="p-6 border-green-200 bg-green-50/30">
          <div className="flex items-start gap-3 mb-4">
            <FlaskConical className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold">{t("methodology.carbonMethodTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("methodology.carbonMethodDesc")}</p>
            </div>
          </div>
          <ol className="space-y-2 pl-1">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <li key={n} className="flex gap-3 text-sm">
                <span className="text-green-600 font-semibold select-none">{n}.</span>
                <span>{t(`methodology.carbonStep${n}`)}</span>
              </li>
            ))}
          </ol>
        </Card>

        {/* Sources */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">{t("methodology.sourceTitle")}</h3>
          <ol className="space-y-2 pl-1 text-sm text-muted-foreground">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="flex gap-3">
                <span className="font-medium select-none">{n}.</span>
                <span>{t(`methodology.source${n}`)}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {/* Back */}
      <div className="mt-8">
        <Button variant="ghost" asChild>
          <Link href="/screen/results">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("methodology.backToResults")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
