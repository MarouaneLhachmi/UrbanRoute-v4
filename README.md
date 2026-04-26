# UrbanRoute — Application Mobile de Mobilité Urbaine
### Projet de Fin d'Année (PFA) — Génie Informatique 4ème Année

---

## 📋 Présentation

**UrbanRoute** est une application mobile de gestion de la mobilité urbaine permettant de proposer des itinéraires optimaux en combinant plusieurs moyens de transport (bus, tram, taxi, marche, vélo) selon des critères multi-objectifs : **temps**, **coût**, et **distance**.

---

## 🏗️ Architecture du projet

```
UrbanRoute/
├── App.tsx                          # Racine — NavigationContainer + AppProvider
├── tsconfig.json
├── package.json
└── src/
    ├── types/
    │   └── index.ts                 # Tous les types & interfaces TypeScript
    ├── constants/
    │   └── index.ts                 # Tokens de design, configs transport, PRIORITY_CONFIG
    ├── utils/
    │   └── index.ts                 # Fonctions utilitaires pures (formatage, calculs)
    ├── context/
    │   └── AppContext.tsx           # État global via useReducer (pattern Redux-like)
    ├── hooks/
    │   └── index.ts                 # Custom hooks (useGeocoding, useRoutes, useWeather, useAuth)
    ├── services/
    │   ├── api.ts                   # Couche d'accès aux APIs externes
    │   └── optimization.ts         # Algorithme de scoring & construction des routes
    ├── components/
    │   └── index.tsx                # Composants UI réutilisables
    └── screens/
        ├── LoginScreen.tsx          # Authentification
        ├── HomeScreen.tsx           # Recherche avec géocodage
        ├── ResultsScreen.tsx        # Affichage des 3 itinéraires
        ├── MapScreen.tsx            # Carte interactive (WebView + Leaflet)
        └── ProfileScreen.tsx        # Profil, historique, statistiques
```

---

## 📡 APIs externes (toutes gratuites)

| API | Rôle | Clé requise | Quota gratuit |
|-----|------|-------------|---------------|
| **OpenRouteService** | Calcul d'itinéraires (pied, vélo, voiture) — distance, durée, géométrie | ✅ Gratuite sur [openrouteservice.org](https://openrouteservice.org) | 2 000 req/jour |
| **Nominatim (OSM)** | Géocodage : adresse → coordonnées GPS + autocomplétion | ❌ Aucune | Usage raisonnable |
| **Open-Meteo** | Météo en temps réel : température, vent, conditions | ❌ Aucune | Illimité |
| **Leaflet.js** | Carte interactive rendue dans WebView | ❌ Open source | Illimité |
| **CartoDB Dark Tiles** | Tuiles de carte au thème sombre | ❌ Aucune | Illimité |

---

## ⚙️ Algorithme d'optimisation multi-critères

### Principe

L'algorithme calcule un **score pondéré** pour chaque itinéraire selon la priorité choisie par l'utilisateur, conformément à la section §2.2 du cahier des charges.

### Formule de scoring (fichier `optimization.ts`)

```
score_brut(t, c, d) = w_temps × t + w_coût × c + w_distance × d × 2
```

| Priorité | w_temps | w_coût | w_distance |
|----------|---------|--------|------------|
| ⚡ Rapide | 0.70 | 0.10 | 0.20 |
| 💰 Économique | 0.10 | 0.80 | 0.10 |
| ⚖️ Équilibré | 0.40 | 0.35 | 0.25 |

### Normalisation (0 → 100)

```
score_normalisé = (1 - (score_brut - min) / (max - min)) × 100
```

Un score de **100 = meilleur**, **0 = pire** dans l'ensemble des options calculées.

### Estimation des coûts

```
coût_total = Σ (tarif_fixe(mode) + coût_km(mode) × distance_km)
```

| Mode | Tarif fixe | Coût/km |
|------|-----------|---------|
| Marche | 0 MAD | 0 MAD |
| Bus | 4 MAD | 0 MAD |
| Tram | 6 MAD | 0 MAD |
| Taxi | 5 MAD (flag) | 3.5 MAD |
| Vélo | 0 MAD | 0 MAD |

---

## 🔧 Patterns d'architecture

