import { useState } from 'react';
import {
  Activity,
  ArrowRight,
  KeyRound,
  PlugZap,
  PowerOff,
  RefreshCw,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import {
  HttpDarioApiClient,
  WhatsAppPairingResult,
} from '../../data/apiClient';
import {
  DEMO_WHATSAPP_CONNECTIONS,
  WHATSAPP_AGENT_ROUTING_RULES,
} from '../../data/demoRepository';
import {
  ConnectorDefinition,
  DarioAgentId,
  WhatsAppConnectionRecord,
  WhatsAppProviderType,
} from '../../domain/models';

interface ConnectorsViewProps {
  connectors: ConnectorDefinition[];
  selectedConnector: ConnectorDefinition | null;
  vpsBaseUrl: string;
  requestTimeoutMs: number;
  onSelectConnector: (id: string) => void;
  onOpenSettings: () => void;
}

const PIPELINE_STEPS = [
  '1. WhatsApp Connector',
  '2. Event Normalization',
  '3. Message Classification',
  '4. Audio Transcription / OCR',
  '5. Context Resolution',
  '6. Memory Engine',
  '7. Agent Routing (Azusa · B2B · Gêmeos · Croma)',
  '8. Response or Task Suggestion',
];

export function ConnectorsView({
  connectors,
  selectedConnector,
  vpsBaseUrl,
  requestTimeoutMs,
  onSelectConnector,
  onOpenSettings,
}: ConnectorsViewProps) {
  const [phoneInput, setPhoneInput] = useState('');
  const [providerInput, setProviderInput] = useState<WhatsAppProviderType>(
    'linked_device_pairing_code'
  );
  const [defaultAgentInput, setDefaultAgentInput] = useState<DarioAgentId>('gemeos');
  const [requestingCode, setRequestingCode] = useState(false);

  // Estado estritamente efêmero em memória — nunca salvo no IndexedDB, localStorage ou console.log
  const [pairingResult, setPairingResult] = useState<WhatsAppPairingResult | null>(null);

  const [connections, setConnections] = useState<WhatsAppConnectionRecord[]>(
    DEMO_WHATSAPP_CONNECTIONS
  );
  const [sessionStatusNote, setSessionStatusNote] = useState<string | null>(null);
  const [syncingSessions, setSyncingSessions] = useState(false);

  const isWhatsAppSelected = selectedConnector?.id === 'conn-whatsapp';

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestingCode(true);
    setPairingResult(null);

    try {
      const client = new HttpDarioApiClient(vpsBaseUrl);
      const res = await client.requestWhatsAppPairingCode(
        {
          phone_number: phoneInput,
          provider: providerInput,
          default_agent_id: defaultAgentInput,
        },
        requestTimeoutMs
      );
      setPairingResult(res);
    } finally {
      setRequestingCode(false);
    }
  };

  const handleSyncSessions = async () => {
    setSyncingSessions(true);
    setSessionStatusNote(null);
    try {
      const client = new HttpDarioApiClient(vpsBaseUrl);
      const res = await client.fetchWhatsAppConnections(requestTimeoutMs);
      if (res.ok && res.connections.length > 0) {
        setConnections(res.connections);
      }
      setSessionStatusNote(res.message);
    } finally {
      setSyncingSessions(false);
    }
  };

  const handleSessionAction = (
    connectionId: string,
    action: 'reconnect' | 'disconnect' | 'activity'
  ) => {
    if (!vpsBaseUrl.trim()) {
      setSessionStatusNote(
        `Ação '${action}' na sessão ${connectionId} requer o endpoint do Dario OS configurado em Configurações.`
      );
      return;
    }

    if (action === 'disconnect') {
      setConnections((prev) =>
        prev.map((c) =>
          c.connection_id === connectionId
            ? {
                ...c,
                connection_status: 'disconnected',
                reconnection_status: 'idle',
                last_error: 'Desconectado manualmente pelo proprietário via Dario Assistant.',
              }
            : c
        )
      );
      setSessionStatusNote(`Solicitação de desconexão enviada para ${connectionId}.`);
    } else if (action === 'reconnect') {
      setConnections((prev) =>
        prev.map((c) =>
          c.connection_id === connectionId
            ? {
                ...c,
                connection_status: 'reconnecting',
                reconnection_status: 'attempting_handshake',
              }
            : c
        )
      );
      setSessionStatusNote(`Solicitação de reconexão enviada ao Dario OS para ${connectionId}.`);
    } else {
      setSessionStatusNote(
        `Consultando telemetria de eventos da sessão ${connectionId} no Intelligence Engine...`
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800/90 pb-4">
        <h1 className="text-lg font-semibold text-zinc-100">
          Conectores Centralizados no Dario OS
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          O Dario Assistant funciona como interface única de controle. Todas as sessões, tokens e o pipeline do Intelligence Engine rodam centralizados no Dario OS.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Lista lateral de conectores */}
        <div className="space-y-3 lg:col-span-4">
          {connectors.map((conn) => {
            const active = selectedConnector?.id === conn.id;
            return (
              <button
                key={conn.id}
                type="button"
                onClick={() => onSelectConnector(conn.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                  active
                    ? 'border-teal-500/60 bg-zinc-900/90'
                    : 'border-zinc-800/90 bg-[#0D1117] hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <PlugZap className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
                    <h2 className="text-sm font-semibold text-zinc-100">{conn.name}</h2>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-sky-400">{conn.statusLabel}</p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">{conn.summary}</p>
                <p className="mt-2.5 text-[11px] text-zinc-500">
                  {conn.category} · {conn.targetPhase}
                </p>
              </button>
            );
          })}
        </div>

        {/* Painel principal do conector selecionado */}
        <div className="space-y-5 lg:col-span-8">
          {isWhatsAppSelected && selectedConnector ? (
            <>
              {/* Painel 1: Pareamento por Código estilo Zapia */}
              <section className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-5">
                <div className="flex flex-col justify-between gap-3 border-b border-zinc-800/80 pb-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs text-teal-400">
                      Referência Funcional Zapia · Pareamento por Código de 8 Caracteres
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-zinc-100">
                      Conectar Número ao WhatsApp Connector do Dario OS
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="min-h-[38px] self-start rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 hover:border-zinc-600 whitespace-nowrap"
                  >
                    {vpsBaseUrl.trim() ? 'VPS Configurada' : 'Configurar URL Dario OS'}
                  </button>
                </div>

                <form
                  onSubmit={handleRequestPairingCode}
                  className="mt-4 grid gap-3.5 sm:grid-cols-3"
                >
                  <div>
                    <label
                      htmlFor="wa-phone-input"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Número do WhatsApp (com DDI + DDD)
                    </label>
                    <input
                      id="wa-phone-input"
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="Ex.: 5511999999999"
                      className="mt-1.5 min-h-[42px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="wa-provider-select"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Método de Conexão no Dario OS
                    </label>
                    <select
                      id="wa-provider-select"
                      value={providerInput}
                      onChange={(e) =>
                        setProviderInput(e.target.value as WhatsAppProviderType)
                      }
                      className="mt-1.5 min-h-[42px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 focus:border-teal-500 focus:outline-none"
                    >
                      <option value="linked_device_pairing_code">
                        A · Código de Pareamento (Dispositivo Conectado)
                      </option>
                      <option value="cloud_api_coexistence">
                        C · Coexistência (WhatsApp Business App + Cloud API)
                      </option>
                      <option value="whatsapp_cloud_api">
                        B · WhatsApp Business Cloud API Oficial
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="wa-agent-select"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Roteamento Padrão da Instância
                    </label>
                    <select
                      id="wa-agent-select"
                      value={defaultAgentInput}
                      onChange={(e) =>
                        setDefaultAgentInput(e.target.value as DarioAgentId)
                      }
                      className="mt-1.5 min-h-[42px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-100 focus:border-teal-500 focus:outline-none"
                    >
                      <option value="gemeos">Gêmeos (Contexto Pessoal / Geral)</option>
                      <option value="croma">Croma (MarquesColor Vendas / Pós-venda)</option>
                      <option value="b2b">B2B (Comercial / Propostas)</option>
                      <option value="azusa">Azusa (Comunidade / Grupos / Eventos)</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 sm:col-span-3">
                    <p className="text-xs text-zinc-400">
                      O código é efêmero, nunca é salvo como credencial permanente e nunca vai para logs.
                    </p>
                    <button
                      type="submit"
                      disabled={requestingCode}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-teal-500 px-4 text-xs font-semibold text-zinc-950 transition-colors hover:bg-teal-400 disabled:opacity-60 whitespace-nowrap"
                    >
                      <KeyRound className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {requestingCode
                          ? 'Solicitando ao Dario OS...'
                          : 'Solicitar Código de Pareamento'}
                      </span>
                    </button>
                  </div>
                </form>

                {pairingResult && (
                  <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-200">
                        Resposta do Dario OS ·{' '}
                        <span className="font-mono tabular-nums text-zinc-400">
                          {pairingResult.requested_at}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPairingResult(null)}
                        className="text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Limpar da tela
                      </button>
                    </div>

                    {pairingResult.ok && pairingResult.ephemeral_pairing_code ? (
                      <div className="mt-3">
                        <p className="text-xs text-teal-400">
                          Código temporário de pareamento (expira em{' '}
                          {pairingResult.expires_in_seconds ?? 120}s):
                        </p>
                        <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-zinc-100">
                          {pairingResult.ephemeral_pairing_code}
                        </p>
                      </div>
                    ) : null}

                    <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                      {pairingResult.message}
                    </p>
                  </div>
                )}

                {/* Instruções de conexão pelo celular */}
                <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <Smartphone className="h-4 w-4 text-sky-400" aria-hidden="true" />
                    <span>Instruções para conectar pelo celular (Fluxo Zapia)</span>
                  </div>
                  <ol className="mt-2.5 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
                    <li>1. Abra o WhatsApp Business (ou WhatsApp) no seu celular.</li>
                    <li>2. Acesse Mais opções (⋮) ou Configurações → Dispositivos conectados.</li>
                    <li>3. Toque em Conectar dispositivo → Conectar com número de telefone.</li>
                    <li>4. Digite o código de 8 caracteres exibido aqui para autenticar a sessão no Dario OS.</li>
                  </ol>
                </div>
              </section>

              {/* Painel 2: Sessões e Segurança no Dario OS (Seção 7) */}
              <section className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-5">
                <div className="flex flex-col justify-between gap-3 border-b border-zinc-800/80 pb-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                      Sessões Registradas no WhatsApp Connector (Seção 7)
                    </h2>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Isolamento por <span className="font-mono text-zinc-300">connection_id</span>, referência de cofre criptografado e controle de reconexão.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncSessions}
                    disabled={syncingSessions}
                    className="inline-flex min-h-[38px] items-center gap-1.5 self-start rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 hover:border-zinc-600 whitespace-nowrap"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 text-teal-400 ${syncingSessions ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                    <span>Sincronizar com Dario OS</span>
                  </button>
                </div>

                {sessionStatusNote && (
                  <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2.5 text-xs text-sky-300">
                    {sessionStatusNote}
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {connections.map((conn) => (
                    <div
                      key={conn.connection_id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-zinc-100">
                              {conn.phone_number}
                            </span>
                            <span className="text-xs text-zinc-500">·</span>
                            <span className="font-mono text-xs text-teal-400">
                              {conn.connection_status}
                            </span>
                          </div>
                          <p className="mt-1 font-mono text-[11px] text-zinc-400">
                            connection_id: {conn.connection_id} · provider: {conn.provider} · agente:{' '}
                            {conn.default_agent_id.toUpperCase()}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSessionAction(conn.connection_id, 'activity')}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 hover:border-zinc-700"
                          >
                            <Activity className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                            <span>Atividade</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSessionAction(conn.connection_id, 'reconnect')}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 hover:border-zinc-700"
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
                            <span>Reconectar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSessionAction(conn.connection_id, 'disconnect')}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 hover:border-rose-500/50 hover:text-rose-300"
                          >
                            <PowerOff className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Desconectar</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-400 sm:grid-cols-3">
                        <div>
                          <span className="text-zinc-500">session_reference:</span>{' '}
                          <span className="font-mono text-zinc-300">{conn.session_reference}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">reconnection_status:</span>{' '}
                          <span className="font-mono text-zinc-300">{conn.reconnection_status}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">last_connected / event:</span>{' '}
                          <span className="font-mono text-zinc-300">
                            {conn.last_connected_at ?? 'nunca'} / {conn.last_event_at ?? 'nunca'}
                          </span>
                        </div>
                        <div className="sm:col-span-3">
                          <span className="text-zinc-500">last_error:</span>{' '}
                          <span className="text-zinc-300">{conn.last_error ?? 'Nenhum'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Painel 3: Intelligence Engine Pipeline & Distribuição entre os 4 Agentes */}
              <section className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-5">
                <h2 className="text-sm font-semibold text-zinc-100">
                  Pipeline Central do Intelligence Engine & Roteamento Multi-Agente
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Todas as mensagens passam por uma única estrutura no Dario OS antes de alimentar Azusa, B2B, Gêmeos ou Croma.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                  {PIPELINE_STEPS.map((step, idx) => (
                    <div key={step} className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono text-zinc-200">{step}</span>
                      {idx < PIPELINE_STEPS.length - 1 && (
                        <ArrowRight className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {WHATSAPP_AGENT_ROUTING_RULES.map((rule) => (
                    <div
                      key={rule.rule_id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5"
                    >
                      <p className="text-xs font-semibold text-teal-400">{rule.agent_name}</p>
                      <p className="mt-1 text-xs text-zinc-200">{rule.scope_summary}</p>
                      <p className="mt-2 text-[11px] text-zinc-400">
                        Critérios: {rule.match_criteria.join(' · ')}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        Isolamento: {rule.privacy_boundary}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : selectedConnector ? (
            <div className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-5">
              <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-4">
                <div>
                  <p className="text-xs text-sky-400">{selectedConnector.statusLabel}</p>
                  <h2 className="mt-1 text-base font-semibold text-zinc-100">
                    {selectedConnector.name}
                  </h2>
                </div>
                <span className="text-xs text-zinc-500">{selectedConnector.targetPhase}</span>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-200">Permissões e requisitos</h3>
                  <ul className="mt-2 space-y-1.5 text-xs text-zinc-400">
                    {selectedConnector.permissionsRequired.map((perm) => (
                      <li key={perm} className="flex items-start gap-2">
                        <span className="text-teal-400" aria-hidden="true">
                          •
                        </span>
                        <span>{perm}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-zinc-200">
                    Limitações técnicas e políticas
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-xs text-zinc-400">
                    {selectedConnector.technicalConstraints.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-sky-400" aria-hidden="true">
                          •
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
                    <ShieldAlert className="h-4 w-4 text-teal-400" aria-hidden="true" />
                    <span>Fronteira de segurança</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                    {selectedConnector.securityBoundary}
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="min-h-[42px] rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-xs font-medium text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
                  >
                    Configurar endpoint do Dario OS em Configurações
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
