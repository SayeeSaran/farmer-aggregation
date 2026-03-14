import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPoolDetail, joinPool, leavePool } from "@/lib/actions/pools";
import { getMyFarms } from "@/lib/actions/farms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Leaf, TrendingUp, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import FarmMap from "@/components/maps/farm-map";

const statusColor: Record<string, string> = {
  FORMING: "bg-blue-100 text-blue-800",
  VALIDATION: "bg-yellow-100 text-yellow-800",
  REGISTERED: "bg-purple-100 text-purple-800",
  MONITORING: "bg-green-100 text-green-800",
  CREDIT_ISSUED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-gray-100 text-gray-700",
};

export default async function PoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const pool = await getPoolDetail(id);
  if (!pool) redirect("/pools");

  const myFarms = session.user.role === "FARMER" ? await getMyFarms() : [];
  const memberFarmIds = pool.memberships.map((m) => m.farmId);
  const myEligibleFarms = myFarms.filter(
    (f) => !memberFarmIds.includes(f.id) &&
      f.eligibilityAssessments.some((a) => ["ELIGIBLE", "NEEDS_REVIEW"].includes(a.status))
  );
  const myMemberFarms = myFarms.filter((f) => memberFarmIds.includes(f.id));

  const mapMarkers = pool.memberships.map((m) => ({
    lat: m.farm.latitude,
    lng: m.farm.longitude,
    label: m.farm.name,
  }));

  const avgLat = mapMarkers.length > 0 ? mapMarkers.reduce((s, m) => s + m.lat, 0) / mapMarkers.length : 14;
  const avgLng = mapMarkers.length > 0 ? mapMarkers.reduce((s, m) => s + m.lng, 0) / mapMarkers.length : 108;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pools"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{pool.name}</h1>
            <Badge className={statusColor[pool.status]}>{pool.status.replace("_", " ")}</Badge>
          </div>
          {pool.regionName && <p className="text-sm text-muted-foreground">{pool.regionName}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-2xl font-bold">{pool.memberships.length}</p>
            <p className="text-xs text-muted-foreground">Farmers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Leaf className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-bold">{pool.totalHectares.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Hectares</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-bold">{pool.estimatedCredits.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">tCO₂e est.</p>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      {mapMarkers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Member Farm Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FarmMap
              lat={avgLat}
              lng={avgLng}
              markers={mapMarkers}
              readonly
              height="280px"
            />
          </CardContent>
        </Card>
      )}

      {/* Join actions for farmers */}
      {session.user.role === "FARMER" && pool.status === "FORMING" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Join this Pool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myMemberFarms.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700">Your farms in this pool:</p>
                {myMemberFarms.map((farm) => (
                  <div key={farm.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                    <span>{farm.name} ({farm.sizeHectares} ha)</span>
                    <form action={async () => {
                      "use server";
                      await leavePool(id, farm.id);
                    }}>
                      <Button type="submit" variant="outline" size="sm" className="text-red-600 border-red-200">Leave</Button>
                    </form>
                  </div>
                ))}
              </div>
            )}
            {myEligibleFarms.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Eligible farms you can add:</p>
                {myEligibleFarms.map((farm) => (
                  <div key={farm.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                    <div>
                      <span className="font-medium">{farm.name}</span>
                      <span className="text-muted-foreground ml-2">{farm.sizeHectares} ha</span>
                    </div>
                    <form action={async () => {
                      "use server";
                      await joinPool(id, farm.id);
                    }}>
                      <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">Join Pool</Button>
                    </form>
                  </div>
                ))}
              </div>
            ) : myMemberFarms.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                <p>You have no eligible farms to add to this pool.</p>
                <Link href="/eligibility" className="text-green-600 hover:underline">Run an eligibility check first →</Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pool Members</CardTitle>
        </CardHeader>
        <CardContent>
          {pool.memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="space-y-2">
              {pool.memberships.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{m.farm.name}</p>
                    <p className="text-xs text-muted-foreground">{m.farm.owner.name} · {m.farm.sizeHectares} ha</p>
                  </div>
                  <div className="text-right">
                    {m.farm.eligibilityAssessments[0] && (
                      <Badge className={
                        m.farm.eligibilityAssessments[0].status === "ELIGIBLE" ? "bg-green-100 text-green-800 text-xs" :
                        "bg-yellow-100 text-yellow-800 text-xs"
                      }>
                        {m.farm.eligibilityAssessments[0].status.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
