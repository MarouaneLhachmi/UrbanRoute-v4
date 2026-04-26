/**
 * api.ts v4 — Couche d'accès aux APIs externes
 *
 * Nouveautés v4 :
 * - Photon API (komoot) remplace Nominatim pour la recherche d'adresses
 *   → rues précises, suggestions contextuelles, sans clé, bias Maroc
 * - Nominatim conservé pour le géocodage inversé (reverseGeocode)
 * - ONCF intégré dans calculateRoutes
 */

import { Coordinates, GeocodingResult, WeatherData, TrafficData, TransportMode } from '../types';
import { buildRouteOptions } from './optimization';
import { detectCityTransport } from './cityDetector';
import { RouteOption } from '../types';
import { getONCFRoute, estimateONCFPrice } from './oncfService';
import { TRANSPORT_CONFIG } from '../constants';

export const ORS_API_KEY = 'YOUR_ORS_API_KEY_HERE';
const ORS_BASE        = 'https://api.openrouteservice.org';
const PHOTON_BASE     = 'https://photon.komoot.io';
const NOMINATIM_BASE  = 'https://nominatim.openstreetmap.org';
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

// ============================================================
// GEOCODING — Photon API (v4 : précision rues + POI)
// ============================================================
export async function geocodeAddress(
  query: string,
  biasCoords?: Coordinates
): Promise<GeocodingResult[]> {
  if (query.trim().length < 2) return [];
  try {
    // Photon avec biais Maroc (bbox) + biais GPS si disponible
    const params: Record<string, string> = {
      q:       query,
      limit:   '7',
      lang:    'fr',
      // Bounding box Maroc complet
      bbox:    '-17.5,20.5,-0.9,36.0',
    };
    if (biasCoords) {
      params.lat = biasCoords.lat.toString();
      params.lon = biasCoords.lon.toString();
    }
    const url = `${PHOTON_BASE}/api/?` + new URLSearchParams(params);
    const res  = await fetch(url, { headers: { 'User-Agent': 'UrbanRoute-PFA/4.0' } });
    if (!res.ok) throw new Error(`Photon HTTP ${res.status}`);
    const data = await res.json();

    return (data.features as any[]).map(f => {
      const p = f.properties;
      const parts = [p.name, p.street, p.city || p.town || p.county].filter(Boolean);
      const shortName = parts.slice(0, 2).join(', ') || p.name || 'Lieu';
      const displayName = [p.name, p.street, p.housenumber, p.city || p.town, p.country]
        .filter(Boolean).join(', ');
      return {
        displayName,
        shortName,
        coords: { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] },
        type: p.type || 'place',
      };
    });
  } catch (err) {
    console.warn('[Photon] Fallback to Nominatim:', err);
    return geocodeAddressFallback(query);
  }
}

// Fallback Nominatim si Photon indisponible
async function geocodeAddressFallback(query: string): Promise<GeocodingResult[]> {
  try {
    const url = `${NOMINATIM_BASE}/search?` + new URLSearchParams({
      q: `${query} Maroc`, format: 'json', limit: '5',
      addressdetails: '1', 'accept-language': 'fr',
    });
    const res = await fetch(url, { headers: { 'User-Agent': 'UrbanRoute-PFA/4.0' } });
    const data: any[] = await res.json();
    return data.map(item => ({
      displayName: item.display_name,
      shortName: item.display_name.split(',').slice(0,2).join(','),
      coords: { lat: parseFloat(item.lat), lon: parseFloat(item.lon) },
      type: item.type || 'place',
    }));
  } catch { return []; }
}

export async function reverseGeocode(coords: Coordinates): Promise<string> {
  try {
    const url = `${NOMINATIM_BASE}/reverse?lat=${coords.lat}&lon=${coords.lon}&format=json&accept-language=fr`;
    const res  = await fetch(url, { headers: { 'User-Agent': 'UrbanRoute-PFA/4.0' } });
    const data = await res.json();
    const a    = data.address || {};
    return [a.road, a.suburb || a.city_district, a.city || a.town]
      .filter(Boolean).slice(0,2).join(', ') || data.display_name?.split(',')[0] || 'Ma position';
  } catch { return `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`; }
}

// ============================================================
// ROUTING — ORS
// ============================================================
interface ORSResult { duration: number; distance: number; geometry: Coordinates[]; }

