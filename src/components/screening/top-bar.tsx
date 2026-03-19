"use client";

import { useTranslation } from "react-i18next";
import { TreePine, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import Link from "next/link";

export function TopBar() {
  const { t } = useTranslation();

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <TreePine className="h-6 w-6 text-green-600" />
          <span className="font-bold text-lg">{t("common.appName")}</span>
        </Link>
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
  );
}
