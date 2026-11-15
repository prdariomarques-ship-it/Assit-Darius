import React, { useEffect, useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import {
  ServiceWorkerStateSnapshot,
  subscribeServiceWorkerState,
  triggerServiceWorkerUpdate,
} from '../../pwa/registerServiceWorker';
import { useOnlineStatus } from '../../pwa/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [swState, setSwState] = useState<ServiceWorkerStateSnapshot>({
    supported: false,
    registered: false,
    offlineReady: false,
    needRefresh: false,
  });

  useEffect(() => {
    return subscribeServiceWorkerState(setSwState);
  }, []);

  return (
    <>
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-lg border border-amber-500/40 bg-amber-950/95 px-3.5 py-2 text-xs font-medium text-amber-100 shadow-lg backdrop-blur-md"
        >
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <WifiOff className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
          <span>
            Modo Offline — Dados locais (IndexedDB) e Service Worker em uso.
          </span>
        </div>
      )}

      {swState.needRefresh && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-teal-500/40 bg-zinc-900/95 px-3.5 py-2 text-xs text-zinc-100 shadow-lg backdrop-blur-md"
        >
          <span>Nova versão do Dario Assistant disponível.</span>
          <button
            type="button"
            onClick={() => void triggerServiceWorkerUpdate()}
            className="inline-flex items-center gap-1.5 rounded bg-teal-500 px-2.5 py-1 text-[11px] font-semibold text-zinc-950 hover:bg-teal-400"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            <span>Atualizar</span>
          </button>
        </div>
      )}
    </>
  );
};
