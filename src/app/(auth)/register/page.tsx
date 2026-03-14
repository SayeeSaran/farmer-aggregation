"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerUser } from "@/lib/actions/auth";
import { toast } from "sonner";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("FARMER");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("role", role);

    const result = await registerUser(fd);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Account created! Please sign in.");
      router.push("/login");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Join CarbonFarm to access carbon credit services</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" placeholder="Juan dela Cruz" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="farmer@example.com" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" name="phone" type="tel" placeholder="+63 9xx xxx xxxx" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <div className="space-y-1">
            <Label>I am a</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FARMER">Farmer / Landowner</SelectItem>
                <SelectItem value="AGGREGATOR">Project Developer / Aggregator</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === "FARMER"
                ? "Register your farm, check eligibility, and join carbon pools."
                : "Create and manage carbon pools, oversee dMRV for farmer groups."}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-green-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
