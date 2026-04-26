/**
 * cityDetector.ts
 * Détecte automatiquement la ville à partir des coordonnées GPS
 * et retourne la configuration des transports disponibles.
 */

import { Coordinates, CityTransportConfig } from '../types';
import { CITY_CENTERS, CITY_TRANSPORT_DB, DEFAULT_TRANSPORT_CONFIG } from '../constants';

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/**
 * Détecte la ville la plus proche des coordonnées données (rayon max 30km).
 * Retourne la config de transport correspondante.
 */
export function detectCityTransport(coords: Coordinates): CityTransportConfig {
  let closestCity = '';
  let minDist = Infinity;

  for (const [city, center] of Object.entries(CITY_CENTERS)) {
    const dist = haversine(coords.lat, coords.lon, center.lat, center.lon);
    if (dist < minDist) {
      minDist = dist;
      closestCity = city;
    }
  }

  // Si plus de 30km du centre le plus proche → config générique
  if (minDist > 30) {
    console.log(`[CityDetector] Aucune ville connue proche (${minDist.toFixed(1)}km) → fallback`);
    return DEFAULT_TRANSPORT_CONFIG;
  }

  const config = CITY_TRANSPORT_DB.find(c => c.name === closestCity);
  console.log(`[CityDetector] Ville détectée: ${closestCity} (${minDist.toFixed(1)}km)`);
  return config ?? DEFAULT_TRANSPORT_CONFIG;
}

/**
 * Filtre les modes disponibles selon la ville ET le choix utilisateur.
 * Si l'utilisateur a sélectionné des modes → intersection avec ceux disponibles.
 * Sinon → tous les modes disponibles dans la ville.
 */
export function getEffectiveModes(
  cityConfig: CityTransportConfig,
  userSelectedModes: string[]
): string[] {
  const available = cityConfig.availableModes;
  if (userSelectedModes.length === 0) return available as string[];
  return userSelectedModes.filter(m => available.includes(m as any));
}