async function fetchORSRoute(from: Coordinates, to: Coordinates, profile: string): Promise<ORSResult | null> {
  try {
    const res = await fetch(`${ORS_BASE}/v2/directions/${profile}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': ORS_API_KEY },
      body: JSON.stringify({
        coordinates: [[from.lon, from.lat], [to.lon, to.lat]],
        instructions: false, geometry: true, geometry_simplify: true,
      }),
    });
    if (!res.ok) return null;
    const data  = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;
    return { duration: route.summary.duration, distance: route.summary.distance, geometry: decodePolyline(route.geometry) };
  } catch { return null; }
}

function decodePolyline(encoded: string): Coordinates[] {
  const coords: Coordinates[] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < encoded.length) {
    let b, s = 0, r = 0;
    do { b = encoded.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5; } while (b >= 0x20);
    lat += (r & 1) ? ~(r >> 1) : r >> 1;
    s = 0; r = 0;
    do { b = encoded.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5; } while (b >= 0x20);
    lng += (r & 1) ? ~(r >> 1) : r >> 1;
    coords.push({ lat: lat / 1e5, lon: lng / 1e5 });
  }
  return coords;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function fallback(dist: number, speed: number): ORSResult {
  return { duration:(dist/speed)*3600, distance:dist*1000, geometry:[] };
}

// ============================================================
// CALCUL DES ITINÉRAIRES — Urban + Train ONCF
// ============================================================
export async function calculateRoutes(
  from: Coordinates, to: Coordinates,
  trafficFactor: number,
  userSelectedModes: TransportMode[] = [],
  departureCity?: string,
  destinationCity?: string,
): Promise<RouteOption[]> {
  const cityConfig = detectCityTransport(from);
  const dist = haversine(from.lat, from.lon, to.lat, to.lon);

  const [walkRoute, bikeRoute, carRoute] = await Promise.all([
    fetchORSRoute(from, to, 'foot-walking'),
    fetchORSRoute(from, to, 'cycling-regular'),
    fetchORSRoute(from, to, 'driving-car'),
  ]);

  const walk = walkRoute ?? fallback(dist, 5);
  const bike = bikeRoute ?? fallback(dist, 15);
  const car  = carRoute  ?? fallback(dist, 35);

  // Itinéraires urbains
  const urbanRoutes = buildRouteOptions({
    walkDuration: walk.duration, walkDistance: walk.distance, walkGeometry: walk.geometry,
    bikeDuration: bike.duration, bikeDistance: bike.distance, bikeGeometry: bike.geometry,
    carDuration:  car.duration,  carDistance:  car.distance,  carGeometry:  car.geometry,
    trafficFactor, cityConfig, userSelectedModes,
  });

  // Itinéraire train ONCF (si villes connues et reliées)
  const trainRoutes: RouteOption[] = [];
  if (departureCity && destinationCity) {
    const oncf = getONCFRoute(departureCity, destinationCity)
               ?? (dist > 50 ? estimateONCFPrice(from, to) : null);

    if (oncf) {
      const canUseTrain = userSelectedModes.length === 0 || userSelectedModes.includes('train');
      if (canUseTrain) {
        const trainSegments = [
          {
            mode: 'walk' as TransportMode, duration: 10, distance: 0.5, cost: 0,
            instruction: `Marchez jusqu'à la gare`, color: TRANSPORT_CONFIG.walk.color,
          },
          {
            mode: 'train' as TransportMode,
            duration: oncf.durationMin,
            distance: parseFloat(dist.toFixed(1)),
            cost: oncf.price2cl,
            instruction: `${oncf.trainType} — ${departureCity} → ${destinationCity} (2e cl.)`,
            line: oncf.trainType,
            color: TRANSPORT_CONFIG.train.color,
          },
          {
            mode: 'walk' as TransportMode, duration: 8, distance: 0.4, cost: 0,
            instruction: `Arrivée à la gare de ${destinationCity}`, color: TRANSPORT_CONFIG.walk.color,
          },
        ];

        trainRoutes.push({
          id: 'train',
          type: 'equilibre' as any,
          label: `Train ${oncf.trainType}`,
          icon: '🚂',
          accentColor: TRANSPORT_CONFIG.train.color,
          duration: oncf.durationMin + 18,
          distance: parseFloat(dist.toFixed(1)),
          cost: oncf.price2cl,
          score: 0,
          isRecommended: false,
          primaryMode: 'train',
          segments: trainSegments,
          geometry: [from, to],
        });
      }
    }
  }

  return [...urbanRoutes, ...trainRoutes];
}

// ============================================================
// WEATHER — Open-Meteo
// ============================================================
const WMO: Record<number, { label: string; icon: string; isRainy: boolean }> = {
  0:  {label:'Ciel dégagé',           icon:'☀️',  isRainy:false},
  1:  {label:'Principalement dégagé', icon:'🌤️', isRainy:false},
  2:  {label:'Partiellement nuageux', icon:'⛅',  isRainy:false},
  3:  {label:'Couvert',               icon:'☁️',  isRainy:false},
  45: {label:'Brouillard',            icon:'🌫️', isRainy:false},
  51: {label:'Bruine légère',         icon:'🌦️', isRainy:true },
  61: {label:'Pluie légère',          icon:'🌧️', isRainy:true },
  80: {label:'Averses',               icon:'⛈️', isRainy:true },
  95: {label:'Orage',                 icon:'⛈️', isRainy:true },
};

export async function getWeather(coords: Coordinates): Promise<WeatherData | null> {
  try {
    const params = new URLSearchParams({
      latitude:  coords.lat.toString(), longitude: coords.lon.toString(),
      current: 'temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m',
      timezone: 'Africa/Casablanca',
    });
    const res  = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const cur  = data.current;
    const meta = WMO[cur.weathercode] ?? {label:'Variable',icon:'🌡️',isRainy:false};
    return {
      temp: Math.round(cur.temperature_2m), feelsLike: Math.round(cur.apparent_temperature),
      condition: meta.label, icon: meta.icon,
      windSpeed: Math.round(cur.windspeed_10m), humidity: cur.relativehumidity_2m,
      isRainy: meta.isRainy,
    };
  } catch { return null; }
}

// ============================================================
// TRAFFIC
// ============================================================
export function getTrafficData(): TrafficData {
  const h   = new Date().getHours();
  const now = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});
  if ((h>=7&&h<=9)||(h>=17&&h<=20)) return {level:'dense', factor:1.5,color:'#E53935',label:'Trafic dense', updatedAt:now};
  if  (h>=12&&h<=14)                return {level:'modere',factor:1.2,color:'#F9A825',label:'Trafic modéré',updatedAt:now};
  return                                    {level:'fluide',factor:1.0,color:'#2E7D32',label:'Trafic fluide',updatedAt:now};
}
