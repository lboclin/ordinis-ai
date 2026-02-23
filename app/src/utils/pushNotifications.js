import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Note: User must add VITE_VAPID_PUBLIC_KEY to .env
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration;
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  }
  return null;
}

export async function subscribeToPushNotifications() {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID Public Key not configured (VITE_VAPID_PUBLIC_KEY).');
    return null;
  }

  if (!('serviceWorker' in navigator)) return null;

  try {
    // Check permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration) return null;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
    }

    // Send to backend (upsert)
    // We need auth token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (token) {
        const response = await axios.post(`${API_URL}/subscribe`, subscription, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}
