/**
 * Calculate great-circle distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/**
 * Compute the centroid of a set of lat/lng points
 */
export function centroid(points: { latitude: number; longitude: number }[]) {
  const lat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.longitude, 0) / points.length;
  return { latitude: lat, longitude: lng };
}

/**
 * Group farms into clusters where all members are within `radiusKm` of each other.
 * Uses a simple greedy approach (good enough for MVP scale).
 */
export function clusterByDistance<T extends { latitude: number; longitude: number }>(
  items: T[],
  radiusKm: number
): T[][] {
  const assigned = new Set<number>();
  const clusters: T[][] = [];

  for (let i = 0; i < items.length; i++) {
    if (assigned.has(i)) continue;
    const cluster: T[] = [items[i]];
    assigned.add(i);

    for (let j = i + 1; j < items.length; j++) {
      if (assigned.has(j)) continue;
      const dist = haversineDistance(
        items[i].latitude, items[i].longitude,
        items[j].latitude, items[j].longitude
      );
      if (dist <= radiusKm) {
        cluster.push(items[j]);
        assigned.add(j);
      }
    }
    clusters.push(cluster);
  }

  return clusters;
}

/**
 * Check if a point is within a bounding box
 */
export function isInBounds(
  lat: number, lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): boolean {
  return lat >= bounds.minLat && lat <= bounds.maxLat &&
    lng >= bounds.minLng && lng <= bounds.maxLng;
}
