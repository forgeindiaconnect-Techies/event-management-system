import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { API_BASE_URL } from "./api/axiosConfig";

const firebaseConfig = {
  apiKey: "AIzaSyAVP0wrWoP_w3gr2DNrNcLEjWuvebrW2W8",
  authDomain: "event-management-system-96a62.firebaseapp.com",
  projectId: "event-management-system-96a62",
  storageBucket: "event-management-system-96a62.firebasestorage.app",
  messagingSenderId: "753212983637",
  appId: "1:753212983637:web:36388d5d0ce6e82a90c7dc",
  measurementId: "G-WXRBVG0TFM"
};

export const VAPID_KEY = "BFxKxzylN8-eu3eBaxmFt29S-3KCpXXRWIpxtbYRQXQvvwg-I4qomdO8IkpLIYLCkn18Hc36IGUQ950dSFqQFoQ";

const app = initializeApp(firebaseConfig);

let messaging = null;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.warn("Firebase messaging not supported in this environment:", err);
  }
}

/**
 * Requests browser permission and returns the Web FCM token
 * @param {string} [vapidKey] Web Push certificate key pair from Firebase Console
 */
export const requestNotificationPermissionAndGetToken = async (vapidKey = VAPID_KEY) => {
  if (!messaging) {
    console.warn("Firebase messaging is not available.");
    return null;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Register service worker and ensure it is active
      let registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      if (!registration.active) {
        registration = await navigator.serviceWorker.ready;
      }
      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (currentToken) {
        console.log("Web FCM Push Token:", currentToken);
        return currentToken;
      }
    } else {
      console.warn("Notification permission was denied or dismissed.");
    }
  } catch (error) {
    console.error("Unable to get notification permission or token:", error);
  }
  return null;
};

/**
 * Syncs the token with the Spring Boot backend for the logged-in user
 */
export const syncWebTokenWithBackend = async (email, vapidKey = VAPID_KEY) => {
  if (!email) return false;
  try {
    const token = await requestNotificationPermissionAndGetToken(vapidKey);
    if (!token) return false;

    const res = await fetch(`${API_BASE_URL}/users/fcm-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, fcmToken: token })
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to sync Web FCM token with backend:", err);
    return false;
  }
};

/**
 * Listener for foreground notifications
 */
export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    if (callback) callback(payload);
  });
};

export { app, messaging };
