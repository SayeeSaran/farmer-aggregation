"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicFarmMap } from "@/components/maps/map-provider";
import { createFarm } from "@/lib/actions/farms";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

const LAND_USE_OPTIONS = [
  { value: "CROPLAND", label: "Cropland" },
  { value: "GRASSLAND", label: "Grassland / Pasture" },
  { value: "DEGRADED", label: "Degraded land" },
  { value: "BARREN", label: "Barren land" },
  { value: "SHRUBLAND", label: "Shrubland / Bush" },
  { value: "WETLAND", label: "Wetland" },
  { value: "OTHER", label: "Other" },
];

export default function NewFarmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [landUse, setLandUse] = useState("");
  const [species, setSpecies] = useState<string[]>([]);
  const [speciesInput, setSpeciesInput] = useState("");

  function addSpecies() {
    const s = speciesInput.trim();
    if (s && !species.includes(s)) setSpecies([...species, s]);
    setSpeciesInput("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lat || !lng) { toast.error("Please select a farm location on the map."); return; }
    if (!landUse) { toast.error("Please select land use history."); return; }
    if (species.length === 0) { toast.error("Please add at least one species."); return; }

    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("latitude", lat.toString());
    fd.set("longitude", lng.toString());
    fd.set("landUseHistory", landUse);
    fd.set("speciesPlanned", JSON.stringify(species));

    const result = await createFarm(fd);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Farm registered successfully!");
      router.push("/farms");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Register a New Farm</h1>
        <p className="text-muted-foreground">Add your plantation for eligibility assessment</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Farm name</Label>
              <Input id="name" name="name" placeholder="e.g. Dela Cruz Plantation" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="sizeHectares">Size (hectares)</Label>
                <Input id="sizeHectares" name="sizeHectares" type="number" step="0.01" min="0.01" placeholder="2.5" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="yearsNonForest">Years as non-forest</Label>
                <Input id="yearsNonForest" name="yearsNonForest" type="number" min="0" placeholder="15" required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Farm Location
            </CardTitle>
            <CardDescription>Click on the map to set your farm&apos;s location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DynamicFarmMap
              lat={lat}
              lng={lng}
              onSelect={(la, lo) => { setLat(la); setLng(lo); }}
              height="280px"
            />
            {lat && lng && (
              <p className="text-sm text-muted-foreground">
                Selected: {lat.toFixed(6)}°, {lng.toFixed(6)}°
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Land & Vegetation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Current land use history</Label>
              <Select onValueChange={setLandUse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select land use type" />
                </SelectTrigger>
                <SelectContent>
                  {LAND_USE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="currentVegetation">Current vegetation description</Label>
              <Textarea
                id="currentVegetation"
                name="currentVegetation"
                placeholder="Describe the current state of the land..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Species planned for planting</Label>
              <div className="flex gap-2">
                <Input
                  value={speciesInput}
                  onChange={(e) => setSpeciesInput(e.target.value)}
                  placeholder="e.g. Teak, Eucalyptus"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpecies(); } }}
                />
                <Button type="button" variant="outline" onClick={addSpecies}>Add</Button>
              </div>
              {species.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {species.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-sm px-2 py-0.5 rounded-full border border-green-200">
                      {s}
                      <button type="button" onClick={() => setSpecies(species.filter((x) => x !== s))} className="text-green-500 hover:text-green-700">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled={loading}>
          {loading ? "Registering farm…" : "Register Farm"}
        </Button>
      </form>
    </div>
  );
}
