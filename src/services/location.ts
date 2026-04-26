/**
 * location.ts
 * Service de géolocalisation GPS via expo-location.
 * Récupère la position courante de l'utilisateur.
 */

import { Coordinates } from '../types';

/**
 * Demande la permission et retourne les coordonnées GPS actuelles.
 * Retourne null si permission refusée ou erreur.
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    // Dynamic import to avoid crash if expo-location not installed
    const Location = await import('expo-location');

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[Location] Permission denied');
      return null;
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
    };
  } catch (err) {
    console.warn('[Location] Error:', err);
    return null;
  }
}
