"use client";

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = i18n.language;

  const toggle = () => {
    const next = current === "ta" ? "en" : "ta";
    i18n.changeLanguage(next);
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
    >
      <Globe className="h-4 w-4" />
      <span>{current === "ta" ? t("common.english") : t("common.tamil")}</span>
    </button>
  );
}
