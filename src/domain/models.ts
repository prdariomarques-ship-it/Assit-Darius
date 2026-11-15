export type PrimaryTab =
  | 'conversas'
  | 'artefatos'
  | 'agendados'
  | 'radar'
  | 'conectores';

export type ImplementationPhase =
  | 'Fase 1 · Saneamento'
  | 'Fase 2 · PWA'
  | 'Fase 3 · API & Harness'
  | 'Fase 3 · Document Intelligence'
  | 'Fase 4 · Quatro Agentes'
  | 'Fase 4 · WhatsApp Intelligence'
  | 'Fase 5 · Intelligence Engine'
  | 'Fase 7 · Radar & Agendamentos';

export type EpistemicClassification = 'fato' | 'inferencia' | 'sugestao';

export type ConnectionState =
  | 'disconnected_demo'
  | 'checking'
  | 'unreachable'
  | 'configured_unverified';

export type DarioAgentId = 'gemeos' | 'azusa' | 'croma' | 'b2b';

export interface AssistantProfile {
  id: DarioAgentId;
  name: string;
  deviceTarget: string;
  role: string;
  domainScope: string;
  description: string;
  recommendedTier: 'small' | 'intermediate' | 'advanced';
  developmentPriority: number;
  isolationPolicy: string;
  targetPhase: ImplementationPhase;
  isDemo: true;
}

export interface InstanceIdentityConfig {
  instance_id: string;
  agent_id: DarioAgentId;
  device_label: string;
  setup_completed: boolean;
  bound_whatsapp_number: string;
  bound_gmail_account: string;
  bound_outlook_account: string;
}

export interface ConversationMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system_notice';
  content: string;
  timestamp: string;
  classification?: EpistemicClassification;
  attachmentLabel?: string;
}

export interface ConversationThread {
  id: string;
  title: string;
  subject: string;
  assistantId: string;
  updatedAt: string;
  unreadCount: number;
  archived: boolean;
  isolatedContextKey: string;
  messages: ConversationMessage[];
  isDemo: true;
}

export type ArtifactFormat = 'PDF' | 'DOCX' | 'XML' | 'XLSX' | 'AUDIO' | 'IMAGEM';

export interface ArtifactItem {
  id: string;
  title: string;
  format: ArtifactFormat;
  source: string;
  processedAt: string;
  confidence: number;
  extractedPreview: string;
  errorsFound: string | null;
  targetPhase: ImplementationPhase;
  isDemo: true;
}

export type ScheduleFrequency = 'Diário' | 'Semanal' | 'Horário específico' | 'Sob demanda';

export interface ScheduledExecutionLog {
  executionId: string;
  executedAt: string;
  status: 'confirmado_demo' | 'pendente_vps' | 'erro_simulado_nao_usado';
  attempts: number;
  summary: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  frequency: ScheduleFrequency;
  scheduleTime: string;
  enabled: boolean;
  requiresConfirmation: boolean;
  lastExecution: ScheduledExecutionLog;
  targetPhase: ImplementationPhase;
  isDemo: true;
}

export type RadarPriority = 'alta' | 'media' | 'baixa';

export type RadarCategory =
  | 'emails_sem_resposta'
  | 'compromissos'
  | 'documentos_pendentes'
  | 'tarefas_atrasadas'
  | 'conversas_relevantes';

export interface RadarSignal {
  id: string;
  title: string;
  summary: string;
  category: RadarCategory;
  priority: RadarPriority;
  classification: EpistemicClassification;
  origin: string;
  detectedAt: string;
  acknowledged: boolean;
  isDemo: true;
}

export interface RadarMonitoringPreferences {
  emails_sem_resposta: boolean;
  compromissos: boolean;
  documentos_pendentes: boolean;
  tarefas_atrasadas: boolean;
  conversas_relevantes: boolean;
}

export type ConnectorStatus =
  | 'nao_configurado'
  | 'requer_oauth_backend'
  | 'conector_central_dario_os'
  | 'integracao_futura';

export interface ConnectorDefinition {
  id: string;
  name: string;
  category: string;
  status: ConnectorStatus;
  statusLabel: string;
  targetPhase: ImplementationPhase;
  summary: string;
  permissionsRequired: string[];
  technicalConstraints: string[];
  securityBoundary: string;
}

export type WhatsAppProviderType =
  | 'linked_device_pairing_code'
  | 'whatsapp_cloud_api'
  | 'cloud_api_coexistence';

export type WhatsAppConnectionStatus =
  | 'disconnected'
  | 'awaiting_pairing_code'
  | 'connected'
  | 'reconnecting'
  | 'degraded_error';

export type WhatsAppReconnectionStatus =
  | 'idle'
  | 'backoff_scheduled'
  | 'attempting_handshake'
  | 'requires_manual_relink';

export interface WhatsAppConnectionRecord {
  connection_id: string;
  instance_id: string;
  agent_id: DarioAgentId;
  phone_number: string;
  provider: WhatsAppProviderType;
  connection_status: WhatsAppConnectionStatus;
  session_reference: string;
  last_connected_at: string | null;
  last_event_at: string | null;
  last_error: string | null;
  reconnection_status: WhatsAppReconnectionStatus;
  default_agent_id: DarioAgentId;
  isDemo: boolean;
}

export interface WhatsAppRoutingRule {
  rule_id: string;
  agent_id: DarioAgentId;
  agent_name: string;
  device_target: string;
  scope_summary: string;
  match_criteria: string[];
  privacy_boundary: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  read: boolean;
  targetTab: PrimaryTab;
  isDemo: true;
}

export type ModelProviderOption =
  | 'gemma_local'
  | 'nemotron'
  | 'qwen_harness'
  | 'llama_harness'
  | 'gemini'
  | 'ollama'
  | 'openai'
  | 'anthropic';

export interface AppSettingsState {
  instanceId: string;
  primaryAgentId: DarioAgentId;
  deviceLabel: string;
  instanceSetupCompleted: boolean;
  userName: string;
  vpsBaseUrl: string;
  wsEndpointUrl: string;
  requestTimeoutMs: number;
  preferredProvider: ModelProviderOption;
  secondaryModel: ModelProviderOption;
  localAndroidInferenceEnabled: boolean;
  boundWhatsAppNumber: string;
  boundGmailAccount: string;
  boundOutlookAccount: string;
  preferredWritingStyle: 'profissional' | 'pessoal' | 'informal' | 'tecnico';
  requireConfirmationForSensitiveActions: boolean;
}
