'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const DEVICE_ID_KEY = 'skaarviPushDeviceId';
const FIREBASE_SERVICE_WORKER_PATH = '/firebase-messaging-sw.js';

const isPushServiceError = (error) => (
  error?.code === 'messaging/token-subscribe-failed'
  || /push service error|token-subscribe-failed/i.test(error?.message || '')
);

const getPushErrorMessage = (error) => {
  if (isPushServiceError(error)) {
    return 'Browser push service is unavailable. Allow notifications in browser and Windows settings, then restart the browser and try again.';
  }
  return error?.message || 'Failed to enable notifications.';
};

const resetWebPushRegistration = async () => {
  const registrations = await navigator.serviceWorker.getRegistrations();
  const firebaseRegistrations = registrations.filter((registration) => (
    registration.active?.scriptURL.includes(FIREBASE_SERVICE_WORKER_PATH)
    || registration.installing?.scriptURL.includes(FIREBASE_SERVICE_WORKER_PATH)
    || registration.waiting?.scriptURL.includes(FIREBASE_SERVICE_WORKER_PATH)
  ));

  await Promise.all(firebaseRegistrations.map(async (registration) => {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) await subscription.unsubscribe();
    await registration.unregister();
  }));
};

const getDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = globalThis.crypto?.randomUUID?.() || `web-${Date.now()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

const registerDeviceToken = async ({ token, platform }) => {
  const authToken = localStorage.getItem('token');
  if (!authToken) throw new Error('Please sign in again before enabling notifications.');
  if (!token) throw new Error('Firebase did not return a notification token.');

  const response = await fetch('/api/notifications/devices', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, platform, deviceId: getDeviceId() }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Device registration failed (${response.status}).`);
  }
  return true;
};

const announceNotification = (payload) => {
  const title = payload?.notification?.title || payload?.title || 'SKAARVI';
  const body = payload?.notification?.body || payload?.body || 'You have a new notification.';
  toast(`${title}: ${body}`, { duration: 6000 });
  window.dispatchEvent(new CustomEvent('skaarvi:push-notification', { detail: payload }));
};

export default function PushNotificationManager() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user) return undefined;

    let disposed = false;
    const cleanupCallbacks = [];
    let webRegistrationPromise;

    const setupNativePush = async () => {
      const [{ Capacitor }, { PushNotifications }] = await Promise.all([
        import('@capacitor/core'),
        import('@capacitor/push-notifications'),
      ]);
      if (!Capacitor.isNativePlatform()) return false;

      const registrationListener = await PushNotifications.addListener('registration', async ({ value }) => {
        await registerDeviceToken({ token: value, platform: Capacitor.getPlatform() });
      });
      const errorListener = await PushNotifications.addListener('registrationError', (error) => {
        console.error('[Push] Native registration failed:', error);
      });
      const receivedListener = await PushNotifications.addListener('pushNotificationReceived', announceNotification);
      const actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
        const url = notification?.data?.url;
        if (url) router.push(url);
        window.dispatchEvent(new CustomEvent('skaarvi:push-notification', { detail: notification }));
      });
      cleanupCallbacks.push(
        () => registrationListener.remove(),
        () => errorListener.remove(),
        () => receivedListener.remove(),
        () => actionListener.remove()
      );

      if (Capacitor.getPlatform() === 'android') {
        await PushNotifications.createChannel({
          id: 'orders',
          name: 'Orders',
          description: 'Order and fulfillment updates',
          importance: 5,
          visibility: 1,
          vibration: true,
        });
      }

      let permission = await PushNotifications.checkPermissions();
      if (permission.receive === 'prompt') permission = await PushNotifications.requestPermissions();
      if (permission.receive === 'granted') await PushNotifications.register();
      return true;
    };

    const setupWebPush = async (requestPermission, allowRecovery = true) => {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        throw new Error('This browser does not support push notifications.');
      }
      if (Notification.permission === 'denied') {
        throw new Error('Notifications are blocked. Allow them in Site settings and try again.');
      }
      if (Notification.permission === 'default' && !requestPermission) return false;
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission was not granted.');
        }
      }

      const configResponse = await fetch('/api/notifications/firebase-config', { cache: 'no-store' });
      const config = await configResponse.json();
      if (!configResponse.ok || !config.enabled) {
        const missingConfig = config.missing?.length ? `: ${config.missing.join(', ')}` : '';
        throw new Error(`Firebase web push is not configured${missingConfig}.`);
      }

      const [{ getApps, initializeApp }, { getMessaging, getToken, isSupported, onMessage }] = await Promise.all([
        import('firebase/app'),
        import('firebase/messaging'),
      ]);
      if (!(await isSupported())) throw new Error('Firebase Messaging is not supported by this browser.');
      if (disposed) return false;

      const serviceWorkerRegistration = await navigator.serviceWorker.register(
        FIREBASE_SERVICE_WORKER_PATH,
        { updateViaCache: 'none' }
      );
      await serviceWorkerRegistration.update();
      await navigator.serviceWorker.ready;
      const app = getApps()[0] || initializeApp(config.firebaseConfig);
      const messaging = getMessaging(app);
      let token;
      try {
        token = await getToken(messaging, {
          vapidKey: config.vapidKey,
          serviceWorkerRegistration,
        });
      } catch (error) {
        if (!allowRecovery || !isPushServiceError(error)) throw error;
        await resetWebPushRegistration();
        return setupWebPush(requestPermission, false);
      }
      await registerDeviceToken({ token, platform: 'web' });
      const unsubscribe = onMessage(messaging, announceNotification);
      cleanupCallbacks.push(unsubscribe);
      return true;
    };

    const enableWebPush = ({ showFeedback = true } = {}) => {
      if (webRegistrationPromise) return;
      webRegistrationPromise = setupWebPush(true)
        .then((registered) => {
          if (registered && showFeedback) toast.success('Notifications enabled');
          return registered;
        })
        .catch((error) => {
          webRegistrationPromise = undefined;
          console.error('[Push] Web registration failed:', error);
          if (showFeedback) toast.error(getPushErrorMessage(error));
          return false;
        });
    };
    const handleEnableWebPush = () => enableWebPush({ showFeedback: true });
    window.addEventListener('skaarvi:enable-push', handleEnableWebPush);
    cleanupCallbacks.push(() => window.removeEventListener('skaarvi:enable-push', handleEnableWebPush));

    setupNativePush()
      .then((isNative) => {
        if (!isNative && Notification.permission === 'granted') {
          enableWebPush({ showFeedback: false });
        }
      })
      .catch((error) => console.error('[Push] Native setup failed:', error));

    return () => {
      disposed = true;
      cleanupCallbacks.forEach((cleanup) => cleanup());
    };
  }, [isAuthenticated, router, user]);

  return null;
}