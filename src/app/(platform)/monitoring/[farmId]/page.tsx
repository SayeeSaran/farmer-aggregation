import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Satellite, Camera, AlertTriangle } from "lucide-react";
import { NdviChart } from "@/components/monitoring/ndvi-chart";
import { classifyNdvi } from "@/lib/utils/constants";

export default async function FarmMonitoringPage({ params }: { params: Promise<{ farmId: string }> }) {
  const { farmId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const farm = await prisma.farm.findFirst({
    where: {
      id: farmId,
      ...(session.user.role === "FARMER" ? { ownerId: session.user.id } : {}),
    },
    include: {
      owner: { select: { name: true } },
      monitoringReports: { orderBy: { captureDate: "asc" } },
      farmerReports: {
        orderBy: { reportDate: "desc" },
        take: 10,
        include: { verificationRecords: { take: 1 } },
      },
      carbonEstimates: { orderBy: { estimationDate: "desc" }, take: 1 },
    },
  });

  if (!farm) redirect("/monitoring");

  const chartData = farm.monitoringReports.map((r) => ({
    date: new Date(r.captureDate).toLocaleDateString("en", { month: "short", year: "2-digit" }),
    ndvi: r.ndviValue ?? 0,
  }));

  const latestMonitoring = farm.monitoringReports[farm.monitoringReports.length - 1];
  const anomalies = farm.monitoringReports.filter((r) => r.changeDetected);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/monitoring"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">{farm.name}</h1>
          <p className="text-sm text-muted-foreground">{farm.sizeHectares} ha · {farm.owner.name}</p>
        </div>
      </div>

      {/* Current status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Current NDVI</p>
            {latestMonitoring?.ndviValue != null ? (
              <>
                <p className="text-2xl font-bold text-green-700">{latestMonitoring.ndviValue.toFixed(3)}</p>
                <p className="text-xs text-muted-foreground">{classifyNdvi(latestMonitoring.ndviValue)}</p>
              </>
            ) : <p className="text-muted-foreground text-sm">No data yet</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Monitoring Records</p>
            <p className="text-2xl font-bold">{farm.monitoringReports.length}</p>
            <p className="text-xs text-muted-foreground">satellite captures</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Field Reports</p>
            <p className="text-2xl font-bold">{farm.farmerReports.length}</p>
            <p className="text-xs text-muted-foreground">submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Change Events</p>
            <p className={`text-2xl font-bold ${anomalies.length > 0 ? "text-red-600" : "text-green-600"}`}>
              {anomalies.length}
            </p>
            <p className="text-xs text-muted-foreground">detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Satellite NDVI chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Satellite className="h-4 w-4" /> NDVI Time Series (Sentinel-2)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <NdviChart data={chartData} />
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center space-y-2">
                <Satellite className="h-8 w-8 mx-auto text-muted-foreground" />
                <p>No satellite data yet. Connect your Sentinel Hub API credentials to enable monitoring.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" /> Change Events Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {anomalies.map((r) => (
              <div key={r.id} className="text-sm border-b border-red-100 pb-2 last:border-0">
                <span className="font-medium">{new Date(r.captureDate).toLocaleDateString()}</span>
                <span className="text-muted-foreground ml-2">{r.changeType}</span>
                <span className="ml-2">NDVI: {r.ndviValue?.toFixed(3)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Farmer reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" /> Field Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {farm.farmerReports.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-sm text-muted-foreground">No field reports submitted yet.</p>
              {session.user.role === "FARMER" && (
                <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                  <Link href={`/reports/new?farmId=${farm.id}`}>Submit Report</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {farm.farmerReports.map((report) => {
                const verification = report.verificationRecords[0];
                return (
                  <div key={report.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                    <div>
                      <span className="font-medium">{report.reportType.replace("_", " ")}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{new Date(report.reportDate).toLocaleDateString()}</span>
                    </div>
                    {verification && (
                      <Badge className={
                        verification.status === "APPROVED" ? "bg-green-100 text-green-800 text-xs" :
                        verification.status === "REJECTED" ? "bg-red-100 text-red-800 text-xs" :
                        verification.status === "FLAGGED" ? "bg-orange-100 text-orange-800 text-xs" :
                        "bg-gray-100 text-gray-700 text-xs"
                      }>{verification.status}</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carbon estimate */}
      {farm.carbonEstimates[0] && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Annual sequestration</p>
              <p className="text-lg font-bold text-green-700">{farm.carbonEstimates[0].annualSequestrationT.toFixed(1)} tCO₂e/yr</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total (crediting period)</p>
              <p className="text-lg font-bold text-green-700">{farm.carbonEstimates[0].totalSequestrationT.toFixed(1)} tCO₂e</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
