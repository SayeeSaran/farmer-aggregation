"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitFarmerReport } from "@/lib/actions/reports";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

const REPORT_TYPES = [
  { value: "PLANTING", label: "Planting Activity" },
  { value: "SURVIVAL_ASSESSMENT", label: "Survival Assessment" },
  { value: "GROWTH_MEASUREMENT", label: "Growth Measurement" },
  { value: "MAINTENANCE", label: "Maintenance Activity" },
  { value: "PHOTO_DOCUMENTATION", label: "Photo Documentation" },
];

export default function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("PLANTING");
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [selectedFarm, setSelectedFarm] = useState(searchParams.get("farmId") ?? "");

  useEffect(() => {
    fetch("/api/farms").then((r) => r.json()).then(setFarms).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFarm) { toast.error("Please select a farm."); return; }

    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("farmId", selectedFarm);
    fd.set("reportType", reportType);
    fd.set("speciesPlanted", JSON.stringify([]));

    const result = await submitFarmerReport(fd);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Report submitted successfully!");
      router.push("/monitoring");
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/monitoring"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Submit Field Report</h1>
          <p className="text-sm text-muted-foreground">Document plantation activity for dMRV</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">Report Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Farm</Label>
              <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Report type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {reportType === "PLANTING" && (
              <div className="space-y-1">
                <Label htmlFor="areaPlantedHa">Area planted (ha)</Label>
                <Input id="areaPlantedHa" name="areaPlantedHa" type="number" step="0.01" min="0" placeholder="1.5" />
              </div>
            )}

            {reportType === "SURVIVAL_ASSESSMENT" && (
              <div className="space-y-1">
                <Label htmlFor="survivalRate">Survival rate (%)</Label>
                <Input id="survivalRate" name="survivalRate" type="number" min="0" max="100" placeholder="85" />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="description">Description / Notes</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the activity, observations, or findings..."
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? "Submitting…" : "Submit Report"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
