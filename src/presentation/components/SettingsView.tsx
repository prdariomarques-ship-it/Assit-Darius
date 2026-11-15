import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  Lock,
  RotateCcw,
  Server,
  ShieldCheck,
  Sliders,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { ApiHealthResult } from '../../data/apiClient';
import { DEMO_ASSISTANTS } from '../../data/demoRepository';
import { ANDROID_ROOM_KOTLIN_SNIPPETS } from '../../data/local/androidRoomReference';
import { LocalDatabaseDiagnostics } from '../../data/local/localPersistenceRepository';
import {
  AGENT_DEFAULT_DEVICE_META,
  DataStoreDiagnostics,
} from '../../data/preferences/userPreferencesDataStore';
import {
  AppSettingsState,
  DarioAgentId,
  ModelProviderOption,
} from '../../domain/models';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  settings: AppSettingsState;
  lastHealthResult: ApiHealthResult | null;
  checkingConnection: boolean;
  dbDiagnostics: LocalDatabaseDiagnostics | null;
  dataStoreDiagnostics: DataStoreDiagnostics;
  onUpdateSettings: (patch: Partial<AppSettingsState>) => void;
  onReconfigureInstallation: (
    agentId: DarioAgentId,
    customInstanceId?: string,
    customDeviceLabel?: string
  ) => Promise<void>;
  onTestConnection: () => void;
  onResetDatabase: () => Promise<void>;
  onResetPreferences: () => Promise<void>;
  onClose: () => void;
}

const PROVIDER_OPTIONS: Array<{ id: ModelProviderOption; label: string; note: string }> = [
  { id: 'gemma_local', label: 'Gemma (Inferência Local Android)', note: 'Execução local no dispositivo / baixa latência' },
  { id: 'nemotron', label: 'NVIDIA Nemotron', note: 'Via Model Router no Dario OS' },
  { id: 'qwen_harness', label: 'Qwen (Harness Dario OS)', note: 'Aproveita Harness Qwen existente' },
  { id: 'llama_harness', label: 'Llama (Harness Dario OS)', note: 'Aproveita Harness Llama existente' },
  { id: 'gemini', label: 'Google Gemini', note: 'Via Model Router no servidor' },
  { id: 'ollama', label: 'Ollama', note: 'Instância própria na VPS' },
  { id: 'openai', label: 'OpenAI / Compatível', note: 'Via camada Model Router' },
  { id: 'anthropic', label: 'Anthropic Claude', note: 'Via camada Model Router' },
];

