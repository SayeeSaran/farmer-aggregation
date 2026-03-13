import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { classifyNdvi } from "@/lib/utils/constants";

export default async function MonitoringPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = ["ADMIN", "AGGREGATOR", "VERIFIER"].includes(session.user.role);

  const farms = await prisma.farm.findMany({
    where: isAdmin ? {} : { ownerId: session.user.id },
    include: {
      owner: { select: { name: true } },
      monitoringReports: { orderBy: { captureDate: "desc" }, take: 2 },
      eligibilityAssessments: { orderBy: { assessedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">dMRV Monitor</h1>
        <p className="text-muted-foreground">Digital Measurement, Reporting & Verification — satellite and field data</p>
      </div>

      {farms.length === 0 ? (
        <Card className="text-center py-10">
          <CardContent>
            <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No farms to monitor</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => {
            const latest = farm.monitoringReports[0];
            const prev = farm.monitoringReports[1];
            const ndviChange = latest && prev
              ? (latest.ndviValue ?? 0) - (prev.ndviValue ?? 0)
              : null;

            return (
              <Link key={farm.id} href={`/monitoring/${farm.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{farm.name}</CardTitle>
                      {latest?.changeDetected && (
                        <Badge className="bg-red-100 text-red-700 text-xs">Change detected</Badge>
                      )}
                    </div>
                    {isAdmin && <p className="text-xs text-muted-foreground">{farm.owner.name}</p>}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Latest NDVI</span>
                      <div className="flex items-center gap-1">
                        {latest?.ndviValue != null ? (
                          <>
                            <span className={`font-bold ${latest.ndviValue > 0.4 ? "text-green-700" : latest.ndviValue > 0.2 ? "text-yellow-700" : "text-red-600"}`}>
                              {latest.ndviValue.toFixed(3)}
                            </span>
                            {ndviChange != null && (
                              ndviChange > 0.01
                                ? <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                                : ndviChange < -0.01
                                ? <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                : <Minus className="h-3.5 w-3.5 text-gray-400" />
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground text-xs">No data</span>
                        )}
                      </div>
                    </div>
                    {latest?.ndviValue != null && (
                      <>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${latest.ndviValue > 0.4 ? "bg-green-500" : latest.ndviValue > 0.2 ? "bg-yellow-400" : "bg-red-400"}`}
                            style={{ width: `${Math.min(latest.ndviValue * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{classifyNdvi(latest.ndviValue)}</p>
                      </>
                    )}
                    {latest?.captureDate && (
                      <p className="text-xs text-muted-foreground">
                        Last capture: {new Date(latest.captureDate).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
