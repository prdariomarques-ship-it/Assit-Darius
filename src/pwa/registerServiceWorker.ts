import { registerSW } from 'virtual:pwa-register';

export interface ServiceWorkerStateSnapshot {
  supported: boolean;
  registered: boolean;
  offlineReady: boolean;
  needRefresh: boolean;
}

type SwListener = (state: ServiceWorkerStateSnapshot) => void;

let currentState: ServiceWorkerStateSnapshot = {
  supported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  registered: false,
  offlineReady: false,
  needRefresh: false,
};

const listeners = new Set<SwListener>();
let updateSwFn: ((reloadPage?: boolean) => Promise<void>) | null = null;
let initialized = false;

function notify() {
  for (const listener of listeners) {
    listener(currentState);
  }
}

export function initPwaServiceWorker(): void {
  if (initialized) return;
  initialized = true;

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    currentState = {
      supported: false,
      registered: false,
      offlineReady: false,
      needRefresh: false,
    };
    notify();
    return;
  }

  try {
    updateSwFn = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        currentState = {
          ...currentState,
          supported: true,
          registered: Boolean(registration),
          offlineReady: true,
        };
        notify();
      },
      onOfflineReady() {
        currentState = {
          ...currentState,
          supported: true,
          registered: true,
          offlineReady: true,
        };
        notify();
      },
      onNeedRefresh() {
        currentState = {
          ...currentState,
          needRefresh: true,
        };
        notify();
      },
      onRegisterError() {
        currentState = {
          ...currentState,
          registered: false,
        };
        notify();
      },
    });
  } catch {
    // Fallback in non-Vite or test environments
  }
}

export function subscribeServiceWorkerState(listener: SwListener): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => {
    listeners.delete(listener);
  };
}

export async function triggerServiceWorkerUpdate(): Promise<void> {
  if (updateSwFn) {
    await updateSwFn(true);
  }
}
