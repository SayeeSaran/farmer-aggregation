import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Leaf, Users, Activity, CheckCircle2, ArrowRight, TreePine, TrendingUp, FileText } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;

  if (role === "FARMER") {
    const farms = await prisma.farm.findMany({
      where: { ownerId: session.user.id },
      include: {
        eligibilityAssessments: { orderBy: { assessedAt: "desc" }, take: 1 },
        poolMemberships: { where: { isActive: true }, include: { pool: { select: { name: true, id: true } } } },
        carbonEstimates: { orderBy: { estimationDate: "desc" }, take: 1 },
      },
    });

    const totalHa = farms.reduce((s, f) => s + f.sizeHectares, 0);
    const eligible = farms.filter((f) => f.eligibilityAssessments[0]?.status === "ELIGIBLE").length;
    const totalCredits = farms.reduce((s, f) => s + (f.carbonEstimates[0]?.totalSequestrationT ?? 0), 0);
    const inPool = farms.filter((f) => f.poolMemberships.length > 0).length;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {session.user.name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground">Your carbon farming overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Leaf, label: "Total Farms", value: farms.length, color: "text-green-600" },
            { icon: TreePine, label: "Total Hectares", value: `${totalHa.toFixed(1)} ha`, color: "text-emerald-600" },
            { icon: CheckCircle2, label: "Eligible Farms", value: eligible, color: "text-blue-600" },
            { icon: TrendingUp, label: "Est. Credits", value: `${totalCredits.toFixed(0)} tCO₂e`, color: "text-purple-600" },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label}>
              <CardContent className="pt-4">
                <Icon className={`h-5 w-5 ${color} mb-2`} />
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        {farms.length === 0 ? (
          <Card className="border-dashed border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center space-y-3">
              <TreePine className="h-10 w-10 text-green-600 mx-auto" />
              <p className="font-medium">Get started with CarbonFarm</p>
              <p className="text-sm text-muted-foreground">Register your plantation to check carbon credit eligibility</p>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/farms/new">Register Your First Farm <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {farms.slice(0, 4).map((farm) => {
              const assessment = farm.eligibilityAssessments[0];
              const pool = farm.poolMemberships[0]?.pool;
              return (
                <Card key={farm.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{farm.name}</CardTitle>
                      {assessment ? (
                        <Badge className={
                          assessment.status === "ELIGIBLE" ? "bg-green-100 text-green-800 text-xs" :
                          assessment.status === "NEEDS_REVIEW" ? "bg-yellow-100 text-yellow-800 text-xs" :
                          "bg-red-100 text-red-800 text-xs"
                        }>{assessment.status.replace("_", " ")}</Badge>
                      ) : <Badge variant="outline" className="text-xs">Unassessed</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>{farm.sizeHectares} ha · {farm.yearsNonForest} yrs non-forest</p>
                    {pool && <p className="text-blue-600 text-xs">Pool: {pool.name}</p>}
                    {!assessment && (
                      <Button asChild size="sm" className="mt-1 bg-green-600 hover:bg-green-700 h-7 text-xs">
                        <Link href={`/eligibility?farmId=${farm.id}`}>Check Eligibility</Link>
                      </Button>
                    )}
                    {assessment?.status === "ELIGIBLE" && inPool === 0 && (
                      <Button asChild size="sm" variant="outline" className="mt-1 h-7 text-xs">
                        <Link href="/pools">Join a Pool</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (role === "AGGREGATOR") {
    const pools = await prisma.pool.findMany({
      where: { managerId: session.user.id },
      include: { _count: { select: { memberships: { where: { isActive: true } } } } },
    });
    const totalFarmers = pools.reduce((s, p) => s + p._count.memberships, 0);
    const totalHa = pools.reduce((s, p) => s + p.totalHectares, 0);
    const totalCredits = pools.reduce((s, p) => s + p.estimatedCredits, 0);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Aggregator Dashboard</h1>
          <p className="text-muted-foreground">Manage your carbon pools and farmer groups</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{pools.length}</p><p className="text-xs text-muted-foreground">Managed Pools</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{totalFarmers}</p><p className="text-xs text-muted-foreground">Total Farmers</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{totalHa.toFixed(1)} ha</p><p className="text-xs text-muted-foreground">Total Land</p></CardContent></Card>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/pools/new"><Users className="h-4 w-4 mr-2" />Create Pool</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/monitoring"><Activity className="h-4 w-4 mr-2" />View dMRV</Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {pools.map((pool) => (
            <Link key={pool.id} href={`/pools/${pool.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{pool.name}</p>
                    <Badge className="text-xs bg-blue-100 text-blue-800">{pool.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{pool._count.memberships} farmers · {pool.totalHectares.toFixed(1)} ha · {pool.estimatedCredits.toFixed(0)} tCO₂e</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (role === "ADMIN") {
    const [userCount, farmCount, poolCount, pendingVerifications] = await Promise.all([
      prisma.user.count(),
      prisma.farm.count(),
      prisma.pool.count(),
      prisma.verificationRecord.count({ where: { status: "PENDING" } }),
    ]);

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{userCount}</p><p className="text-xs text-muted-foreground">Total Users</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{farmCount}</p><p className="text-xs text-muted-foreground">Registered Farms</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{poolCount}</p><p className="text-xs text-muted-foreground">Active Pools</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-yellow-600">{pendingVerifications}</p><p className="text-xs text-muted-foreground">Pending Verifications</p></CardContent></Card>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/admin">Admin Panel</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/monitoring">dMRV Monitor</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pools">All Pools</Link>
          </Button>
        </div>
      </div>
    );
  }

  // VERIFIER
  const pendingCount = await prisma.verificationRecord.count({ where: { status: "PENDING" } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Verifier Dashboard</h1>
      <Card>
        <CardContent className="pt-4">
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-muted-foreground">Records pending verification</p>
          <Button asChild className="mt-3 bg-green-600 hover:bg-green-700">
            <Link href="/verification"><FileText className="h-4 w-4 mr-2" />Open Verification Queue</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
