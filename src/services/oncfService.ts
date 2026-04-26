/**
 * oncfService.ts — Base de données ONCF (Office National des Chemins de Fer)
 *
 * Prix réels 2026 issus de oncf-voyages.ma et oncfticket.com
 * Réseau : Al Boraq (TGV Tanger-Casa) + Al Atlas (trains classiques)
 *
 * Tarification : ~0.45 MAD/km (2e cl.) · ~0.73 MAD/km (1re cl.)
 */

import { ONCFRoute, Coordinates } from '../types';

// ============================================================
// BASE DE DONNÉES DES LIAISONS ONCF
// ============================================================
const ONCF_ROUTES: ONCFRoute[] = [
  // Al Boraq — TGV Tanger–Casa
  { from:'Tanger',    to:'Kénitra',     durationMin:60,  price2cl:85,  price1cl:135, trainType:'Al Boraq' },
  { from:'Tanger',    to:'Rabat',       durationMin:80,  price2cl:115, price1cl:175, trainType:'Al Boraq' },
  { from:'Tanger',    to:'Casablanca',  durationMin:130, price2cl:170, price1cl:270, trainType:'Al Boraq' },
  { from:'Kénitra',   to:'Rabat',       durationMin:25,  price2cl:36,  price1cl:58,  trainType:'Al Boraq' },
  { from:'Kénitra',   to:'Casablanca',  durationMin:70,  price2cl:95,  price1cl:152, trainType:'Al Boraq' },
  { from:'Rabat',     to:'Casablanca',  durationMin:55,  price2cl:55,  price1cl:88,  trainType:'Al Boraq' },

  // Al Atlas — Axe Nord
  { from:'Tanger',    to:'Larache',     durationMin:55,  price2cl:38,  price1cl:60,  trainType:'Al Atlas' },
  { from:'Tanger',    to:'Meknès',      durationMin:255, price2cl:120, price1cl:192, trainType:'Al Atlas' },
  { from:'Tanger',    to:'Fès',         durationMin:270, price2cl:130, price1cl:208, trainType:'Al Atlas' },
  { from:'Tanger',    to:'Oujda',       durationMin:420, price2cl:210, price1cl:336, trainType:'Al Atlas' },

  // Al Atlas — Axe Casa/Rabat
  { from:'Casablanca',to:'Marrakech',   durationMin:150, price2cl:79,  price1cl:126, trainType:'Al Atlas' },
  { from:'Casablanca',to:'El Jadida',   durationMin:90,  price2cl:45,  price1cl:72,  trainType:'Al Atlas' },
  { from:'Casablanca',to:'Settat',      durationMin:60,  price2cl:32,  price1cl:51,  trainType:'Al Atlas' },
  { from:'Casablanca',to:'Mohammedia',  durationMin:30,  price2cl:20,  price1cl:32,  trainType:'Al Atlas' },
  { from:'Casablanca',to:'Fès',         durationMin:225, price2cl:112, price1cl:180, trainType:'Al Atlas' },
  { from:'Casablanca',to:'Meknès',      durationMin:195, price2cl:96,  price1cl:154, trainType:'Al Atlas' },
  { from:'Casablanca',to:'Oujda',       durationMin:390, price2cl:185, price1cl:296, trainType:'Al Atlas' },
  { from:'Rabat',     to:'Marrakech',   durationMin:195, price2cl:104, price1cl:166, trainType:'Al Atlas' },
  { from:'Rabat',     to:'Fès',         durationMin:165, price2cl:88,  price1cl:141, trainType:'Al Atlas' },
  { from:'Rabat',     to:'Meknès',      durationMin:140, price2cl:74,  price1cl:118, trainType:'Al Atlas' },
  { from:'Rabat',     to:'Oujda',       durationMin:345, price2cl:162, price1cl:259, trainType:'Al Atlas' },
  { from:'Marrakech', to:'Fès',         durationMin:270, price2cl:144, price1cl:230, trainType:'Al Atlas' },

  // Al Atlas — Axe Est
  { from:'Fès',       to:'Meknès',      durationMin:40,  price2cl:25,  price1cl:40,  trainType:'Al Atlas' },
  { from:'Fès',       to:'Oujda',       durationMin:195, price2cl:98,  price1cl:157, trainType:'Al Atlas' },
  { from:'Meknès',    to:'Oujda',       durationMin:225, price2cl:108, price1cl:173, trainType:'Al Atlas' },
  { from:'Fès',       to:'Taza',        durationMin:100, price2cl:52,  price1cl:83,  trainType:'Al Atlas' },
  { from:'Nador',     to:'Oujda',       durationMin:180, price2cl:68,  price1cl:109, trainType:'Al Atlas' },

  // Al Atlas — Axe Safi
  { from:'Casablanca',to:'Safi',        durationMin:180, price2cl:72,  price1cl:115, trainType:'Al Atlas' },
];

// ============================================================
// LOOKUP — récupère une liaison ONCF (bidirectionnelle)
// ============================================================
export function getONCFRoute(cityA: string, cityB: string): ONCFRoute | null {
  const normalize = (s: string) => s.trim().toLowerCase()
    .replace(/é/g,'e').replace(/è/g,'e').replace(/ê/g,'e')
    .replace(/â/g,'a').replace(/î/g,'i').replace(/ô/g,'o');

  const a = normalize(cityA);
  const b = normalize(cityB);

  const found = ONCF_ROUTES.find(r =>
    (normalize(r.from) === a && normalize(r.to) === b) ||
    (normalize(r.from) === b && normalize(r.to) === a)
  );

  return found ?? null;
}

// ============================================================
// DÉTECTION — la paire de villes est-elle reliée par ONCF ?
// ============================================================
export function isONCFAvailable(cityA: string, cityB: string): boolean {
  return getONCFRoute(cityA, cityB) !== null;
}

// ============================================================
// ESTIMATION — prix si pas dans la DB, par distance haversine
// ============================================================
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function estimateONCFPrice(from: Coordinates, to: Coordinates): ONCFRoute {
  const distKm = haversine(from.lat, from.lon, to.lat, to.lon);
  return {
    from: 'Départ', to: 'Destination',
    durationMin: Math.round(distKm / 110 * 60 + 20), // 110 km/h moy + attente
    price2cl: Math.round(distKm * 0.45 + 10),
    price1cl: Math.round(distKm * 0.73 + 15),
    trainType: distKm < 200 ? 'Al Atlas' : 'Al Atlas',
  };
}
