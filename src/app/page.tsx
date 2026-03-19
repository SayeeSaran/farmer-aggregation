"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { TreePine, Leaf, ClipboardCheck, BarChart3, Mail } from "lucide-react";
import { I18nProvider } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

function Landing() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TreePine className="h-6 w-6 text-green-600" />
            <span className="font-bold text-lg">{t("common.appName")}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:hello@carbonfarm.io?subject=Carbon Credit Inquiry">
                <Mail className="h-4 w-4 mr-1.5" />
                {t("common.contactUs")}
              </a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">
          <Leaf className="h-3.5 w-3.5" />
          {t("landing.badge")}
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
          {t("landing.headline")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t("landing.subheadline")}
        </p>
        <div className="flex flex-col items-center gap-3">
          <Button size="lg" className="bg-green-600 hover:bg-green-700 text-base px-8" asChild>
            <Link href="/screen">{t("landing.cta")}</Link>
          </Button>
          <p className="text-sm text-muted-foreground">{t("landing.noSignup")}</p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">{t("landing.howItWorks")}</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              icon: ClipboardCheck,
              color: "text-green-600 bg-green-50",
              num: "1",
              title: t("landing.step1Title"),
              desc: t("landing.step1Desc"),
            },
            {
              icon: Leaf,
              color: "text-emerald-600 bg-emerald-50",
              num: "2",
              title: t("landing.step2Title"),
              desc: t("landing.step2Desc"),
            },
            {
              icon: BarChart3,
              color: "text-blue-600 bg-blue-50",
              num: "3",
              title: t("landing.step3Title"),
              desc: t("landing.step3Desc"),
            },
          ].map(({ icon: Icon, color, num, title, desc }) => (
            <div key={num} className="text-center space-y-3">
              <div className="flex justify-center">
                <div className={`inline-flex p-4 rounded-2xl ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step {num}
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bg-green-600 text-white py-16 text-center">
        <div className="max-w-2xl mx-auto px-6 space-y-4">
          <h2 className="text-3xl font-bold">{t("landing.headline")}</h2>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/screen">{t("landing.cta")}</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>{t("landing.footer")}</p>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <I18nProvider>
      <Landing />
    </I18nProvider>
  );
}
