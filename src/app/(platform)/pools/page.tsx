import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPools } from "@/lib/actions/pools";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Leaf, TrendingUp, Plus } from "lucide-react";

const statusColor: Record<string, string> = {
  FORMING: "bg-blue-100 text-blue-800",
  VALIDATION: "bg-yellow-100 text-yellow-800",
  REGISTERED: "bg-purple-100 text-purple-800",
  MONITORING: "bg-green-100 text-green-800",
  CREDIT_ISSUED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-gray-100 text-gray-700",
};

const typeColor: Record<string, string> = {
  AUTO_REGIONAL: "bg-orange-100 text-orange-700",
  MANAGED: "bg-indigo-100 text-indigo-700",
};

export default async function PoolsPage() {
  const session = await auth();
  const pools = await getPools();
  const canCreatePool = session?.user?.role && ["AGGREGATOR", "ADMIN"].includes(session.user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Carbon Pools</h1>
          <p className="text-muted-foreground">Join or browse farmer aggregation pools for carbon projects</p>
        </div>
        {canCreatePool && (
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/pools/new"><Plus className="h-4 w-4 mr-2" />Create Pool</Link>
          </Button>
        )}
      </div>

      {pools.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No pools available yet</p>
            <p className="text-sm text-muted-foreground">Pools will appear here as they are created by project developers.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pools.map((pool) => (
            <Link key={pool.id} href={`/pools/${pool.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm leading-tight">{pool.name}</CardTitle>
                    <Badge className={`shrink-0 text-xs ${statusColor[pool.status]}`}>
                      {pool.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <Badge className={`w-fit text-xs ${typeColor[pool.type]}`}>
                    {pool.type === "AUTO_REGIONAL" ? "Auto-Regional" : "Managed"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pool.regionName && (
                    <p className="text-xs text-muted-foreground">{pool.regionName}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted rounded-md p-2">
                      <Users className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                      <p className="text-sm font-bold">{pool._count.memberships}</p>
                      <p className="text-xs text-muted-foreground">Farmers</p>
                    </div>
                    <div className="bg-muted rounded-md p-2">
                      <Leaf className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                      <p className="text-sm font-bold">{pool.totalHectares.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Hectares</p>
                    </div>
                    <div className="bg-muted rounded-md p-2">
                      <TrendingUp className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-0.5" />
                      <p className="text-sm font-bold">{pool.estimatedCredits > 1000 ? `${(pool.estimatedCredits / 1000).toFixed(1)}k` : pool.estimatedCredits.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">tCO₂e</p>
                    </div>
                  </div>
                  {pool.manager && (
                    <p className="text-xs text-muted-foreground">Manager: {pool.manager.name}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
