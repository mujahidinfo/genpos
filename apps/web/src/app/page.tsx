import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LandingPage } from "@/components/landing/landing-page";

export default async function RootPage() {
  const user = await getSession();
  if (user) redirect("/dashboard");
  return <LandingPage />;
}
