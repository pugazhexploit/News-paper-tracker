import { Customer } from '../types';

/**
 * Calculates distance between two GPS coordinates using Haversine formula in meters.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// Memory of recent geofence entries to enforce cooldown & prevent duplicate alerts
const geofenceAlertHistory = new Map<string, number>();

export interface GeofenceCheckResult {
  customer: Customer;
  distanceMeters: number;
  isInside: boolean;
  shouldAlert: boolean;
}

export function checkCustomerGeofences(
  currentLat: number,
  currentLng: number,
  customers: Customer[],
  radiusMeters = 50,
  cooldownSeconds = 120
): GeofenceCheckResult[] {
  const now = Date.now();
  const results: GeofenceCheckResult[] = [];

  for (const customer of customers) {
    if (!customer.isActive) continue;

    const distance = calculateDistanceMeters(
      currentLat,
      currentLng,
      customer.latitude,
      customer.longitude
    );

    const isInside = distance <= radiusMeters;
    let shouldAlert = false;

    if (isInside) {
      const lastAlertTime = geofenceAlertHistory.get(customer.id) || 0;
      if (now - lastAlertTime > cooldownSeconds * 1000) {
        shouldAlert = true;
        geofenceAlertHistory.set(customer.id, now);
      }
    }

    results.push({
      customer,
      distanceMeters: distance,
      isInside,
      shouldAlert,
    });
  }

  // Sort by closest distance
  return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function clearGeofenceCooldown(customerId: string) {
  geofenceAlertHistory.delete(customerId);
}

export function openExternalGoogleMapsNavigation(lat: number, lng: number, label?: string) {
  const destination = encodeURIComponent(`${lat},${lng}`);
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=two_wheeler`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
