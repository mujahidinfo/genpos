import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

/** One step from sign-up to selling: name the shop, pick a currency. */
export default async function OnboardingPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.shop) redirect("/dashboard");
  return <OnboardingForm firstName={user.name.split(" ")[0]} />;
}
