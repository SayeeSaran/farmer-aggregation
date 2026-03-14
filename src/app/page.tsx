import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TreePine, CheckCircle2, Users, Activity, Leaf } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TreePine className="h-6 w-6 text-green-600" />
            <span className="font-bold text-lg">CarbonFarm</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild><Link href="/login">Sign in</Link></Button>
            <Button className="bg-green-600 hover:bg-green-700" asChild><Link href="/register">Get started</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">
          <Leaf className="h-3.5 w-3.5" />
          Verra VM0047 · ARR Carbon Credits
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
          Turn your plantation into<br />
          <span className="text-green-600">verified carbon credits</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Check your eligibility for Verra VM0047 carbon credits, join a pool with neighbouring farmers to bundle small landholdings into one certified project, and track your plantation with satellite-powered dMRV.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" className="bg-green-600 hover:bg-green-700" asChild>
            <Link href="/register">Start Eligibility Check</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: CheckCircle2,
            color: "text-green-600 bg-green-50",
            title: "Eligibility Checker",
            desc: "Answer a guided questionnaire. Our engine scores your farm against 5 VM0047 criteria and tells you exactly where you stand.",
          },
          {
            icon: Users,
            color: "text-blue-600 bg-blue-50",
            title: "Carbon Pools",
            desc: "Too small to register alone? Join a pool of nearby farmers. Bundle hectares across the group for a single large carbon project.",
          },
          {
            icon: Activity,
            color: "text-purple-600 bg-purple-50",
            title: "Satellite dMRV",
            desc: "Sentinel-2 satellite imagery tracks NDVI across your plantation monthly. Automatically detects growth, anomalies, and deforestation.",
          },
          {
            icon: Leaf,
            color: "text-emerald-600 bg-emerald-50",
            title: "Carbon Estimation",
            desc: "Get an indicative estimate of your annual and cumulative CO₂e sequestration based on species, area, and crediting period.",
          },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="space-y-3">
            <div className={`inline-flex p-3 rounded-xl ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-green-600 text-white py-16 text-center">
        <div className="max-w-2xl mx-auto px-6 space-y-4">
          <h2 className="text-3xl font-bold">Ready to join the carbon economy?</h2>
          <p className="text-green-100">Register your farm in minutes and find out if you qualify for carbon credit income.</p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">Create Your Account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>CarbonFarm · Verra VM0047 ARR Platform · Built for smallholder farmers</p>
      </footer>
    </div>
  );
}
