import { redirect } from "next/navigation";
import { getAssessment } from "@/lib/actions/eligibility";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Leaf } from "lucide-react";

const statusConfig = {
  ELIGIBLE: { color: "bg-green-100 text-green-800", icon: CheckCircle2, iconColor: "text-green-600", label: "Eligible" },
  NEEDS_REVIEW: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle, iconColor: "text-yellow-600", label: "Needs Review" },
  INELIGIBLE: { color: "bg-red-100 text-red-800", icon: XCircle, iconColor: "text-red-600", label: "Ineligible" },
  PENDING: { color: "bg-gray-100 text-gray-700", icon: AlertCircle, iconColor: "text-gray-600", label: "Pending" },
};

export default async function EligibilityResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assessment = await getAssessment(id);
  if (!assessment) redirect("/eligibility");

  const config = statusConfig[assessment.status] ?? statusConfig.PENDING;
  const StatusIcon = config.icon;
  const details = assessment.criteriaDetails as Record<string, { passed: boolean; score: number; weight: number; reason: string }>;
  const estimate = assessment.farm.carbonEstimates[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header result */}
      <Card>
        <CardContent className="pt-6 pb-4 text-center space-y-3">
          <StatusIcon className={`h-14 w-14 mx-auto ${config.iconColor}`} />
          <div>
            <Badge className={`text-sm px-3 py-1 ${config.color}`}>{config.label}</Badge>
          </div>
          <div>
            <p className="text-4xl font-bold">{assessment.overallScore.toFixed(0)}<span className="text-xl text-muted-foreground">/100</span></p>
            <p className="text-muted-foreground text-sm">VM0047 Eligibility Score</p>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {assessment.status === "ELIGIBLE" && "Your farm meets the VM0047 criteria. You can now join a Carbon Pool or register an individual project."}
            {assessment.status === "NEEDS_REVIEW" && "Your farm shows potential. A project developer will need to conduct a more detailed assessment before registration."}
            {assessment.status === "INELIGIBLE" && "Your farm does not currently meet mandatory VM0047 criteria. See the details below to understand what needs to change."}
          </p>
        </CardContent>
      </Card>

      {/* Criteria breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Criteria Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(details).map(([key, criterion]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {criterion.passed
                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                    : <XCircle className="h-4 w-4 text-red-500" />}
                  <span className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Weight: {criterion.weight}%</span>
                  <span className={`font-bold ${criterion.score >= 70 ? "text-green-700" : criterion.score >= 50 ? "text-yellow-700" : "text-red-600"}`}>
                    {criterion.score.toFixed(0)}/100
                  </span>
                </div>
              </div>
              <div className="ml-6">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${criterion.score >= 70 ? "bg-green-500" : criterion.score >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                    style={{ width: `${criterion.score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{criterion.reason}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Carbon estimate */}
      {estimate && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4 text-green-600" />
              Carbon Sequestration Estimate
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Annual sequestration</p>
              <p className="text-xl font-bold text-green-700">{estimate.annualSequestrationT.toFixed(1)} tCO₂e</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total over crediting period</p>
              <p className="text-xl font-bold text-green-700">{estimate.totalSequestrationT.toFixed(1)} tCO₂e</p>
            </div>
            <div className="col-span-2 text-xs text-muted-foreground">
              Methodology: VM0047 simplified allometric model. Confidence: {estimate.confidenceLevel?.toFixed(0)}%. This is an indicative estimate only.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {assessment.status === "ELIGIBLE" && (
            <>
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href="/pools">Browse Carbon Pools <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
              <p className="text-xs text-muted-foreground text-center">Join a pool with other eligible farmers to bundle your project for larger-scale registration.</p>
            </>
          )}
          {assessment.status === "NEEDS_REVIEW" && (
            <>
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href="/pools">Join a Pool Anyway <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/reports/new">Submit Additional Evidence</Link>
              </Button>
            </>
          )}
          {assessment.status === "INELIGIBLE" && (
            <>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/eligibility?farmId=${assessment.farmId}`}>Re-run Assessment</Link>
              </Button>
              <p className="text-xs text-muted-foreground text-center">Review the failed criteria above. You may re-run the assessment once conditions are met.</p>
            </>
          )}
          <Button asChild variant="ghost" className="w-full">
            <Link href="/farms">Back to My Farms</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
