/**
 * storage.ts
 * Abstraction layer pour la persistance locale.
 * Utilise AsyncStorage (Expo) — remplaçable par Firestore en production.
 *
 * Installation : npx expo install @react-native-async-storage/async-storage
 */

// Clés de stockage
const KEYS = {
  USER:    'urbanroute:user',
  HISTORY: 'urbanroute:history',
  PREFS:   'urbanroute:preferences',
} as const;

/**
 * Sauvegarde une valeur JSON dans AsyncStorage.
 * Silencieux en cas d'erreur (non bloquant).
 */
export async function saveItem<T>(key: string, value: T): Promise<void> {
  try {
    // Uncomment when @react-native-async-storage/async-storage is installed:
    // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    // await AsyncStorage.setItem(key, JSON.stringify(value));
    console.log(`[Storage] Saved: ${key}`);
  } catch (err) {
    console.warn(`[Storage] Save error for key "${key}":`, err);
  }
}

/**
 * Récupère et parse une valeur depuis AsyncStorage.
 * Retourne null si absent ou erreur.
 */
export async function loadItem<T>(key: string): Promise<T | null> {
  try {
    // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    // const raw = await AsyncStorage.getItem(key);
    // return raw ? JSON.parse(raw) as T : null;
    return null;
  } catch (err) {
    console.warn(`[Storage] Load error for key "${key}":`, err);
    return null;
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    // await AsyncStorage.removeItem(key);
  } catch (err) {
    console.warn(`[Storage] Remove error for key "${key}":`, err);
  }
}

export { KEYS };
