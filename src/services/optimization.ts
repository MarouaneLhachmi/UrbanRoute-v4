import { Priority, RouteOption, RouteSegment, TransportMode } from '../types';
import { PRIORITY_CONFIG, TRANSPORT_CONFIG, FIXED_FARES } from '../constants';
import { CityTransportConfig } from '../types';

// ============================================================
// SCORE CALCULATION
// ============================================================
export function calculateRawScore(duration: number, cost: number, distance: number, priority: Priority): number {
  const w = PRIORITY_CONFIG[priority].scoreWeights;
  return w.time * duration + w.cost * cost + w.distance * distance * 2;
}

export function normalizeScores(routes: RouteOption[]): RouteOption[] {
  if (routes.length === 0) return routes;
  const scores = routes.map(r => r.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  return routes.map(r => ({ ...r, score: Math.round((1 - (r.score - min) / range) * 100) }));
}

export function sortRoutes(routes: RouteOption[], priority: Priority): RouteOption[] {
  return [...routes].sort((a, b) =>
    calculateRawScore(a.duration, a.cost, a.distance, priority) -
    calculateRawScore(b.duration, b.cost, b.distance, priority)
  );
}

export function estimateCost(segments: RouteSegment[]): number {
  let total = 0;
  segments.forEach(seg => {
    total += FIXED_FARES[seg.mode] + TRANSPORT_CONFIG[seg.mode].costPerKm * seg.distance;
  });
  return Math.round(total);
}

// ============================================================
// ROUTE BUILDER — adapté à la ville détectée
// ============================================================
interface OrsRouteData {
  walkDuration: number; walkDistance: number; walkGeometry: { lat: number; lon: number }[];
  bikeDuration: number; bikeDistance: number; bikeGeometry: { lat: number; lon: number }[];
  carDuration: number;  carDistance: number;  carGeometry: { lat: number; lon: number }[];
  trafficFactor: number;
  cityConfig: CityTransportConfig;
  userSelectedModes: TransportMode[];
}

export function buildRouteOptions(data: OrsRouteData): RouteOption[] {
  const {
    walkDuration, walkDistance, walkGeometry,
    bikeDuration, bikeDistance, bikeGeometry,
    carDuration,  carDistance,  carGeometry,
    trafficFactor, cityConfig, userSelectedModes,
  } = data;

  const available = cityConfig.availableModes;
  // Modes effectifs = sélection user ∩ modes disponibles dans la ville
  const effective = userSelectedModes.length > 0
    ? userSelectedModes.filter(m => available.includes(m))
    : available;

  const walkMin = walkDuration / 60;
  const bikeMin = bikeDuration / 60;
  const carMin  = (carDuration / 60) * trafficFactor;
  const walkKm  = walkDistance / 1000;
  const bikeKm  = bikeDistance / 1000;
  const carKm   = carDistance  / 1000;

  const routes: RouteOption[] = [];

  // ---- TRAJET RAPIDE ----
  // Priorité : taxi > grandtaxi > bus > walk
  if (effective.includes('taxi')) {
    const taxiFare = cityConfig.taxiFlagFare + carKm * cityConfig.taxiPerKm;
    const segs: RouteSegment[] = [
      { mode: 'walk', duration: 3, distance: 0.2, cost: 0,
        instruction: 'Marchez jusqu\'au point de prise en charge', color: TRANSPORT_CONFIG.walk.color },
      { mode: 'taxi', duration: Math.round(carMin), distance: parseFloat(carKm.toFixed(2)),
        cost: Math.round(taxiFare), instruction: `Petit taxi — ${carKm.toFixed(1)} km`,
        line: 'Petit taxi', color: TRANSPORT_CONFIG.taxi.color },
    ];
    routes.push({
      id: 'rapide', type: 'rapide', label: 'Trajet Rapide', icon: '⚡',
      accentColor: '#FF5757', primaryMode: 'taxi',
      duration: Math.round(carMin + 3), distance: parseFloat(carKm.toFixed(2)),
      cost: estimateCost(segs), score: 0, isRecommended: false,
      segments: segs, geometry: carGeometry,
    });
  } else if (effective.includes('grandtaxi')) {
    const fare = cityConfig.grandTaxiFare ?? 15;
    const segs: RouteSegment[] = [
      { mode: 'walk', duration: 4, distance: 0.3, cost: 0,
        instruction: 'Marchez jusqu\'à la station de grand taxi', color: TRANSPORT_CONFIG.walk.color },
      { mode: 'grandtaxi', duration: Math.round(carMin * 0.9), distance: parseFloat(carKm.toFixed(2)),
        cost: fare, instruction: 'Grand taxi direction destination',
        line: 'Grand Taxi', color: TRANSPORT_CONFIG.grandtaxi.color },
    ];
    routes.push({
      id: 'rapide', type: 'rapide', label: 'Trajet Rapide', icon: '⚡',
      accentColor: '#FF5757', primaryMode: 'grandtaxi',
      duration: Math.round(carMin * 0.9 + 4), distance: parseFloat(carKm.toFixed(2)),
      cost: estimateCost(segs), score: 0, isRecommended: false,
      segments: segs, geometry: carGeometry,
    });
  }

  // ---- TRAJET ÉCONOMIQUE ----
  // Priorité : bus > tram > grandtaxi > walk
  if (effective.includes('bus')) {
    const busFare = cityConfig.busFare;
    const segs: RouteSegment[] = [
      { mode: 'walk', duration: Math.max(3, Math.round(walkMin * 0.15)), distance: parseFloat((walkKm * 0.15).toFixed(2)),
        cost: 0, instruction: 'Marchez jusqu\'à l\'arrêt de bus', color: TRANSPORT_CONFIG.walk.color },
      { mode: 'bus', duration: Math.round(walkMin * 0.55), distance: parseFloat((walkKm * 0.7).toFixed(2)),
        cost: busFare, instruction: `Bus ALSA — direction destination`,
        line: `Bus ALSA`, color: TRANSPORT_CONFIG.bus.color },
      { mode: 'walk', duration: Math.max(2, Math.round(walkMin * 0.10)), distance: parseFloat((walkKm * 0.15).toFixed(2)),
        cost: 0, instruction: 'Derniers mètres à pied', color: TRANSPORT_CONFIG.walk.color },
    ];
    routes.push({
      id: 'economique', type: 'economique', label: 'Trajet Économique', icon: '💰',
      accentColor: '#00D4AA', primaryMode: 'bus',
      duration: Math.round(walkMin * 0.8 + 10), distance: parseFloat(walkKm.toFixed(2)),
      cost: estimateCost(segs), score: 0, isRecommended: false,
      segments: segs, geometry: walkGeometry,
    });
  } else if (effective.includes('tram')) {
    const tramFare = cityConfig.tramFare ?? 6;
    const segs: RouteSegment[] = [
      { mode: 'walk', duration: 5, distance: 0.3, cost: 0,
        instruction: 'Marchez jusqu\'à la station de tram', color: TRANSPORT_CONFIG.walk.color },
      { mode: 'tram', duration: Math.round(bikeMin * 0.7), distance: parseFloat((bikeKm * 0.75).toFixed(2)),
        cost: tramFare, instruction: 'Tram — direction destination',
        line: 'Ligne T1', color: TRANSPORT_CONFIG.tram.color },
      { mode: 'walk', duration: 4, distance: 0.2, cost: 0,
        instruction: 'Arrivée à pied', color: TRANSPORT_CONFIG.walk.color },
    ];
    routes.push({
      id: 'economique', type: 'economique', label: 'Trajet Économique', icon: '💰',
      accentColor: '#00D4AA', primaryMode: 'tram',
      duration: Math.round(bikeMin * 0.7 + 9), distance: parseFloat(bikeKm.toFixed(2)),
      cost: estimateCost(segs), score: 0, isRecommended: false,
      segments: segs, geometry: bikeGeometry,
    });
  }

  // ---- TRAJET ÉQUILIBRÉ ----
  // Priorité : tram > bus+velo > bus+walk > grandtaxi
  if (effective.includes('tram')) {
    const tramFare = cityConfig.tramFare ?? 6;
    const hasVelo = effective.includes('velo');
    const segs: RouteSegment[] = [
      { mode: 'walk', duration: 5, distance: 0.3, cost: 0,
        instruction: 'Marchez jusqu\'à la station de tram', color: TRANSPORT_CONFIG.walk.color },
      { mode: 'tram', duration: Math.round(bikeMin * 0.65), distance: parseFloat((bikeKm * 0.7).toFixed(2)),
        cost: tramFare, instruction: 'Tram — direction destination',
        line: 'Ligne T1', color: TRANSPORT_CONFIG.tram.color },
      hasVelo
        ? { mode: 'velo', duration: Math.round(bikeMin * 0.15), distance: parseFloat((bikeKm * 0.2).toFixed(2)),
            cost: 0, instruction: 'Vélo libre-service jusqu\'à destination',
            line: 'BikeShare', color: TRANSPORT_CONFIG.velo.color }
        : { mode: 'walk', duration: 4, distance: 0.2, cost: 0,
            instruction: 'Arrivée à pied', color: TRANSPORT_CONFIG.walk.color },
    ];
    routes.push({
      id: 'equilibre', type: 'equilibre', label: 'Trajet Équilibré', icon: '⚖️',
      accentColor: '#4A9FFF', primaryMode: 'tram',
      duration: Math.round(bikeMin * 0.8 + 9), distance: parseFloat(bikeKm.toFixed(2)),
      cost: estimateCost(segs), score: 0, isRecommended: false,
      segments: segs, geometry: bikeGeometry,
    });
  } else if (effective.includes('bus')) {
    const busFare = cityConfig.busFare;
    const hasVelo = effective.includes('velo');
    const segs: RouteSegment[] = [
      { mode: 'walk', duration: 4, distance: 0.25, cost: 0,
        instruction: 'Marchez jusqu\'à l\'arrêt', color: TRANSPORT_CONFIG.walk.color },
      { mode: 'bus', duration: Math.round(walkMin * 0.5), distance: parseFloat((walkKm * 0.65).toFixed(2)),
        cost: busFare, instruction: 'Bus ALSA — direction destination',
        line: 'Bus ALSA', color: TRANSPORT_CONFIG.bus.color },
      hasVelo
        ? { mode: 'velo', duration: Math.round(bikeMin * 0.12), distance: parseFloat((walkKm * 0.15).toFixed(2)),
            cost: 0, instruction: 'Vélo jusqu\'à destination', color: TRANSPORT_CONFIG.velo.color }
        : { mode: 'walk', duration: Math.round(walkMin * 0.1), distance: parseFloat((walkKm * 0.1).toFixed(2)),
            cost: 0, instruction: 'Arrivée à pied', color: TRANSPORT_CONFIG.walk.color },
    ];
    routes.push({
      id: 'equilibre', type: 'equilibre', label: 'Trajet Équilibré', icon: '⚖️',
      accentColor: '#4A9FFF', primaryMode: 'bus',
      duration: Math.round(walkMin * 0.65 + 8), distance: parseFloat(walkKm.toFixed(2)),
      cost: estimateCost(segs), score: 0, isRecommended: false,
      segments: segs, geometry: walkGeometry,
    });
  } else if (effective.includes('grandtaxi')) {
    const fare = cityConfig.grandTaxiFare ?? 15;
    const segs: RouteSegment[] = [
      { mode: 'walk', duration: 5, distance: 0.3, cost: 0,
        instruction: 'Marchez vers la station', color: TRANSPORT_CONFIG.walk.color },
      { mode: 'grandtaxi', duration: Math.round(carMin * 0.85), distance: parseFloat((carKm * 0.9).toFixed(2)),
        cost: fare, instruction: 'Grand taxi direction destination',
        line: 'Grand Taxi', color: TRANSPORT_CONFIG.grandtaxi.color },
    ];
    routes.push({
      id: 'equilibre', type: 'equilibre', label: 'Trajet Équilibré', icon: '⚖️',
      accentColor: '#4A9FFF', primaryMode: 'grandtaxi',
      duration: Math.round(carMin * 0.85 + 5), distance: parseFloat(carKm.toFixed(2)),
      cost: estimateCost(segs), score: 0, isRecommended: false,
      segments: segs, geometry: carGeometry,
    });
  }

  if (routes.length === 0) return routes;

  // Calcul scores bruts
  const withScores = routes.map(r => ({
    ...r,
    score: calculateRawScore(r.duration, r.cost, r.distance, r.type),
  }));

  // Normalisation 0-100
  const normalized = normalizeScores(withScores);

  // Marquer le meilleur
  const best = normalized.reduce((a, b) => a.score > b.score ? a : b);
  return normalized.map(r => ({ ...r, isRecommended: r.id === best.id }));
}
