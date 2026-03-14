"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPool } from "@/lib/actions/pools";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewPoolPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("MANAGED");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("type", type);

    const result = await createPool(fd);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Pool created successfully!");
      router.push(`/pools/${result.poolId}`);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pools"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Create a Carbon Pool</h1>
          <p className="text-muted-foreground text-sm">Group small farmers into a bundled carbon project</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">Pool Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Pool name</Label>
              <Input id="name" name="name" placeholder="e.g. Mindanao Agroforestry Collective" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Brief description of the pool's goals..." rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Pool type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANAGED">Managed – You invite and curate farmers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="regionName">Region name (optional)</Label>
              <Input id="regionName" name="regionName" placeholder="e.g. Caraga Region, Northern Mindanao" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="minHectares">Minimum farm size (ha)</Label>
                <Input id="minHectares" name="minHectares" type="number" step="0.1" min="0" defaultValue="0" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="maxMembers">Max members (optional)</Label>
                <Input id="maxMembers" name="maxMembers" type="number" min="1" placeholder="No limit" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? "Creating…" : "Create Pool"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
