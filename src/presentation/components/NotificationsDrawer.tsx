import { CheckCheck, X } from 'lucide-react';
import { NotificationItem, PrimaryTab } from '../../domain/models';

interface NotificationsDrawerProps {
  open: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigateTab: (tab: PrimaryTab) => void;
}

export function NotificationsDrawer({
  open,
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onNavigateTab,
}: NotificationsDrawerProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Central de notificações"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-[#0B0E13]">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Central de notificações</h2>
            <p className="text-xs text-zinc-400">Eventos locais e exemplos da Fase 1</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-teal-400 hover:bg-zinc-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              <span>Marcar lidas</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              aria-label="Fechar notificações"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 divide-y divide-zinc-800/80 overflow-y-auto">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-5 transition-colors ${item.read ? 'bg-transparent' : 'bg-zinc-900/45'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-500">
                  {item.timestamp}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{item.detail}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  {item.read ? 'Lida' : 'Não lida'} · Exemplo Fase 1
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onMarkRead(item.id);
                    onNavigateTab(item.targetTab);
                    onClose();
                  }}
                  className="font-medium text-sky-400 hover:text-sky-300 focus-visible:outline-none focus-visible:underline"
                >
                  Abrir módulo
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
