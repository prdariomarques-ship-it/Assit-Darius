import { useState } from 'react';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { ScheduleFrequency, ScheduledTask } from '../../domain/models';

interface ScheduledViewProps {
  tasks: ScheduledTask[];
  onToggleTask: (id: string) => void;
  onAddTask: (
    name: string,
    frequency: ScheduleFrequency,
    scheduleTime: string,
    requiresConfirmation: boolean
  ) => void;
  onRemoveTask: (id: string) => void;
}

export function ScheduledView({
  tasks,
  onToggleTask,
  onAddTask,
  onRemoveTask,
}: ScheduledViewProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('Diário');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [requiresConfirmation, setRequiresConfirmation] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddTask(name, frequency, scheduleTime, requiresConfirmation);
    setName('');
    setFormOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-800/90 pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Tarefas Agendadas</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Lista demonstrativa local. Nenhuma tarefa é declarada concluída sem confirmação real do Scheduler na VPS (Fase 7).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-xl bg-teal-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-teal-400 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Novo agendamento (Demo)</span>
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 rounded-2xl border border-zinc-800 bg-[#0D1117] p-4 sm:grid-cols-4"
        >
          <div className="sm:col-span-2">
            <label className="block text-xs text-zinc-400">Nome da rotina</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Resumo de mensagens importantes"
              className="mt-1.5 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400">Frequência</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
              className="mt-1.5 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 focus:border-teal-500 focus:outline-none"
            >
              <option value="Diário">Diário</option>
              <option value="Semanal">Semanal</option>
              <option value="Horário específico">Horário específico</option>
              <option value="Sob demanda">Sob demanda</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400">Horário</label>
            <input
              type="text"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="mt-1.5 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs text-zinc-100 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between gap-3 sm:col-span-4">
            <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={requiresConfirmation}
                onChange={(e) => setRequiresConfirmation(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-teal-500"
              />
              <span>Exigir confirmação antes de ações sensíveis</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="min-h-[38px] rounded-lg px-3 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[38px] rounded-lg bg-sky-500 px-3.5 text-xs font-semibold text-zinc-950 hover:bg-sky-400"
              >
                Salvar exemplo local
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {tasks.map((task) => (
          <article
            key={task.id}
            className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-4 sm:p-5"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <CalendarClock className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
                  <h2 className="truncate text-sm font-semibold text-zinc-100">{task.name}</h2>
                </div>
                <p className="mt-1.5 text-xs text-zinc-400">
                  {task.frequency} · <span className="font-mono tabular-nums">{task.scheduleTime}</span> ·{' '}
                  {task.requiresConfirmation ? 'Requer confirmação humana' : 'Somente leitura/resumo'} ·{' '}
                  {task.targetPhase}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className={`min-h-[40px] rounded-xl px-3.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    task.enabled
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {task.enabled ? 'Ativo (Demo)' : 'Pausado'}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveTask(task.id)}
                  aria-label={`Remover agendamento ${task.name}`}
                  className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-3.5 grid gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-xs sm:grid-cols-4">
              <div>
                <span className="text-zinc-500">ID execução</span>
                <p className="mt-0.5 font-mono text-zinc-300">{task.lastExecution.executionId}</p>
              </div>
              <div>
                <span className="text-zinc-500">Status real</span>
                <p className="mt-0.5 text-sky-400">Aguardando VPS</p>
              </div>
              <div>
                <span className="text-zinc-500">Tentativas</span>
                <p className="mt-0.5 font-mono tabular-nums text-zinc-300">
                  {task.lastExecution.attempts}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Observação</span>
                <p className="mt-0.5 text-zinc-400">{task.lastExecution.summary}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
