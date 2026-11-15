import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PWAInstallStateSnapshot {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSupportedContext: boolean;
  isBannerDismissed: boolean;
  lastOutcome: 'accepted' | 'dismissed' | null;
}

type InstallListener = (snapshot: PWAInstallStateSnapshot) => void;

let deferredPromptEvent: BeforeInstallPromptEvent | null = null;
let installedState = false;
let bannerDismissedState = false;
let lastOutcomeState: 'accepted' | 'dismissed' | null = null;
let listenersAttached = false;

const listeners = new Set<InstallListener>();

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mediaStandalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  const navigatorStandalone =
    (window.navigator as unknown as { standalone?: boolean })?.standalone === true;
  return Boolean(mediaStandalone || navigatorStandalone);
}

function getSnapshot(): PWAInstallStateSnapshot {
  const hasWindow = typeof window !== 'undefined' && typeof window.navigator !== 'undefined';
  const ua = hasWindow ? window.navigator.userAgent.toLowerCase() : '';
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const hasServiceWorker = hasWindow && 'serviceWorker' in window.navigator;

  return {
    deferredPrompt: deferredPromptEvent,
    isInstallable: Boolean(deferredPromptEvent),
    isInstalled: installedState,
    isIOS,
    isAndroid,
    isSupportedContext: Boolean(deferredPromptEvent) || hasServiceWorker || isAndroid || isIOS,
    isBannerDismissed: bannerDismissedState,
    lastOutcome: lastOutcomeState,
  };
}

function notifyListeners(): void {
  const snapshot = getSnapshot();
  for (const listener of listeners) {
    listener(snapshot);
  }
}

export function initPWAInstallListeners(): void {
  if (typeof window === 'undefined') return;

  installedState = installedState || detectStandalone();

  if (listenersAttached) return;
  listenersAttached = true;

  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    deferredPromptEvent = e as BeforeInstallPromptEvent;
    installedState = false;
    notifyListeners();
  };

  const handleAppInstalled = () => {
    installedState = true;
    deferredPromptEvent = null;
    lastOutcomeState = 'accepted';
    notifyListeners();
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);

  if (typeof window.matchMedia === 'function') {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (ev: MediaQueryListEvent) => {
      if (ev.matches) {
        installedState = true;
        deferredPromptEvent = null;
        notifyListeners();
      }
    };
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    }
  }
}

// Capture early beforeinstallprompt events fired during initial page load
initPWAInstallListeners();

export async function triggerNativeInstallPrompt(): Promise<
  'accepted' | 'dismissed' | 'unavailable'
> {
  if (!deferredPromptEvent) {
    return 'unavailable';
  }

  const currentPrompt = deferredPromptEvent;
  await currentPrompt.prompt();
  const { outcome } = await currentPrompt.userChoice;
  lastOutcomeState = outcome;

  if (outcome === 'accepted') {
    installedState = true;
    deferredPromptEvent = null;
  } else {
    deferredPromptEvent = null;
  }

  notifyListeners();
  return outcome;
}

export function dismissPWAInstallBanner(): void {
  bannerDismissedState = true;
  notifyListeners();
}

export function resetPWAInstallTestState(): void {
  deferredPromptEvent = null;
  installedState = detectStandalone();
  bannerDismissedState = false;
  lastOutcomeState = null;
  notifyListeners();
}

export function usePWAInstall() {
  const [snapshot, setSnapshot] = useState<PWAInstallStateSnapshot>(() => getSnapshot());

  useEffect(() => {
    initPWAInstallListeners();
    setSnapshot(getSnapshot());

    const listener: InstallListener = (next) => {
      setSnapshot(next);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const promptInstall = async () => {
    return triggerNativeInstallPrompt();
  };

  const install = async () => {
    const outcome = await triggerNativeInstallPrompt();
    return outcome === 'accepted';
  };

  return {
    ...snapshot,
    promptInstall,
    install,
    dismissBanner: dismissPWAInstallBanner,
  };
}
