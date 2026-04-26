import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { geocodeAddress, calculateRoutes, getWeather, getTrafficData } from '../services/api';
import { detectCityTransport } from '../services/cityDetector';
import { sortRoutes } from '../services/optimization';
import { GeocodingResult, User, TransportMode } from '../types';
import { DEFAULT_CITY } from '../constants';
import { generateTripId } from '../utils';

// ---- useGeocoding — Photon avec biais position actuelle ----
export function useGeocoding() {
  const { state } = useAppContext();
  const [results, setResults]   = useState<GeocodingResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  const search = useCallback(async (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Passe la position courante pour biais géographique
        const bias = state.departure?.coords ?? DEFAULT_CITY.coords;
        setResults(await geocodeAddress(query, bias));
      } finally { setLoading(false); }
    }, 400);
  }, [state.departure]);

  const clear = useCallback(() => {
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return { results, loading, search, clear };
}

// ---- useRoutes ----
export function useRoutes() {
  const { state, dispatch } = useAppContext();
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async () => {
    const { departure, destination, selectedPriority, selectedModes } = state;
    if (!departure || !destination) return;
    dispatch({ type:'SET_CALCULATING', payload:true });
    setError(null);
    try {
      const trafficFactor = state.traffic?.factor ?? 1.0;
      const routes = await calculateRoutes(
        departure.coords, destination.coords, trafficFactor,
        selectedModes as TransportMode[],
        state.detectedCity,           // ville départ pour ONCF
        destination.shortName,        // ville destination pour ONCF
      );
      const sorted = sortRoutes(routes, selectedPriority);
      dispatch({ type:'SET_ROUTES', payload:sorted });
      const best = sorted.find(r => r.type === selectedPriority) ?? sorted[0];
      if (best) dispatch({ type:'SET_SELECTED_ROUTE', payload:best });
    } catch (err) {
      setError('Impossible de calculer les itinéraires. Vérifiez votre connexion.');
    } finally { dispatch({ type:'SET_CALCULATING', payload:false }); }
  }, [state.departure, state.destination, state.selectedPriority, state.selectedModes, state.traffic, state.detectedCity]);

  const selectRoute = useCallback((routeId: string) => {
    const route = state.routes.find(r => r.id === routeId);
    if (route) dispatch({ type:'SET_SELECTED_ROUTE', payload:route });
  }, [state.routes]);

  return { calculate, selectRoute, error };
}

// ---- useWeather ----
export function useWeather() {
  const { state, dispatch } = useAppContext();

  const refresh = useCallback(async () => {
    const coords = state.departure?.coords ?? DEFAULT_CITY.coords;
    const weather = await getWeather(coords);
    if (weather) dispatch({ type:'SET_WEATHER', payload:weather });
    const cityConfig = detectCityTransport(coords);
    dispatch({ type:'SET_AVAILABLE_MODES', payload:{ city:cityConfig.name, modes:cityConfig.availableModes as TransportMode[] } });
  }, [state.departure]);

  const refreshTraffic = useCallback(() => {
    dispatch({ type:'SET_TRAFFIC', payload:getTrafficData() });
  }, []);

  useEffect(() => {
    refresh(); refreshTraffic();
    const iv = setInterval(refreshTraffic, 5*60*1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { if (state.departure) refresh(); }, [state.departure?.coords.lat]);

  return { weather:state.weather, traffic:state.traffic, refresh };
}

// ---- useAuth ----
export function useAuth() {
  const { state, dispatch } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string|null>(null);

  const login = useCallback(async (email: string, password: string) => {
    if (!email||!password) { setError('Veuillez remplir tous les champs'); return false; }
    if (!email.includes('@')) { setError('Email invalide'); return false; }
    if (password.length<6)    { setError('Mot de passe trop court (6 min)'); return false; }
    setLoading(true); setError(null);
    try {
      await new Promise(r => setTimeout(r, 700));
      const user: User = {
        id:`user_${Date.now()}`, name:email.split('@')[0].replace(/[._]/g,' '), email,
        preferences:{ defaultPriority:'equilibre', favoriteTransports:['bus','walk'], city:DEFAULT_CITY.name, theme:'light' },
        history:[], createdAt:new Date().toISOString(),
      };
      dispatch({ type:'SET_USER', payload:user });
      dispatch({ type:'SET_AUTHENTICATED', payload:true });
      return true;
    } catch { setError('Erreur. Réessayez.'); return false; }
    finally { setLoading(false); }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    if (!name) { setError('Nom requis'); return false; }
    return login(email, password);
  }, [login]);

  const loginAsGuest = useCallback(() => {
    dispatch({ type:'SET_USER', payload:{
      id:'guest', name:'Invité', email:'invite@urbanroute.ma',
      preferences:{ defaultPriority:'equilibre', favoriteTransports:['bus'], city:DEFAULT_CITY.name, theme:'light' },
      history:[], createdAt:new Date().toISOString(),
    }});
    dispatch({ type:'SET_AUTHENTICATED', payload:true });
  }, []);

  const logout = useCallback(() => dispatch({ type:'LOGOUT' }), []);

  const saveTripToHistory = useCallback(() => {
    const { user, selectedRoute, departure, destination } = state;
    if (!user||!selectedRoute||!departure||!destination) return;
    const trip = {
      id:generateTripId(), date:new Date().toISOString(),
      departure:departure.shortName, destination:destination.shortName,
      priority:selectedRoute.type, duration:selectedRoute.duration,
      cost:selectedRoute.cost, distance:selectedRoute.distance,
      transport:selectedRoute.segments.map(s => s.mode),
    };
    dispatch({ type:'SET_USER', payload:{ ...user, history:[trip,...user.history].slice(0,50) } });
  }, [state.user, state.selectedRoute, state.departure, state.destination]);

  return { user:state.user, isAuthenticated:state.isAuthenticated, loading, error, login, register, loginAsGuest, logout, saveTripToHistory };
}
