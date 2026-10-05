import { getApp, getApps, initializeApp } from "@firebase/app";
import { getMessaging, isSupported, onRegistered, register, unregister } from "@firebase/messaging";

const installationStorageKey = "marifat_firebase_installation_id";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseClientConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.messagingSenderId && config.appId && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
);

export async function registerFirebaseInstallation(): Promise<string> {
  if (!firebaseClientConfigured) throw new Error("Firebase web konfiguratsiyasi topilmadi");
  if (!(await isSupported())) throw new Error("Bu brauzer push bildirishnomalarini qo‘llamaydi");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Brauzer bildirishnomalariga ruxsat berilmadi");
  const serviceWorkerRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
  const app = getApps().length ? getApp() : initializeApp(config);
  const messaging = getMessaging(app);
  return new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Firebase ro‘yxatdan o‘tish vaqti tugadi")), 20_000);
    const unsubscribe = onRegistered(messaging, (fid) => {
      window.clearTimeout(timeout);
      unsubscribe();
      window.localStorage.setItem(installationStorageKey, fid);
      resolve(fid);
    });
    register(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration }).catch((cause) => {
      window.clearTimeout(timeout);
      unsubscribe();
      reject(cause);
    });
  });
}

export function getCurrentFirebaseInstallationId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(installationStorageKey);
}

export async function unregisterFirebaseInstallation(): Promise<void> {
  if (!firebaseClientConfigured || !(await isSupported())) return;
  const app = getApps().length ? getApp() : initializeApp(config);
  await unregister(getMessaging(app));
  window.localStorage.removeItem(installationStorageKey);
}
