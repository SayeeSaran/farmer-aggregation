import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingVerifications, verifyRecord } from "@/lib/actions/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Camera, Satellite } from "lucide-react";

export default async function VerificationPage() {
  const session = await auth();
  if (!session?.user || !["VERIFIER", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const records = await getPendingVerifications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verification Queue</h1>
        <p className="text-muted-foreground">{records.length} records pending review</p>
      </div>

      {records.length === 0 ? (
        <Card className="text-center py-10">
          <CardContent>
            <ShieldCheck className="h-10 w-10 text-green-600 mx-auto mb-3" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">No pending verifications.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  {record.farmerReport ? (
                    <Camera className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Satellite className="h-4 w-4 text-purple-600" />
                  )}
                  <CardTitle className="text-sm">
                    {record.farmerReport
                      ? `${record.farmerReport.reportType.replace("_", " ")} – ${record.farmerReport.farm.name}`
                      : `Satellite Report – ${record.monitoringReport?.farm.name}`}
                  </CardTitle>
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-auto">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {record.farmerReport && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Reporter: {record.farmerReport.reporter.name}</p>
                    <p>Date: {new Date(record.farmerReport.reportDate).toLocaleDateString()}</p>
                    {record.farmerReport.survivalRate && <p>Survival rate: {record.farmerReport.survivalRate}%</p>}
                    {record.farmerReport.areaPlantedHa && <p>Area planted: {record.farmerReport.areaPlantedHa} ha</p>}
                  </div>
                )}
                <div className="flex gap-2">
                  <form action={async (fd: FormData) => {
                    "use server";
                    await verifyRecord(record.id, "APPROVED", fd.get("findings") as string || "Verified as accurate.");
                  }}>
                    <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>
                  </form>
                  <form action={async (fd: FormData) => {
                    "use server";
                    await verifyRecord(record.id, "FLAGGED", "Anomaly detected – requires further investigation.");
                  }}>
                    <Button type="submit" size="sm" variant="outline" className="text-orange-600 border-orange-200">Flag</Button>
                  </form>
                  <form action={async (fd: FormData) => {
                    "use server";
                    await verifyRecord(record.id, "REJECTED", "Data does not match satellite observations.");
                  }}>
                    <Button type="submit" size="sm" variant="outline" className="text-red-600 border-red-200">Reject</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
