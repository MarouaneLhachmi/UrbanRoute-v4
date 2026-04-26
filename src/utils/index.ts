import { TripRecord } from '../types';

// ============================================================
// FORMATTING
// ============================================================

export function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m.toString().padStart(2, '0')}min` : `${h}h`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatCost(mad: number): string {
  if (mad === 0) return 'Gratuit';
  return `${mad} MAD`;
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

// ============================================================
// COORDINATE HELPERS
// ============================================================

export function toORSCoord(lat: number, lon: number): [number, number] {
  return [lon, lat]; // ORS uses [lon, lat]
}

export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// TRIP HISTORY
// ============================================================

export function generateTripId(): string {
  return `trip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function computeHistoryStats(history: TripRecord[]) {
  const totalDistance = history.reduce((s, t) => s + t.distance, 0);
  const totalCost = history.reduce((s, t) => s + t.cost, 0);
  const avgDuration = history.length > 0
    ? history.reduce((s, t) => s + t.duration, 0) / history.length
    : 0;

  // CO2 saved vs all-taxi baseline (taxi = 0.21 kg CO2/km)
  const taxiCO2 = totalDistance * 0.21;
  // mix of transport: bus = 0.089, tram = 0.035, walk/velo = 0
  const avgCO2 = totalDistance * 0.07;
  const co2Saved = Math.max(0, taxiCO2 - avgCO2);

  return {
    totalTrips: history.length,
    totalDistance: parseFloat(totalDistance.toFixed(1)),
    totalCost: Math.round(totalCost),
    avgDuration: Math.round(avgDuration),
    co2Saved: parseFloat(co2Saved.toFixed(2)),
  };
}
