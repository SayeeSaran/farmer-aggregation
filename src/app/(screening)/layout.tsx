import { I18nProvider } from "@/components/i18n-provider";
import { TopBar } from "@/components/screening/top-bar";

export default function ScreeningLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-gradient-to-b from-green-50/50 via-white to-white">
        <TopBar />
        <main className="px-4 md:px-6 py-8 md:py-12">
          {children}
        </main>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          CarbonFarm.io · Pre-feasibility screening for VM0047 ARR projects
        </footer>
      </div>
    </I18nProvider>
  );
}
