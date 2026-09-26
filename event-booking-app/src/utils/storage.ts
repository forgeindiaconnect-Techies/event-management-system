import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.log('Web localStorage set error:', e);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    console.log('SecureStore set error:', err);
  }
}

export async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.log('Web localStorage get error:', e);
    }
    return null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.log('SecureStore get error:', err);
    return null;
  }
}

export async function deleteStorageItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.log('Web localStorage delete error:', e);
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    console.log('SecureStore delete error:', err);
  }
}
