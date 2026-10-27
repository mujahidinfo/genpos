import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LayoutProvider } from "@/components/layout/layout-provider";
import { MainWrapper } from "@/components/layout/main-wrapper";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CurrencyProvider } from "@/lib/currency-context";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  return (
    <LayoutProvider>
      <LanguageProvider>
      <CurrencyProvider>
        {/* h-dvh (not h-screen) so the layout tracks the shrinking viewport when
            mobile browser chrome and the on-screen keyboard appear. */}
        <div className="flex h-dvh overflow-hidden bg-background">
          <Sidebar user={user} />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header user={user} />
            <MainWrapper>{children}</MainWrapper>
          </div>
        </div>
        <MobileBottomNav user={user} />
        <InstallPrompt />
      </CurrencyProvider>
      </LanguageProvider>
    </LayoutProvider>
  );
}
