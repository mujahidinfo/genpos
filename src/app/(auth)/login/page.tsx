"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = trpc.auth.login.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
    onError: (err) => {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">GenPOS</h1>
          <p className="text-muted-foreground text-sm">Point of Sale for modern shops</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          Demo: <span className="font-medium">admin@demo.com</span> / admin123
        </p>
      </div>
    </div>
  );
}
