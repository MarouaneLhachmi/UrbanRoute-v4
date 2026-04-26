import { Priority, TransportMode, CityTransportConfig } from '../types';

// ============================================================
// DESIGN TOKENS — Thème Clair v4 (inspiré Google Maps)
// ============================================================
export const COLORS = {
  // Backgrounds
  bg:          '#FFFFFF',
  surface:     '#F8F9FA',
  surfaceAlt:  '#F1F3F4',
  cardBg:      '#FFFFFF',

  // Borders
  border:      '#E8EAED',
  borderLight: '#F1F3F4',

  // Text
  textPrimary:   '#1A1A2E',
  textSecondary: '#5F6368',
  textMuted:     '#9AA0A6',

  // Brand — Bleu Google Maps
  blue:      '#1A73E8',
  blueLight: '#4A90E2',
  blueBg:    '#E8F0FE',

  // Routes
  rapide:    '#E53935',   // rouge vif
  economique:'#2E7D32',   // vert foncé
  equilibre: '#1A73E8',   // bleu Google

  // Status
  success: '#2E7D32',
  warning: '#F9A825',
  danger:  '#E53935',

  // Traffic
  trafficFluide: '#2E7D32',
  trafficModere: '#F9A825',
  trafficDense:  '#E53935',

  // Ombres légères
  shadow: '#00000012',
};

// Thème sombre (toggle optionnel)
export const COLORS_DARK = {
  bg: '#1A1A2E', surface: '#16213E', surfaceAlt: '#0F3460',
  cardBg: '#16213E', border: '#2A3F5F', borderLight: '#1E3054',
  textPrimary: '#EDF2F7', textSecondary: '#8899A6', textMuted: '#4A6080',
  blue: '#4A90E2', blueLight: '#74B0F0', blueBg: '#1A2744',
  rapide: '#FF5757', economique: '#4CAF50', equilibre: '#4A90E2',
  success: '#4CAF50', warning: '#FFB300', danger: '#FF5757',
  trafficFluide: '#4CAF50', trafficModere: '#FFB300', trafficDense: '#FF5757',
  shadow: '#00000040',
};

export const PRIORITY_CONFIG: Record<Priority, {
  label: string; icon: string; color: string; bgColor: string;
  description: string; scoreWeights: { time: number; cost: number; distance: number };
}> = {
  rapide:     { label:'Rapide',     icon:'⚡', color:'#E53935', bgColor:'#FFEBEE', description:'Minimiser le temps',           scoreWeights:{time:0.7,cost:0.1,distance:0.2} },
  economique: { label:'Économique', icon:'💰', color:'#2E7D32', bgColor:'#E8F5E9', description:'Minimiser le coût',            scoreWeights:{time:0.1,cost:0.8,distance:0.1} },
  equilibre:  { label:'Équilibré',  icon:'⚖️', color:'#1A73E8', bgColor:'#E8F0FE', description:'Meilleur compromis temps/coût', scoreWeights:{time:0.4,cost:0.35,distance:0.25} },
};

export const TRANSPORT_CONFIG: Record<TransportMode, {
  icon: string; label: string; color: string; costPerKm: number; speedKmh: number;
}> = {
  walk:      { icon:'🚶', label:'Marche',       color:'#43A047', costPerKm:0,   speedKmh:5  },
  bus:       { icon:'🚌', label:'Bus',          color:'#1A73E8', costPerKm:0,   speedKmh:25 },
  tram:      { icon:'🚊', label:'Tram',         color:'#8E24AA', costPerKm:0,   speedKmh:30 },
  taxi:      { icon:'🚕', label:'Petit Taxi',   color:'#F9A825', costPerKm:3.5, speedKmh:35 },
  grandtaxi: { icon:'🚐', label:'Grand Taxi',   color:'#FB8C00', costPerKm:2.0, speedKmh:40 },
  velo:      { icon:'🚲', label:'Vélo',         color:'#EF6C00', costPerKm:0,   speedKmh:15 },
  train:     { icon:'🚂', label:'Train ONCF',   color:'#C62828', costPerKm:0.45,speedKmh:120 },
};

