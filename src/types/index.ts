// UrbanRoute v4 — Types & Interfaces

export type Priority = 'rapide' | 'economique' | 'equilibre';
export type TransportMode = 'walk' | 'bus' | 'tram' | 'taxi' | 'grandtaxi' | 'velo' | 'train';
export type TrafficLevel = 'fluide' | 'modere' | 'dense';
export type ThemeMode = 'light' | 'dark';

export interface Coordinates { lat: number; lon: number; }

export interface GeocodingResult {
  displayName: string; shortName: string;
  coords: Coordinates; type: string;
}

export interface CityTransportConfig {
  name: string;
  availableModes: TransportMode[];
  busFare: number;
  tramFare?: number;
  taxiFlagFare: number;
  taxiPerKm: number;
  grandTaxiFare?: number;
  hasONCF?: boolean; // ville desservie par le train
}

export interface ONCFRoute {
  from: string; to: string;
  durationMin: number;   // minutes
  price2cl: number;      // MAD 2e classe
  price1cl: number;      // MAD 1re classe
  trainType: 'Al Boraq' | 'Al Atlas';
}

export interface WeatherData {
  temp: number; feelsLike: number; condition: string;
  icon: string; windSpeed: number; humidity: number; isRainy: boolean;
}

export interface TrafficData {
  level: TrafficLevel; factor: number;
  color: string; label: string; updatedAt: string;
}

export interface RouteSegment {
  mode: TransportMode; instruction: string;
  distance: number; duration: number; cost: number;
  line?: string; color: string;
}

export interface RouteOption {
  id: string; type: Priority; label: string;
  icon: string; accentColor: string;
  duration: number; distance: number; cost: number;
  score: number; segments: RouteSegment[];
  geometry: Coordinates[]; isRecommended: boolean;
  primaryMode: TransportMode;
}

export interface UserPreferences {
  defaultPriority: Priority;
  favoriteTransports: TransportMode[];
  city: string;
  theme: ThemeMode;
}

export interface TripRecord {
  id: string; date: string; departure: string;
  destination: string; priority: Priority;
  duration: number; cost: number; distance: number;
  transport: TransportMode[];
}

export interface User {
  id: string; name: string; email: string;
  preferences: UserPreferences;
  history: TripRecord[]; createdAt: string;
}

export type MapPickerMode = 'departure' | 'destination' | null;

export type RootStackParamList = {
  Login: undefined; Home: undefined; Results: undefined;
  Map: { routeId: string }; MapPicker: { mode: 'departure' | 'destination' };
  Profile: undefined;
};
