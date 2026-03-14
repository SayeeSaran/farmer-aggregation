"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon in Next.js
const markerIcon = typeof window !== "undefined"
  ? L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    })
  : null;

interface Props {
  lat?: number;
  lng?: number;
  onSelect?: (lat: number, lng: number) => void;
  readonly?: boolean;
  markers?: { lat: number; lng: number; label?: string }[];
  height?: string;
}

function ClickHandler({ onSelect }: { onSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function FarmMap({ lat, lng, onSelect, readonly, markers, height = "300px" }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div style={{ height }} className="bg-muted rounded-md animate-pulse" />;

  const center: [number, number] = lat && lng ? [lat, lng] : [14.0, 108.0]; // SE Asia default

  return (
    <MapContainer
      center={center}
      zoom={lat && lng ? 12 : 5}
      style={{ height, width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {!readonly && <ClickHandler onSelect={onSelect} />}
      {lat && lng && markerIcon && (
        <Marker position={[lat, lng]} icon={markerIcon} />
      )}
      {markers?.map((m, i) =>
        markerIcon ? (
          <Marker key={i} position={[m.lat, m.lng]} icon={markerIcon} />
        ) : null
      )}
    </MapContainer>
  );
}