export const FIXED_FARES: Record<TransportMode, number> = {
  walk:0, bus:4, tram:6, taxi:5, grandtaxi:10, velo:0, train:0,
};

// ============================================================
// PRIX RÉELS — CITY TRANSPORT DATABASE (Maroc 2026)
// Sources : enquête terrain, tarifs officiels
// ============================================================
export const CITY_TRANSPORT_DB: CityTransportConfig[] = [
  // Nord — Axe ONCF Tanger
  { name:'Tanger',      availableModes:['walk','bus','taxi','grandtaxi','train'],
    busFare:4, taxiFlagFare:5.60, taxiPerKm:3.75, grandTaxiFare:15, hasONCF:true },
  { name:'Tétouan',     availableModes:['walk','bus','taxi','grandtaxi'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:12 },
  { name:'Al Hoceima',  availableModes:['walk','bus','taxi','grandtaxi'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:12 },
  { name:'Nador',       availableModes:['walk','bus','taxi','grandtaxi'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:12 },
  { name:'Larache',     availableModes:['walk','bus','taxi','grandtaxi','train'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:12, hasONCF:true },
  { name:'Chefchaouen', availableModes:['walk','taxi','grandtaxi'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:15 },
  { name:'Kénitra',     availableModes:['walk','bus','taxi','grandtaxi','train'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.20, grandTaxiFare:12, hasONCF:true },
  // Centre-Nord — Axe ONCF Rabat
  { name:'Rabat',       availableModes:['walk','bus','tram','taxi','grandtaxi','train'],
    busFare:5, tramFare:8, taxiFlagFare:5.60, taxiPerKm:3.75, grandTaxiFare:15, hasONCF:true },
  { name:'Salé',        availableModes:['walk','bus','tram','taxi','train'],
    busFare:5, tramFare:8, taxiFlagFare:5.60, taxiPerKm:3.75, hasONCF:true },
  { name:'Témara',      availableModes:['walk','bus','taxi'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.50 },
  // Centre — Axe ONCF Casa
  { name:'Casablanca',  availableModes:['walk','bus','tram','taxi','grandtaxi','train'],
    busFare:5, tramFare:7, taxiFlagFare:6.20, taxiPerKm:4.00, grandTaxiFare:20, hasONCF:true },
  { name:'Mohammedia',  availableModes:['walk','bus','taxi','train'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.50, hasONCF:true },
  { name:'El Jadida',   availableModes:['walk','bus','taxi','grandtaxi','train'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:12, hasONCF:true },
  { name:'Settat',      availableModes:['walk','bus','taxi','grandtaxi','train'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:12, hasONCF:true },
  { name:'Khouribga',   availableModes:['walk','bus','taxi'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00 },
  { name:'Béni Mellal', availableModes:['walk','bus','taxi','grandtaxi'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:12 },
  // Centre-Est — Axe ONCF Fès/Meknès/Oujda
  { name:'Fès',         availableModes:['walk','bus','taxi','grandtaxi','train'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.20, grandTaxiFare:12, hasONCF:true },
  { name:'Meknès',      availableModes:['walk','bus','taxi','grandtaxi','train'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:12, hasONCF:true },
  { name:'Oujda',       availableModes:['walk','bus','taxi','grandtaxi','train'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:12, hasONCF:true },
  { name:'Taza',        availableModes:['walk','bus','taxi','grandtaxi','train'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:12, hasONCF:true },
  { name:'Berkane',     availableModes:['walk','bus','taxi'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00 },
  { name:'Nador',       availableModes:['walk','bus','taxi','grandtaxi','train'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:12, hasONCF:true },
  // Sud — Axe ONCF Marrakech/Safi
  { name:'Marrakech',   availableModes:['walk','bus','taxi','velo','train'],
    busFare:4, taxiFlagFare:5.60, taxiPerKm:3.50, hasONCF:true },
  { name:'Safi',        availableModes:['walk','bus','taxi','grandtaxi','train'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:12, hasONCF:true },
  { name:'Agadir',      availableModes:['walk','bus','taxi','velo'],
    busFare:4, taxiFlagFare:5.60, taxiPerKm:3.50 },
  { name:'Essaouira',   availableModes:['walk','taxi','grandtaxi','velo'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:15 },
  { name:'Ouarzazate',  availableModes:['walk','taxi','grandtaxi'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.50, grandTaxiFare:20 },
  // Grand Sud
  { name:'Laâyoune',    availableModes:['walk','bus','taxi','grandtaxi'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:15 },
  { name:'Dakhla',      availableModes:['walk','taxi','grandtaxi'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.50, grandTaxiFare:20 },
  { name:'Guelmim',     availableModes:['walk','bus','taxi','grandtaxi'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:15 },
  { name:'Errachidia',  availableModes:['walk','bus','taxi','grandtaxi'],
    busFare:4, taxiFlagFare:5.00, taxiPerKm:3.00, grandTaxiFare:15 },
];

export const DEFAULT_TRANSPORT_CONFIG: CityTransportConfig = {
  name:'Maroc', availableModes:['walk','bus','taxi','grandtaxi'],
  busFare:4, taxiFlagFare:5, taxiPerKm:3.5, grandTaxiFare:15,
};

export const CITY_CENTERS: Record<string, { lat: number; lon: number }> = {
  'Tanger':      {lat:35.7595,lon:-5.8340}, 'Tétouan':    {lat:35.5785,lon:-5.3684},
  'Al Hoceima':  {lat:35.2517,lon:-3.9372}, 'Nador':      {lat:35.1688,lon:-2.9335},
  'Larache':     {lat:35.1932,lon:-6.1566}, 'Chefchaouen':{lat:35.1688,lon:-5.2636},
  'Kénitra':     {lat:34.2610,lon:-6.5802}, 'Rabat':      {lat:34.0209,lon:-6.8416},
  'Salé':        {lat:34.0531,lon:-6.7985}, 'Témara':     {lat:33.9287,lon:-6.9065},
  'Casablanca':  {lat:33.5731,lon:-7.5898}, 'Mohammedia': {lat:33.6861,lon:-7.3833},
  'El Jadida':   {lat:33.2549,lon:-8.5078}, 'Settat':     {lat:33.0014,lon:-7.6197},
  'Khouribga':   {lat:32.8811,lon:-6.9063}, 'Béni Mellal':{lat:32.3373,lon:-6.3498},
  'Fès':         {lat:34.0181,lon:-5.0078}, 'Meknès':     {lat:33.8730,lon:-5.5407},
  'Oujda':       {lat:34.6867,lon:-1.9114}, 'Taza':       {lat:34.2100,lon:-4.0100},
  'Berkane':     {lat:34.9219,lon:-2.3197}, 'Marrakech':  {lat:31.6295,lon:-7.9811},
  'Agadir':      {lat:30.4278,lon:-9.5981}, 'Essaouira':  {lat:31.5125,lon:-9.7749},
  'Safi':        {lat:32.2994,lon:-9.2372}, 'Ouarzazate': {lat:30.9335,lon:-6.9370},
  'Laâyoune':    {lat:27.1253,lon:-13.162}, 'Dakhla':     {lat:23.6848,lon:-15.957},
  'Guelmim':     {lat:28.9870,lon:-10.057}, 'Errachidia': {lat:31.9314,lon:-4.4249},
};

export const DEFAULT_CITY = { name:'Tanger', coords:{lat:35.7595,lon:-5.8340}, zoom:13 };

export const ORS_PROFILES = {
  walk:'foot-walking', velo:'cycling-regular',
  taxi:'driving-car', grandtaxi:'driving-car', bus:'driving-car', tram:'driving-car',
  train:'driving-car',
} as const;

// Tuiles carte — mode clair par défaut (CartoDB Positron = Google Maps style)
export const MAP_TILES = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  osm:   'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};
