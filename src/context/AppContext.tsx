import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, GeocodingResult, RouteOption, WeatherData, TrafficData, Priority, TransportMode } from '../types';

interface AppState {
  user: User | null; isAuthenticated: boolean;
  departure: GeocodingResult | null; destination: GeocodingResult | null;
  selectedPriority: Priority;
  selectedModes: TransportMode[];   // modes choisis par l'utilisateur
  routes: RouteOption[]; selectedRoute: RouteOption | null;
  isCalculating: boolean;
  weather: WeatherData | null; traffic: TrafficData | null;
  detectedCity: string;             // ville détectée automatiquement
  availableModes: TransportMode[];  // modes disponibles dans la ville
}

const initialState: AppState = {
  user: null, isAuthenticated: false,
  departure: null, destination: null,
  selectedPriority: 'equilibre',
  selectedModes: [],
  routes: [], selectedRoute: null,
  isCalculating: false,
  weather: null, traffic: null,
  detectedCity: 'Tanger',
  availableModes: ['walk', 'bus', 'taxi', 'grandtaxi'],
};

type Action =
  | { type: 'SET_USER';           payload: User | null }
  | { type: 'SET_AUTHENTICATED';  payload: boolean }
  | { type: 'SET_DEPARTURE';      payload: GeocodingResult | null }
  | { type: 'SET_DESTINATION';    payload: GeocodingResult | null }
  | { type: 'SET_PRIORITY';       payload: Priority }
  | { type: 'TOGGLE_MODE';        payload: TransportMode }
  | { type: 'SET_AVAILABLE_MODES';payload: { city: string; modes: TransportMode[] } }
  | { type: 'SET_ROUTES';         payload: RouteOption[] }
  | { type: 'SET_SELECTED_ROUTE'; payload: RouteOption | null }
  | { type: 'SET_CALCULATING';    payload: boolean }
  | { type: 'SET_WEATHER';        payload: WeatherData | null }
  | { type: 'SET_TRAFFIC';        payload: TrafficData | null }
  | { type: 'SWAP_LOCATIONS' }
  | { type: 'LOGOUT' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':            return { ...state, user: action.payload };
    case 'SET_AUTHENTICATED':   return { ...state, isAuthenticated: action.payload };
    case 'SET_DEPARTURE':       return { ...state, departure: action.payload };
    case 'SET_DESTINATION':     return { ...state, destination: action.payload };
    case 'SET_PRIORITY':        return { ...state, selectedPriority: action.payload };
    case 'TOGGLE_MODE': {
      const m = action.payload;
      const already = state.selectedModes.includes(m);
      return {
        ...state,
        selectedModes: already
          ? state.selectedModes.filter(x => x !== m)
          : [...state.selectedModes, m],
      };
    }
    case 'SET_AVAILABLE_MODES': return {
      ...state, detectedCity: action.payload.city,
      availableModes: action.payload.modes, selectedModes: [],
    };
    case 'SET_ROUTES':          return { ...state, routes: action.payload };
    case 'SET_SELECTED_ROUTE':  return { ...state, selectedRoute: action.payload };
    case 'SET_CALCULATING':     return { ...state, isCalculating: action.payload };
    case 'SET_WEATHER':         return { ...state, weather: action.payload };
    case 'SET_TRAFFIC':         return { ...state, traffic: action.payload };
    case 'SWAP_LOCATIONS':      return { ...state, departure: state.destination, destination: state.departure };
    case 'LOGOUT':              return { ...initialState };
    default:                    return state;
  }
}

interface AppContextType { state: AppState; dispatch: React.Dispatch<Action>; }
const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}
