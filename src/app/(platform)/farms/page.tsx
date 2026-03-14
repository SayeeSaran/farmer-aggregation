import Link from "next/link";
import { getMyFarms } from "@/lib/actions/farms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Ruler, TreePine } from "lucide-react";

const statusColor: Record<string, string> = {
  ELIGIBLE: "bg-green-100 text-green-800",
  NEEDS_REVIEW: "bg-yellow-100 text-yellow-800",
  INELIGIBLE: "bg-red-100 text-red-800",
  PENDING: "bg-gray-100 text-gray-700",
};

export default async function FarmsPage() {
  const farms = await getMyFarms();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Farms</h1>
          <p className="text-muted-foreground">{farms.length} registered plantation{farms.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/farms/new"><Plus className="h-4 w-4 mr-2" />Add Farm</Link>
        </Button>
      </div>

      {farms.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No farms registered yet</p>
            <p className="text-muted-foreground text-sm mb-4">Add your first plantation to begin the eligibility process.</p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/farms/new">Register a Farm</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {farms.map((farm) => {
            const latestAssessment = farm.eligibilityAssessments[0];
            const pool = farm.poolMemberships[0]?.pool;
            return (
              <Card key={farm.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{farm.name}</CardTitle>
                    {latestAssessment ? (
                      <Badge className={statusColor[latestAssessment.status]}>
                        {latestAssessment.status.replace("_", " ")}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not assessed</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Ruler className="h-3.5 w-3.5" />
                    {farm.sizeHectares} ha · {farm.landUseHistory.replace("_", " ")}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {farm.latitude.toFixed(4)}°, {farm.longitude.toFixed(4)}°
                  </div>
                  {farm.speciesPlanned.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {farm.speciesPlanned.slice(0, 3).map((s) => (
                        <span key={s} className="bg-green-50 text-green-700 text-xs px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  )}
                  {pool && (
                    <div className="text-xs text-blue-600">
                      Pool: <Link href={`/pools/${pool.id}`} className="hover:underline">{pool.name}</Link>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    {!latestAssessment && (
                      <Button asChild size="sm" variant="outline" className="text-green-700 border-green-200">
                        <Link href={`/eligibility?farmId=${farm.id}`}>Check Eligibility</Link>
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/monitoring/${farm.id}`}>View dMRV</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
