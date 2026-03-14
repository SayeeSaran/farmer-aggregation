import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { triggerAutoPooling } from "@/lib/actions/pools";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Zap } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const [users, pools] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.pool.findMany({ include: { _count: { select: { memberships: { where: { isActive: true } } } } }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const roleColor: Record<string, string> = {
    FARMER: "bg-green-100 text-green-800",
    AGGREGATOR: "bg-blue-100 text-blue-800",
    VERIFIER: "bg-purple-100 text-purple-800",
    ADMIN: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      {/* Auto-pooling trigger */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />Auto-Pooling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Automatically cluster eligible unassigned farms within 50km into regional pools.
          </p>
          <form action={async () => {
            "use server";
            await triggerAutoPooling();
          }}>
            <Button type="submit" variant="outline" className="text-yellow-700 border-yellow-300">
              <Zap className="h-4 w-4 mr-2" />Run Auto-Pooling
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                <div>
                  <span className="font-medium">{user.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{user.email}</span>
                </div>
                <Badge className={`text-xs ${roleColor[user.role]}`}>{user.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pools ({pools.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pools.map((pool) => (
              <div key={pool.id} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                <div>
                  <span className="font-medium">{pool.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{pool._count.memberships} members · {pool.totalHectares.toFixed(1)} ha</span>
                </div>
                <div className="flex gap-1.5">
                  <Badge className="text-xs bg-gray-100 text-gray-700">{pool.type.replace("_", " ")}</Badge>
                  <Badge className="text-xs bg-blue-100 text-blue-800">{pool.status.replace("_", " ")}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
