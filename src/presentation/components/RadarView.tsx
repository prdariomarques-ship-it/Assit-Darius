import { Check, Radar } from 'lucide-react';
import {
  RadarMonitoringPreferences,
  RadarPriority,
  RadarSignal,
} from '../../domain/models';

interface RadarViewProps {
  signals: RadarSignal[];
  priorityFilter: RadarPriority | 'todas';
  preferences: RadarMonitoringPreferences;
  onPriorityFilterChange: (priority: RadarPriority | 'todas') => void;
  onTogglePreference: (key: keyof RadarMonitoringPreferences) => void;
  onToggleAcknowledge: (id: string) => void;
}

const PREF_LABELS: Array<{ key: keyof RadarMonitoringPreferences; label: string }> = [
  { key: 'emails_sem_resposta', label: 'E-mails sem resposta' },
  { key: 'compromissos', label: 'Compromissos próximos' },
  { key: 'documentos_pendentes', label: 'Documentos pendentes' },
  { key: 'tarefas_atrasadas', label: 'Tarefas atrasadas' },
  { key: 'conversas_relevantes', label: 'Informações em conversas' },
];

export function RadarView({
  signals,
  priorityFilter,
  preferences,
  onPriorityFilterChange,
  onTogglePreference,
  onToggleAcknowledge,
}: RadarViewProps) {
  return (
    <div className="space-y-5">
      <div className="border-b border-zinc-800/90 pb-4">
        <h1 className="text-lg font-semibold text-zinc-100">Radar Proativo</h1>
        <p className="mt-1 text-xs text-zinc-400">
          Separação explícita entre Fato, Inferência e Sugestão. O monitoramento contínuo 24h roda no backend VPS a partir da Fase 7.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['todas', 'alta', 'media', 'baixa'] as const).map((level) => {
              const active = priorityFilter === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onPriorityFilterChange(level)}
                  className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-teal-500 text-zinc-950'
                      : 'border border-zinc-800 bg-[#0D1117] text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {level === 'todas' ? 'Todas prioridades' : `Prioridade ${level}`}
                </button>
              );
            })}
          </div>

          {signals.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-[#0D1117] p-6 text-center">
              <p className="text-sm text-zinc-300">Nenhum sinal visível com os filtros atuais.</p>
              <p className="mt-1 text-xs text-zinc-500">
                Habilite categorias ao lado ou altere o filtro de prioridade.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((sig) => (
                <article
                  key={sig.id}
                  className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
                    sig.acknowledged
                      ? 'border-zinc-800/60 bg-[#0A0D12] opacity-75'
                      : 'border-zinc-800 bg-[#0D1117]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <Radar className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                      <div>
                        <h2 className="text-sm font-semibold text-zinc-100">{sig.title}</h2>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-400">{sig.summary}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleAcknowledge(sig.id)}
                      className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                        sig.acknowledged
                          ? 'border-zinc-800 bg-zinc-900 text-zinc-400'
                          : 'border-teal-500/40 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{sig.acknowledged ? 'Revisado' : 'Marcar visto'}</span>
                    </button>
                  </div>

                  <p className="mt-3 text-[11px] text-zinc-500">
                    Prioridade {sig.priority} · Classificação: {sig.classification} · {sig.origin} ·{' '}
                    {sig.detectedAt}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-5">
            <h2 className="text-sm font-semibold text-zinc-100">Controle de monitoramento</h2>
            <p className="mt-1 text-xs text-zinc-400">
              Preferências (<span className="font-mono text-zinc-300">radarPrefs</span>) persistidas no Jetpack DataStore via <span className="font-mono text-zinc-300">UserPreferencesRepository</span>.
            </p>
            <div className="mt-4 space-y-2.5">
              {PREF_LABELS.map((item) => {
                const enabled = preferences[item.key];
                return (
                  <label
                    key={item.key}
                    className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-3.5 py-2"
                  >
                    <span className="text-xs font-medium text-zinc-200">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => onTogglePreference(item.key)}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-teal-500"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