export function SettingsView({
  settings,
  lastHealthResult,
  checkingConnection,
  dbDiagnostics,
  dataStoreDiagnostics,
  onUpdateSettings,
  onReconfigureInstallation,
  onTestConnection,
  onResetDatabase,
  onResetPreferences,
  onClose,
}: SettingsViewProps) {
  const [selectedSnippetId, setSelectedSnippetId] = useState(
    ANDROID_ROOM_KOTLIN_SNIPPETS[0]?.id ?? 'jetpack-datastore'
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resettingDb, setResettingDb] = useState(false);
  const [resettingPrefs, setResettingPrefs] = useState(false);

  // Controles de autorização para reconfigurar o agente principal da instalação
  const [unlockReconfig, setUnlockReconfig] = useState(false);
  const [pendingAgentId, setPendingAgentId] = useState<DarioAgentId>(
    settings.primaryAgentId
  );
  const [pendingInstanceId, setPendingInstanceId] = useState(settings.instanceId);
  const [pendingDeviceLabel, setPendingDeviceLabel] = useState(settings.deviceLabel);
  const [reconfigStatus, setReconfigStatus] = useState<string | null>(null);

  const selectedSnippet =
    ANDROID_ROOM_KOTLIN_SNIPPETS.find((s) => s.id === selectedSnippetId) ??
    ANDROID_ROOM_KOTLIN_SNIPPETS[0];

  const handleCopySnippet = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleResetDb = async () => {
    setResettingDb(true);
    try {
      await onResetDatabase();
    } finally {
      setResettingDb(false);
    }
  };

  const handleResetPrefs = async () => {
    setResettingPrefs(true);
    try {
      await onResetPreferences();
    } finally {
      setResettingPrefs(false);
    }
  };

  const handleSelectPendingAgent = (agentId: DarioAgentId) => {
    const meta = AGENT_DEFAULT_DEVICE_META[agentId];
    setPendingAgentId(agentId);
    setPendingInstanceId(meta.instanceId);
    setPendingDeviceLabel(meta.deviceLabel);
  };

  const handleApplyInstanceReconfig = async () => {
    await onReconfigureInstallation(
      pendingAgentId,
      pendingInstanceId,
      pendingDeviceLabel
    );
    setUnlockReconfig(false);
    setReconfigStatus(
      `Instalação reconfigurada com isolamento físico para ${pendingAgentId.toUpperCase()} (${pendingInstanceId}).`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800/90 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-800 bg-[#0D1117] text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
            aria-label="Voltar ao aplicativo"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">
              Configurações da Instalação · Multiagente Isolado
            </h1>
            <p className="text-xs text-zinc-400">
              Identidade da instalação (`instance_id`), agente principal, modelos principal/secundário, contas e persistência.
            </p>
          </div>
        </div>
      </div>

      <PWAInstallButton variant="card" deviceLabel={settings.deviceLabel} />

      {/* Seção 1: Identidade da Instalação e Isolamento entre Aparelhos */}
      <section className="rounded-2xl border border-teal-500/30 bg-[#0D1117] p-5">
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-800/80 pb-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Identidade Operacional desta Instalação (Isolamento por Aparelho)
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Cada celular possui seu próprio <span className="font-mono text-zinc-300">instance_id</span>, agente principal, banco local IndexedDB/Room, sessão WhatsApp e contas de e-mail.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setUnlockReconfig((v) => !v);
              setReconfigStatus(null);
            }}
            className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 text-xs font-medium text-zinc-200 hover:border-zinc-600 whitespace-nowrap"
          >
            <Lock className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
            <span>
              {unlockReconfig
                ? 'Bloquear alteração de instância'
                : 'Autorizar troca de Agente / Instância'}
            </span>
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
            <p className="text-xs text-zinc-400">Agente Principal Ativo</p>
            <p className="mt-1 text-base font-semibold text-teal-400 uppercase">
              {settings.primaryAgentId}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-400">{settings.deviceLabel}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
            <p className="text-xs text-zinc-400">Identificador da Instalação (instance_id)</p>
            <p className="mt-1 truncate font-mono text-sm font-semibold text-zinc-100">
              {settings.instanceId}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Partição física de banco e memória</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
            <p className="text-xs text-zinc-400">Banco Local Ativo</p>
            <p className="mt-1 truncate font-mono text-xs font-semibold text-sky-400">
              {dbDiagnostics?.engine ?? 'Inicializando...'}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Zero compartilhamento automático com outras instâncias
            </p>
          </div>
        </div>

        {reconfigStatus && (
          <div className="mt-3 rounded-xl border border-teal-500/40 bg-teal-500/10 px-3.5 py-2.5 text-xs text-teal-200">
            {reconfigStatus}
          </div>
        )}

        {unlockReconfig && (
          <div className="mt-4 space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs font-medium text-zinc-200">
              Selecione o Agente Principal para configurar esta instalação (Celular Pessoal, Igreja, Loja ou Comercial):
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {DEMO_ASSISTANTS.map((agent) => {
                const active = pendingAgentId === agent.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => handleSelectPendingAgent(agent.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? 'border-teal-500 bg-teal-500/15'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-100">{agent.name}</span>
                      <span className="font-mono text-[10px] text-teal-400">
                        P#{agent.developmentPriority}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-sky-400">{agent.deviceTarget}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">{agent.role}</p>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-zinc-400">
                  instance_id dedicado desta instalação
                </label>
                <input
                  type="text"
                  value={pendingInstanceId}
                  onChange={(e) => setPendingInstanceId(e.target.value)}
                  className="mt-1 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 font-mono text-xs text-zinc-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400">
                  Identificação do Aparelho
                </label>
                <input
                  type="text"
                  value={pendingDeviceLabel}
                  onChange={(e) => setPendingDeviceLabel(e.target.value)}
                  className="mt-1 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUnlockReconfig(false)}
                className="min-h-[38px] rounded-lg px-3 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyInstanceReconfig}
                className="min-h-[38px] rounded-xl bg-teal-500 px-4 text-xs font-semibold text-zinc-950 hover:bg-teal-400"
              >
                Confirmar e Isolar Banco Local da Instância
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Seção 2: Modelos Principal e Secundário Independentes da Memória */}
      <section className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-5">
        <div className="flex items-start gap-2.5 border-b border-zinc-800/80 pb-4">
          <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Modelos de IA da Instância (Gemma · Nemotron · Qwen · Gemini)
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Cada instalação define seu Modelo Principal e seu Modelo Secundário. A memória e a identidade do agente permanecem 100% independentes dos modelos.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="primary-model-select" className="block text-xs font-medium text-zinc-300">
              Modelo Principal da Instância (Raciocínio, CRM Pessoal e Conversação)
            </label>
            <select
              id="primary-model-select"
              value={settings.preferredProvider}
              onChange={(e) =>
                onUpdateSettings({
                  preferredProvider: e.target.value as ModelProviderOption,
                })
              }
              className="mt-1.5 min-h-[42px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 text-xs text-zinc-100 focus:border-teal-500 focus:outline-none"
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} — {opt.note}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="secondary-model-select" className="block text-xs font-medium text-zinc-300">
              Modelo Secundário / Triagem Rápida e Fallback
            </label>
            <select
              id="secondary-model-select"
              value={settings.secondaryModel}
              onChange={(e) =>
                onUpdateSettings({
                  secondaryModel: e.target.value as ModelProviderOption,
                })
              }
              className="mt-1.5 min-h-[42px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 text-xs text-zinc-100 focus:border-teal-500 focus:outline-none"
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} — {opt.note}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="mt-4 flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5">
          <span className="text-xs text-zinc-200">
            Habilitar inferência local no Android (Gemma on-device) para classificação rápida e operação offline
          </span>
          <input
            type="checkbox"
            checked={settings.localAndroidInferenceEnabled}
            onChange={(e) =>
              onUpdateSettings({ localAndroidInferenceEnabled: e.target.checked })
            }
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-teal-500"
          />
        </label>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contas próprias da instalação */}
        <section className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-5">
          <h2 className="text-sm font-semibold text-zinc-100">
            Contas Próprias desta Instalação ({settings.primaryAgentId.toUpperCase()})
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Vinculadas exclusivamente ao <span className="font-mono text-zinc-300">{settings.instanceId}</span>.
          </p>
          <div className="mt-4 space-y-3.5">
            <div>
              <label htmlFor="user-name" className="block text-xs text-zinc-400">
                Nome do Usuário / Operador
              </label>
              <input
                id="user-name"
                type="text"
                value={settings.userName}
                onChange={(e) => onUpdateSettings({ userName: e.target.value })}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 text-xs text-zinc-100 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="bound-wa" className="block text-xs text-zinc-400">
                Número WhatsApp desta Instalação
              </label>
              <input
                id="bound-wa"
                type="tel"
                value={settings.boundWhatsAppNumber}
                onChange={(e) => onUpdateSettings({ boundWhatsAppNumber: e.target.value })}
                placeholder="Ex.: +55 11 99999-9999"
                className="mt-1 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="bound-gmail" className="block text-xs text-zinc-400">
                  Conta Gmail da Instância
                </label>
                <input
                  id="bound-gmail"
                  type="email"
                  value={settings.boundGmailAccount}
                  onChange={(e) => onUpdateSettings({ boundGmailAccount: e.target.value })}
                  placeholder="usuario@gmail.com"
                  className="mt-1 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="bound-outlook" className="block text-xs text-zinc-400">
                  Conta Outlook da Instância
                </label>
                <input
                  id="bound-outlook"
                  type="email"
                  value={settings.boundOutlookAccount}
                  onChange={(e) => onUpdateSettings({ boundOutlookAccount: e.target.value })}
                  placeholder="usuario@outlook.com"
                  className="mt-1 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="writing-style" className="block text-xs text-zinc-400">
                Estilo de escrita padrão (Learning Engine)
              </label>
              <select
                id="writing-style"
                value={settings.preferredWritingStyle}
                onChange={(e) =>
                  onUpdateSettings({
                    preferredWritingStyle: e.target.value as AppSettingsState['preferredWritingStyle'],
                  })
                }
                className="mt-1 min-h-[40px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 text-xs text-zinc-100 focus:border-teal-500 focus:outline-none"
              >
                <option value="profissional">Profissional</option>
                <option value="pessoal">Pessoal</option>
                <option value="informal">Informal</option>
                <option value="tecnico">Técnico</option>
              </select>
            </div>

            <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5">
              <span className="text-xs text-zinc-200">
                Exigir confirmação humana antes de enviar mensagens ou ações críticas
              </span>
              <input
                type="checkbox"
                checked={settings.requireConfirmationForSensitiveActions}
                onChange={(e) =>
                  onUpdateSettings({ requireConfirmationForSensitiveActions: e.target.checked })
                }
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-teal-500"
              />
            </label>
          </div>
        </section>

        {/* Comunicação VPS */}
        <section className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-5">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-teal-400" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Sincronização Dario OS (Isolada por instance_id)
            </h2>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Quando conectado ao Dario OS, todas as chamadas enviam o cabeçalho de isolamento da instância (<span className="font-mono">{settings.instanceId}</span>).
          </p>

          <div className="mt-4 space-y-3.5">
            <div>
              <label htmlFor="vps-url" className="block text-xs text-zinc-400">
                URL Base REST do Dario OS
              </label>
              <input
                id="vps-url"
                type="url"
                value={settings.vpsBaseUrl}
                onChange={(e) => onUpdateSettings({ vpsBaseUrl: e.target.value })}
                placeholder="Não configurado"
                className="mt-1.5 min-h-[42px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ws-url" className="block text-xs text-zinc-400">
                  Endpoint WebSocket
                </label>
                <input
                  id="ws-url"
                  type="text"
                  value={settings.wsEndpointUrl}
                  onChange={(e) => onUpdateSettings({ wsEndpointUrl: e.target.value })}
                  placeholder="wss://..."
                  className="mt-1.5 min-h-[42px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="timeout-ms" className="block text-xs text-zinc-400">
                  Timeout (ms)
                </label>
                <input
                  id="timeout-ms"
                  type="number"
                  min={1000}
                  max={30000}
                  step={500}
                  value={settings.requestTimeoutMs}
                  onChange={(e) =>
                    onUpdateSettings({ requestTimeoutMs: Number(e.target.value) || 4000 })
                  }
                  className="mt-1.5 min-h-[42px] w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 font-mono text-xs tabular-nums text-zinc-100 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onTestConnection}
                disabled={checkingConnection}
                className="min-h-[42px] rounded-xl bg-teal-500 px-4 text-xs font-semibold text-zinc-950 transition-colors hover:bg-teal-400 disabled:opacity-60"
              >
                {checkingConnection ? 'Testando /health...' : 'Testar endpoint /health'}
              </button>
            </div>

            {lastHealthResult && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-xs">
                <div className="flex items-center gap-2 font-medium text-zinc-200">
                  {lastHealthResult.reachable ? (
                    <CheckCircle2 className="h-4 w-4 text-teal-400" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                  )}
                  <span>
                    {lastHealthResult.reachable ? 'Conexão alcançada' : 'Sem conexão ativa'} ·{' '}
                    <span className="font-mono tabular-nums text-zinc-400">
                      {lastHealthResult.checkedAt}
                    </span>
                  </span>
                </div>
                <p className="mt-1.5 text-zinc-400">{lastHealthResult.message}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Seção de Banco de Dados Local (Room / IndexedDB) */}
      <section className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-5">
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-800/80 pb-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5">
            <Database className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Banco Local da Instância ({dbDiagnostics?.engine ?? 'IndexedDB'})
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Particionado por <span className="font-mono text-zinc-300">instance_id</span>. Conversas, artefatos, agendamentos, sinais do Radar e notificações desta instalação.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleResetPrefs}
              disabled={resettingPrefs}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 hover:border-zinc-600 whitespace-nowrap"
            >
              <Sliders className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
              <span>{resettingPrefs ? 'Restaurando...' : 'Resetar Preferências'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetDb}
              disabled={resettingDb}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 hover:border-zinc-600 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
              <span>{resettingDb ? 'Restaurando...' : 'Resetar Banco da Instância'}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
            <p className="text-xs text-zinc-400">conversations</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-zinc-100">
              {dbDiagnostics?.conversationsCount ?? 0}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">ConversationEntity</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
            <p className="text-xs text-zinc-400">messages</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-teal-400">
              {dbDiagnostics?.messagesCount ?? 0}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">MessageEntity</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
            <p className="text-xs text-zinc-400">artifacts</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-sky-400">
              {dbDiagnostics?.artifactsCount ?? 0}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">ArtifactEntity</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
            <p className="text-xs text-zinc-400">scheduled_tasks</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-zinc-100">
              {dbDiagnostics?.scheduledTasksCount ?? 0}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">ScheduledTaskEntity</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
            <p className="text-xs text-zinc-400">radar_signals</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-teal-400">
              {dbDiagnostics?.radarSignalsCount ?? 0}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">RadarSignalEntity</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
            <p className="text-xs text-zinc-400">notifications</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-sky-400">
              {dbDiagnostics?.notificationsCount ?? 0}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              Schema v{dbDiagnostics?.schemaVersion ?? 2} · rev #{dataStoreDiagnostics.revision}
            </p>
          </div>
        </div>
      </section>

      {/* Código-fonte Kotlin DataStore + Room para Android Studio */}
      <section className="rounded-2xl border border-zinc-800/90 bg-[#0D1117] p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-400" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Referência Kotlin (DataStore + Room + Hilt)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {ANDROID_ROOM_KOTLIN_SNIPPETS.map((snippet) => {
              const active = snippet.id === selectedSnippet.id;
              return (
                <button
                  key={snippet.id}
                  type="button"
                  onClick={() => setSelectedSnippetId(snippet.id)}
                  className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-teal-500 text-zinc-950'
                      : 'border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {snippet.layer}
                </button>
              );
            })}
          </div>
        </div>

        {selectedSnippet && (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-4 py-2.5">
              <div>
                <p className="font-mono text-xs text-zinc-200">{selectedSnippet.filename}</p>
                <p className="text-[11px] text-zinc-500">{selectedSnippet.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopySnippet(selectedSnippet.id, selectedSnippet.code)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 whitespace-nowrap"
              >
                {copiedId === selectedSnippet.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copiar Kotlin</span>
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-60 overflow-x-auto overflow-y-auto p-4 font-mono text-xs leading-relaxed text-zinc-300">
              <code>{selectedSnippet.code}</code>
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
