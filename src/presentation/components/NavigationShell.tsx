import {
  CalendarClock,
  FileText,
  MessageSquare,
  PlugZap,
  Radar,
} from 'lucide-react';
import { PrimaryTab } from '../../domain/models';

interface NavigationShellProps {
  activeTab: PrimaryTab;
  onSelectTab: (tab: PrimaryTab) => void;
  unreadRadarCount: number;
  onOpenSettings: () => void;
}

const NAV_ITEMS: Array<{
  id: PrimaryTab;
  label: string;
  description: string;
  icon: typeof MessageSquare;
}> = [
  {
    id: 'conversas',
    label: 'Conversas',
    description: 'Diálogos e contexto isolado',
    icon: MessageSquare,
  },
  {
    id: 'artefatos',
    label: 'Artefatos',
    description: 'Documentos e transcrições',
    icon: FileText,
  },
  {
    id: 'agendados',
    label: 'Agendados',
    description: 'Rotinas programadas',
    icon: CalendarClock,
  },
  {
    id: 'radar',
    label: 'Radar',
    description: 'Sinais prioritários',
    icon: Radar,
  },
  {
    id: 'conectores',
    label: 'Conectores',
    description: 'Integrações e contratos',
    icon: PlugZap,
  },
];

export function DesktopSidebar({
  activeTab,
  onSelectTab,
  unreadRadarCount,
  onOpenSettings,
}: NavigationShellProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-800/90 bg-[#090C10] lg:flex lg:flex-col lg:justify-between">
      <div className="p-4">
        <p className="px-3 pb-2 text-xs font-medium text-zinc-500">Navegação</p>
        <nav aria-label="Menu principal" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                  active
                    ? 'bg-zinc-800/80 text-zinc-50'
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? 'text-teal-400' : 'text-zinc-500'}`}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-medium">{item.label}</span>
                </span>
                {item.id === 'radar' && unreadRadarCount > 0 && (
                  <span className="font-mono text-xs tabular-nums text-sky-400">
                    {unreadRadarCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-zinc-800/80 p-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5">
          <p className="text-xs font-medium text-zinc-200">Fase 1 · Fundação</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Protótipo web interativo para validação visual. Integrações e backend VPS permanecem desacoplados.
          </p>
          <button
            type="button"
            onClick={onOpenSettings}
            className="mt-3 text-xs font-medium text-teal-400 hover:text-teal-300 focus-visible:outline-none focus-visible:underline"
          >
            Ver documentação e VPS
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
}: Pick<NavigationShellProps, 'activeTab' | 'onSelectTab'>) {
  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed bottom-0 left-0 right-0 z-30 h-14 border-t border-zinc-800/90 bg-[#090C10]/95 backdrop-blur-md lg:hidden"
    >
      <div className="grid h-full grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-400 ${
                active ? 'text-teal-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="truncate text-[10px] font-medium tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
