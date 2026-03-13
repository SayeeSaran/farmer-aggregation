import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EligibilityWizard } from "@/components/eligibility/eligibility-wizard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Leaf } from "lucide-react";

export default async function EligibilityPage({
  searchParams,
}: {
  searchParams: Promise<{ farmId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { farmId } = await searchParams;

  if (farmId) {
    const farm = await prisma.farm.findFirst({
      where: { id: farmId, ownerId: session.user.id },
    });
    if (farm) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Eligibility Assessment</h1>
            <p className="text-muted-foreground">Verra VM0047 – Afforestation, Reforestation & Revegetation</p>
          </div>
          <EligibilityWizard farm={{
            id: farm.id,
            name: farm.name,
            sizeHectares: farm.sizeHectares,
            yearsNonForest: farm.yearsNonForest,
            speciesPlanned: farm.speciesPlanned,
            ownershipDocUrl: farm.ownershipDocUrl,
          }} />
        </div>
      );
    }
  }

  // Show farm selector
  const farms = await prisma.farm.findMany({
    where: { ownerId: session.user.id },
    include: {
      eligibilityAssessments: { orderBy: { assessedAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Eligibility Assessment</h1>
        <p className="text-muted-foreground">Select a farm to assess for Verra VM0047 carbon credits</p>
      </div>

      {farms.length === 0 ? (
        <Card className="text-center py-10">
          <CardContent>
            <Leaf className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No farms registered yet</p>
            <p className="text-sm text-muted-foreground mb-4">Register a farm first to run an eligibility check.</p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/farms/new">Register a Farm</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {farms.map((farm) => {
            const assessed = farm.eligibilityAssessments[0];
            return (
              <Link key={farm.id} href={`/eligibility?farmId=${farm.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-4">
                    <p className="font-medium">{farm.name}</p>
                    <p className="text-sm text-muted-foreground">{farm.sizeHectares} ha</p>
                    {assessed ? (
                      <p className="text-xs mt-1 text-muted-foreground">
                        Last assessed: {assessed.status.replace("_", " ")} ({assessed.overallScore.toFixed(0)}/100)
                      </p>
                    ) : (
                      <p className="text-xs mt-1 text-green-600 font-medium">→ Start assessment</p>
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
