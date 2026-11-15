import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import {
  AssistantProfile,
  ConversationThread,
  PrimaryTab,
  RadarSignal,
  ScheduledTask,
} from '../../domain/models';

interface ConversationsViewProps {
  conversations: ConversationThread[];
  selectedConversation: ConversationThread | null;
  assistants: AssistantProfile[];
  scheduledTasks: ScheduledTask[];
  radarSignals: RadarSignal[];
  searchQuery: string;
  showArchived: boolean;
  composerDraft: string;
  composerFeedback: string | null;
  onSearchChange: (value: string) => void;
  onToggleArchivedFilter: (showArchived: boolean) => void;
  onSelectConversation: (id: string) => void;
  onClearSelectedConversationOnMobile: () => void;
  onArchiveConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onCreateThread: (subject: string, title: string, assistantId: string) => void;
  onComposerDraftChange: (value: string) => void;
  onSubmitDraft: () => void;
  onNavigateTab: (tab: PrimaryTab) => void;
}

export function ConversationsView({
  conversations,
  selectedConversation,
  assistants,
  scheduledTasks,
  radarSignals,
  searchQuery,
  showArchived,
  composerDraft,
  composerFeedback,
  onSearchChange,
  onToggleArchivedFilter,
  onSelectConversation,
  onClearSelectedConversationOnMobile,
  onArchiveConversation,
  onDeleteConversation,
  onCreateThread,
  onComposerDraftChange,
  onSubmitDraft,
  onNavigateTab,
}: ConversationsViewProps) {
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Geral');
  const [newAssistantId, setNewAssistantId] = useState<string>(assistants[0]?.id ?? 'gemeos');

  const activeSchedulesCount = scheduledTasks.filter((t) => t.enabled).length;
  const pendingRadar = radarSignals.filter((s) => !s.acknowledged);

  const handleOpenConversation = (id: string) => {
    onSelectConversation(id);
    setMobileDetailOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateThread(newSubject, newTitle, newAssistantId);
    setNewTitle('');
    setNewThreadOpen(false);
    setMobileDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Resumo inicial da tela principal */}
      <section aria-label="Visão geral do assistente" className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-100">Especialistas no Dario OS</h2>
            <span className="text-xs text-zinc-500">4 Agentes</span>
          </div>
          <div className="mt-3 space-y-2">
            {assistants.map((ast) => (
              <div
                key={ast.id}
                className="flex items-start justify-between gap-3 border-b border-zinc-800/60 pb-2 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">{ast.name}</p>
                  <p className="truncate text-xs text-zinc-400">{ast.role}</p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-teal-400">{ast.id}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-100">Tarefas e atividades</h2>
            <button
              type="button"
              onClick={() => onNavigateTab('agendados')}
              className="text-xs font-medium text-sky-400 hover:text-sky-300 focus-visible:outline-none focus-visible:underline"
            >
              Ver agendados
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-xs text-zinc-400">Agendadas (Demo)</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-zinc-100">
                {activeSchedulesCount}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="text-xs text-zinc-400">Execuções reais</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-zinc-400">0</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Atividades recentes registradas apenas localmente. O Worker 24h na VPS será ativado nas Fases 7 e 8.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-100">Destaques do Radar</h2>
            <button
              type="button"
              onClick={() => onNavigateTab('radar')}
              className="text-xs font-medium text-teal-400 hover:text-teal-300 focus-visible:outline-none focus-visible:underline"
            >
              Abrir Radar
            </button>
          </div>
          {pendingRadar.length === 0 ? (
            <p className="mt-3 text-xs text-zinc-400">Nenhum sinal pendente nos filtros atuais.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {pendingRadar.slice(0, 2).map((signal) => (
                <div
                  key={signal.id}
                  className="border-b border-zinc-800/60 pb-2.5 last:border-b-0 last:pb-0"
                >
                  <p className="truncate text-sm font-medium text-zinc-200">{signal.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Prioridade {signal.priority} · {signal.classification} · {signal.detectedAt}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Área principal de conversas isoladas */}
      <section
        aria-label="Módulo de conversas"
        className="grid min-h-[520px] overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#0D1117] lg:grid-cols-12"
      >
        {/* Lista de conversas */}
        <div
          className={`flex flex-col border-zinc-800/90 lg:col-span-5 lg:border-r ${
            mobileDetailOpen ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="border-b border-zinc-800/90 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-base font-semibold text-zinc-100">Conversas recentes</h1>
                <p className="text-xs text-zinc-400">
                  Contextos isolados · Dados demonstrativos (Fase 1)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewThreadOpen((v) => !v)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-teal-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Nova</span>
              </button>
            </div>

            {newThreadOpen && (
              <form
                onSubmit={handleCreateSubmit}
                className="mt-3 space-y-2.5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3"
              >
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Título da conversa (ex.: Revisão de contrato)"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Assunto"
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
                  />
                  <select
                    value={newAssistantId}
                    onChange={(e) => setNewAssistantId(e.target.value)}
                    aria-label="Selecionar assistente"
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs text-zinc-100 focus:border-teal-500 focus:outline-none"
                  >
                    {assistants.map((ast) => (
                      <option key={ast.id} value={ast.id}>
                        {ast.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewThreadOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-sky-400"
                  >
                    Criar localmente
                  </button>
                </div>
              </form>
            )}

            <div className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar por assunto ou conteúdo..."
                  className="min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-9 pr-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-1 rounded-lg bg-zinc-950 p-1">
              <button
                type="button"
                onClick={() => onToggleArchivedFilter(false)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  !showArchived
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Ativas
              </button>
              <button
                type="button"
                onClick={() => onToggleArchivedFilter(true)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  showArchived
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Arquivadas
              </button>
            </div>
          </div>

          <div className="flex-1 divide-y divide-zinc-800/70 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-zinc-300">Nenhuma conversa encontrada.</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Ajuste a busca ou crie uma nova conversa demonstrativa local.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id;
                const lastMessage = conv.messages[conv.messages.length - 1];
                return (
                  <div
                    key={conv.id}
                    className={`flex items-start justify-between gap-2 p-4 transition-colors ${
                      isSelected ? 'bg-zinc-800/55' : 'hover:bg-zinc-900/60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenConversation(conv.id)}
                      className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-zinc-100">{conv.title}</p>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-500">
                          {conv.updatedAt}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-400">
                        {lastMessage?.content ?? 'Sem mensagens'}
                      </p>
                      <p className="mt-1.5 text-[11px] text-zinc-500">
                        {conv.subject} · Contexto {conv.isolatedContextKey}
                        {conv.unreadCount > 0 ? ` · ${conv.unreadCount} nova` : ''}
                      </p>
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onArchiveConversation(conv.id)}
                        title={conv.archived ? 'Desarquivar conversa' : 'Arquivar conversa'}
                        aria-label={conv.archived ? 'Desarquivar conversa' : 'Arquivar conversa'}
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        {conv.archived ? (
                          <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Archive className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteConversation(conv.id)}
                        title="Excluir conversa"
                        aria-label="Excluir conversa"
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detalhe da conversa */}
        <div
          className={`flex flex-col lg:col-span-7 ${
            mobileDetailOpen ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {selectedConversation ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800/90 px-4 py-3.5 sm:px-5">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDetailOpen(false);
                      onClearSelectedConversationOnMobile();
                    }}
                    className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 lg:hidden"
                    aria-label="Voltar para lista de conversas"
                  >
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-zinc-100">
                      {selectedConversation.title}
                    </h2>
                    <p className="truncate text-xs text-zinc-400">
                      Assunto: {selectedConversation.subject} · Chave isolada:{' '}
                      <span className="font-mono text-zinc-300">
                        {selectedConversation.isolatedContextKey}
                      </span>
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-zinc-500">Demonstração Fase 1</span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                {selectedConversation.messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isSystem = msg.sender === 'system_notice';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%] ${
                          isUser
                            ? 'bg-teal-500/15 text-zinc-100 border border-teal-500/30'
                            : isSystem
                              ? 'bg-zinc-900/90 text-zinc-300 border border-zinc-800'
                              : 'bg-zinc-900 text-zinc-200 border border-zinc-800/90'
                        }`}
                      >
                        <p>{msg.content}</p>
                        {msg.attachmentLabel && (
                          <p className="mt-2 font-mono text-xs text-sky-400">
                            {msg.attachmentLabel}
                          </p>
                        )}
                      </div>
                      <span className="mt-1 px-1 text-[11px] text-zinc-500">
                        {isUser ? 'Você' : isSystem ? 'Sistema Fase 1' : 'Assistente (Demo)'}
                        {msg.classification ? ` · ${msg.classification}` : ''} · {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-zinc-800/90 bg-zinc-950/60 p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSubmitDraft();
                  }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    rows={2}
                    value={composerDraft}
                    onChange={(e) => onComposerDraftChange(e.target.value)}
                    placeholder="Escreva um rascunho local (Model Router e streaming entram na Fase 2)..."
                    className="min-h-[48px] flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!composerDraft.trim()}
                    className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-teal-500 px-4 text-zinc-950 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                    aria-label="Registrar mensagem local"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>
                <p className="mt-2 text-xs text-zinc-500">
                  {composerFeedback ??
                    'Fase 1: anexos, áudio e respostas por IA não são simulados aqui; exigem backend VPS na Fase 2.'}
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div>
                <p className="text-sm font-medium text-zinc-300">Selecione uma conversa</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Cada conversa mantém identificador e contexto isolados.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
