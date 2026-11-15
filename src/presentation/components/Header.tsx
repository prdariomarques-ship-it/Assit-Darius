import { useState } from 'react';
import { Bell, Settings, ServerOff, Server, Loader2 } from 'lucide-react';
import { ConnectionState } from '../../domain/models';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  userName: string;
  deviceLabel: string;
  instanceId: string;
  connectionState: ConnectionState;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onGoHome: () => void;
}

const AVATAR_PATH = '/src/assets/images/dario_profile_avatar_1794672101458.jpg';

export function Header({
  userName,
  deviceLabel,
  instanceId,
  connectionState,
  unreadCount,
  onOpenNotifications,
  onOpenSettings,
  onGoHome,
}: HeaderProps) {
  const [imgError, setImgError] = useState(false);

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const connectionLabel =
    connectionState === 'checking'
      ? 'Verificando VPS'
      : connectionState === 'configured_unverified'
        ? 'VPS alcançável'
        : connectionState === 'unreachable'
          ? 'VPS inacessível'
          : 'Isolado · Local';

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-zinc-800/90 bg-[#090C10]/95 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="flex min-h-[44px] items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            aria-label="Ir para início do Dario Assistant"
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-zinc-700/80 bg-zinc-900">
              {!imgError ? (
                <img
                  src={AVATAR_PATH}
                  alt={`Foto de perfil de ${userName}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-teal-300">
                  {initials || 'DA'}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold tracking-tight text-zinc-100">
                  Dario Assistant
                </span>
              </div>
              <p className="truncate text-xs text-zinc-400">
                {userName} · <span className="text-teal-400">{deviceLabel}</span>{' '}
                <span className="hidden font-mono text-[11px] text-zinc-500 md:inline">
                  ({instanceId})
                </span>
              </p>
            </div>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <PWAInstallButton variant="header" deviceLabel={deviceLabel} />

          <button
            type="button"
            onClick={onOpenSettings}
            className="hidden min-h-[40px] items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:inline-flex whitespace-nowrap"
            title="Configurar conexão VPS"
          >
            {connectionState === 'checking' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" aria-hidden="true" />
            ) : connectionState === 'configured_unverified' ? (
              <Server className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
            ) : (
              <ServerOff className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
            )}
            <span>{connectionLabel}</span>
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            aria-label={`Central de notificações (${unreadCount} não lidas)`}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal-500 px-1 font-mono text-[10px] font-semibold tabular-nums text-zinc-950">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            aria-label="Abrir configurações"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
