/**
 * useLocation.ts
 * Hook pour détecter la position GPS de l'utilisateur
 * et l'utiliser comme point de départ automatique.
 */

import { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { getCurrentLocation } from '../services/location';
import { reverseGeocode } from '../services/api';

export function useLocation() {
  const { dispatch } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const locateMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const coords = await getCurrentLocation();
      if (!coords) {
        setError('Localisation refusée ou indisponible');
        return null;
      }
      const name = await reverseGeocode(coords);
      const shortName = name.split(',').slice(0, 2).join(',');
      const result = { displayName: name, shortName, coords, type: 'gps' };
      dispatch({ type: 'SET_DEPARTURE', payload: result });
      return result;
    } catch (err) {
      setError('Impossible de récupérer la position');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { locateMe, loading, error };
}
