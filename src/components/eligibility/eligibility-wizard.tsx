"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { submitEligibilityAssessment } from "@/lib/actions/eligibility";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";

interface Farm {
  id: string;
  name: string;
  sizeHectares: number;
  yearsNonForest: number;
  speciesPlanned: string[];
  ownershipDocUrl: string | null;
}

export function EligibilityWizard({ farm }: { farm: Farm }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [creditingPeriod, setCreditingPeriod] = useState(30);
  const [justification, setJustification] = useState("");
  const [hasDoc, setHasDoc] = useState(!!farm.ownershipDocUrl);
  const [selfDeclared, setSelfDeclared] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const stepTitles = [
    "Farm Overview",
    "Crediting Period",
    "Additionality",
    "Land Tenure",
  ];

  async function handleSubmit() {
    if (justification.trim().length < 50) {
      toast.error("Please provide a more detailed additionality justification (minimum 50 characters).");
      return;
    }
    setLoading(true);
    const fd = new FormData();
    fd.set("farmId", farm.id);
    fd.set("creditingPeriodYears", creditingPeriod.toString());
    fd.set("additionalityJustification", justification);
    fd.set("hasOwnershipDoc", hasDoc.toString());
    fd.set("selfDeclaredOwnership", selfDeclared.toString());

    const result = await submitEligibilityAssessment(fd);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Assessment submitted!");
      router.push(`/eligibility/result/${result.assessmentId}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {step} of {totalSteps}: {stepTitles[step - 1]}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Farm Overview</CardTitle>
            <CardDescription>Confirming the basic details of your farm for VM0047 assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted rounded-md p-3">
                <p className="text-muted-foreground text-xs">Farm name</p>
                <p className="font-medium">{farm.name}</p>
              </div>
              <div className="bg-muted rounded-md p-3">
                <p className="text-muted-foreground text-xs">Size</p>
                <p className="font-medium">{farm.sizeHectares} ha</p>
              </div>
              <div className="bg-muted rounded-md p-3">
                <p className="text-muted-foreground text-xs">Years non-forest</p>
                <p className={`font-medium ${farm.yearsNonForest >= 10 ? "text-green-700" : "text-red-600"}`}>
                  {farm.yearsNonForest} years
                  {farm.yearsNonForest >= 10 ? " ✓" : " (min. 10 required)"}
                </p>
              </div>
              <div className="bg-muted rounded-md p-3">
                <p className="text-muted-foreground text-xs">Species planned</p>
                <p className="font-medium">{farm.speciesPlanned.join(", ") || "Not set"}</p>
              </div>
            </div>
            {farm.sizeHectares <= 5 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                Your farm is {farm.sizeHectares} ha. Small farms like yours can join a <strong>Carbon Pool</strong> to bundle with neighbouring farmers for a larger project registration.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="ml-auto bg-green-600 hover:bg-green-700" onClick={() => setStep(2)}>
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Crediting Period</CardTitle>
            <CardDescription>VM0047 allows a crediting period of 20–100 years for ARR projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Selected crediting period: <strong>{creditingPeriod} years</strong></Label>
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={creditingPeriod}
                onChange={(e) => setCreditingPeriod(parseInt(e.target.value))}
                className="w-full accent-green-600"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>20 years (minimum)</span>
                <span>100 years (maximum)</span>
              </div>
            </div>
            <div className="bg-muted rounded-md p-3 text-sm space-y-1">
              <p className="font-medium">What this means:</p>
              <p className="text-muted-foreground">
                Carbon credits will be issued over {creditingPeriod} years. Longer periods mean more total credits but require sustained monitoring and land maintenance.
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setStep(3)}>
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Additionality Justification</CardTitle>
            <CardDescription>Explain why this plantation would NOT happen without carbon credit support</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Describe financial barriers, land degradation, economic conditions, or other reasons why reforestation would not be financially viable without carbon credit income..."
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-between text-xs">
              <p className="text-muted-foreground">Minimum 50 characters. Be specific about financial barriers and local context.</p>
              <span className={justification.length < 50 ? "text-red-500" : "text-green-600"}>
                {justification.length}/50+
              </span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
              <strong>Tips:</strong> Mention income levels, lack of other incentives, land degradation history, or community dependence on this project for livelihoods.
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setStep(4)} disabled={justification.length < 50}>
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Land Tenure</CardTitle>
            <CardDescription>Confirm your ownership or land rights for this plantation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 border rounded-md p-3">
                <Checkbox
                  id="hasDoc"
                  checked={hasDoc}
                  onCheckedChange={(v) => setHasDoc(!!v)}
                />
                <div>
                  <Label htmlFor="hasDoc" className="font-medium cursor-pointer">I have official ownership documentation</Label>
                  <p className="text-xs text-muted-foreground">Title deed, Certificate of Land Ownership Award (CLOA), lease agreement, or equivalent</p>
                </div>
              </div>
              {!hasDoc && (
                <div className="flex items-start gap-3 border rounded-md p-3">
                  <Checkbox
                    id="selfDeclared"
                    checked={selfDeclared}
                    onCheckedChange={(v) => setSelfDeclared(!!v)}
                  />
                  <div>
                    <Label htmlFor="selfDeclared" className="font-medium cursor-pointer">I self-declare ownership / long-term use rights</Label>
                    <p className="text-xs text-muted-foreground">Official documentation will be required before formal project registration</p>
                  </div>
                </div>
              )}
            </div>
            {!hasDoc && !selfDeclared && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                Clear land tenure is a mandatory VM0047 requirement. At minimum, self-declaration is needed to proceed.
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" onClick={() => setStep(3)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={loading || (!hasDoc && !selfDeclared)}
            >
              {loading ? "Submitting…" : <><CheckCircle2 className="h-4 w-4 mr-1" />Submit Assessment</>}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
