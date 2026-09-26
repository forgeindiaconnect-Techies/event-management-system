import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_SERVER_URL = '@custom_server_url';
export const DEFAULT_SERVER_URL = 'http://192.168.1.19:8081/api';

// In-memory cache of the active base URL
let activeBaseUrl: string = DEFAULT_SERVER_URL;

// Initial resolution logic
const resolveInitialUrl = (): string => {
  // 1. Web browser
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || 'localhost';
    return `${window.location.protocol}//${hostname}:8081/api`;
  }

  // 2. Expo Go / Metro host IP if developing
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost') {
      return `http://${ip}:8081/api`;
    }
  }

  // 3. Default host PC Wi-Fi IP
  return DEFAULT_SERVER_URL;
};

activeBaseUrl = resolveInitialUrl();

// Attempt to read custom URL stored by user in app settings
AsyncStorage.getItem(STORAGE_KEY_SERVER_URL).then((stored) => {
  if (stored && stored.trim()) {
    activeBaseUrl = stored.trim().replace(/\/+$/, '');
  }
}).catch(() => {});

/**
 * Synchronously returns the active API base URL.
 */
export const getApiBaseUrl = (): string => {
  return activeBaseUrl;
};

/**
 * Initializes and resolves the active API base URL asynchronously from storage.
 */
export const initApiBaseUrl = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_SERVER_URL);
    if (stored && stored.trim()) {
      activeBaseUrl = stored.trim().replace(/\/+$/, '');
      return activeBaseUrl;
    }
  } catch (e) {
    // Ignore error and use default
  }

  activeBaseUrl = resolveInitialUrl();
  return activeBaseUrl;
};

/**
 * Updates and persists a custom server URL (e.g. if Wi-Fi IP changed or using a tunnel like ngrok).
 */
export const setCustomApiBaseUrl = async (newUrl: string): Promise<string> => {
  let cleanUrl = newUrl.trim().replace(/\/+$/, '');
  if (!cleanUrl.endsWith('/api') && !cleanUrl.includes('/api/')) {
    cleanUrl = `${cleanUrl}/api`;
  }
  activeBaseUrl = cleanUrl;
  await AsyncStorage.setItem(STORAGE_KEY_SERVER_URL, cleanUrl);
  return activeBaseUrl;
};

/**
 * Resets the server URL back to the default local network IP.
 */
export const resetApiBaseUrl = async (): Promise<string> => {
  await AsyncStorage.removeItem(STORAGE_KEY_SERVER_URL);
  activeBaseUrl = resolveInitialUrl();
  return activeBaseUrl;
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Smart fetch that calls the active backend server URL with a reasonable timeout.
 */
export async function smartFetch(path: string, options?: RequestInit): Promise<Response> {
  const currentBase = getApiBaseUrl();
  const url = `${currentBase}${path.startsWith('/') ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[smartFetch] Request to ${url} failed:`, err);
    throw err;
  }
}
