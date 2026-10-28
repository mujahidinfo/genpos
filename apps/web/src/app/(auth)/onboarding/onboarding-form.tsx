"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const CURRENCIES = [
  { code: "BDT", label: "৳ BDT" },
  { code: "INR", label: "₹ INR" },
  { code: "PKR", label: "₨ PKR" },
  { code: "USD", label: "$ USD" },
];

export function OnboardingForm({ firstName }: { firstName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("BDT");

  const createBusiness = trpc.auth.createBusiness.useMutation({
    onSuccess: () => {
      router.push("/sales");
      router.refresh();
    },
    onError: (err) => {
      toast({ title: "Couldn’t create your shop", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {firstName}</h1>
          <p className="text-muted-foreground text-sm">Set up your shop — you can change this later.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Your shop</CardTitle>
            <CardDescription>You can add more branches any time.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                createBusiness.mutate({ name: name.trim(), phone: phone.trim() || undefined, currency });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="shop-name">Shop name</Label>
                <Input
                  id="shop-name"
                  autoFocus
                  placeholder="e.g. Rahim Store"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-phone">Shop phone (optional)</Label>
                <Input
                  id="shop-phone"
                  type="tel"
                  placeholder="Printed on receipts"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Currency</legend>
                <div className="flex flex-wrap gap-2">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      aria-pressed={currency === c.code}
                      onClick={() => setCurrency(c.code)}
                      className={cn(
                        "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                        currency === c.code
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-muted",
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <Button type="submit" className="w-full" disabled={!name.trim() || createBusiness.isPending}>
                {createBusiness.isPending ? "Setting up..." : "Start selling"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