### State Management — useReducer (Redux-like)

```typescript
// AppContext.tsx
type Action =
  | { type: 'SET_DEPARTURE';  payload: GeocodingResult | null }
  | { type: 'SET_ROUTES';     payload: RouteOption[] }
  | { type: 'SWAP_LOCATIONS' }
  | ...

const [state, dispatch] = useReducer(reducer, initialState);
```

Avantages : mutations prévisibles, debuggable, scalable vers Redux si nécessaire.

### Custom Hooks (Separation of Concerns)

| Hook | Responsabilité |
|------|----------------|
| `useGeocoding` | Autocomplétion avec debounce (450ms) via Nominatim |
| `useRoutes` | Déclenchement du calcul ORS + optimisation |
| `useWeather` | Météo + trafic avec refresh automatique (5 min) |
| `useAuth` | Login, register, logout, sauvegarde historique |

### Services Layer

- `api.ts` : accès aux APIs, gestion d'erreurs, fallback si ORS indisponible
- `optimization.ts` : logique métier pure (testable indépendamment)

---

## 🚀 Installation et lancement

### 1. Prérequis
- **Node.js** 18+
- **Expo CLI** : `npm install -g @expo/cli`
- **Expo Go** sur votre smartphone (iOS ou Android)

### 2. Installation

```bash
# Créer le projet Expo
npx create-expo-app UrbanRoute --template blank-typescript
cd UrbanRoute

# Installer les dépendances navigation
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# Carte interactive
npx expo install react-native-webview

# Géolocalisation (optionnel)
npx expo install expo-location

# Copier tous les fichiers src/ dans le projet
```

### 3. Clé API OpenRouteService (GRATUIT)

1. S'inscrire sur [https://openrouteservice.org/dev/#/signup](https://openrouteservice.org/dev/#/signup)
2. Générer une clé API (2 000 requêtes/jour gratuitement)
3. Remplacer dans `src/services/api.ts` :

```typescript
export const ORS_API_KEY = 'VOTRE_CLE_ICI';
```

> ⚠️ Sans clé valide, l'application utilise un **fallback automatique** basé sur la distance à vol d'oiseau (Haversine) pour permettre le développement.

### 4. Lancer

```bash
npx expo start
# Scannez le QR code avec Expo Go
```

---

## ✅ Conformité au cahier des charges

| Section | Fonctionnalité | Statut |
|---------|---------------|--------|
| §2.1 | Saisie départ + destination | ✅ Autocomplétion Nominatim |
| §2.1 | Géolocalisation automatique | ✅ expo-location |
| §2.1 | Affichage de plusieurs itinéraires | ✅ 3 variantes |
| §2.1 | Bus, tram, taxi, marche, vélo | ✅ Tous intégrés |
| §2.1 | Interface carte interactive | ✅ Leaflet + OSM |
| §2.2 | Trajet le plus rapide | ✅ taxi + marche |
| §2.2 | Trajet le moins cher | ✅ bus + marche |
| §2.2 | Trajet équilibré | ✅ tram + vélo |
| §2.3 | Trafic en temps réel | ✅ Estimation heuristique (heures de pointe) |
| §2.3 | Météo temps réel | ✅ Open-Meteo |
| §2.4 | Carte interactive | ✅ Leaflet WebView |
| §2.4 | Estimation temps/coût/distance | ✅ Affichée pour chaque trajet |
| §2.4 | Historique des trajets | ✅ Stocké en mémoire (état global) |
| §2.5 | Authentification login/password | ✅ (simulation, remplaçable Firebase) |
| §2.5 | Profils personnalisés | ✅ Préférences + historique |

---

## 🔮 Améliorations futures

- [ ] **Firebase Auth** pour l'authentification réelle
- [ ] **Firestore** pour la persistence de l'historique
- [ ] **GTFS** pour les horaires réels des transports en commun de Tanger
- [ ] **TomTom Traffic API** (free tier) pour le trafic en temps réel
- [ ] **Notifications push** : alertes retards, météo défavorable
- [ ] **Mode hors-ligne** : cache Leaflet + calcul local
- [ ] **Tests unitaires** : Jest sur `optimization.ts`, `utils/`
