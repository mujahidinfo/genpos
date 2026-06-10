import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LayoutProvider } from "@/components/layout/layout-provider";
import { MainWrapper } from "@/components/layout/main-wrapper";
import { CurrencyProvider } from "@/lib/currency-context";
import { LanguageProvider } from "@/lib/i18n/language-context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  return (
    <LayoutProvider>
      <LanguageProvider>
      <CurrencyProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar user={user} />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header user={user} />
            <MainWrapper>{children}</MainWrapper>
          </div>
        </div>
      </CurrencyProvider>
      </LanguageProvider>
    </LayoutProvider>
  );
}
