import { ApiHealthResult } from '../apiClient';
import { DEFAULT_INSTANCE_ID } from '../local/daos';
import {
  AppSettingsState,
  ConnectionState,
  DarioAgentId,
  ModelProviderOption,
  RadarMonitoringPreferences,
  RadarPriority,
} from '../../domain/models';

const DATASTORE_FILE_NAME = 'dario_user_preferences.preferences_pb';
const DATASTORE_STORAGE_KEY = 'dario_jetpack_datastore_preferences_pb_v1';

/**
 * Typed Preferences.Key equivalents mirroring androidx.datastore.preferences.core.*
 */
export const PreferencesKeys = {
  INSTANCE_ID: 'pref_str_instance_id',
  PRIMARY_AGENT_ID: 'pref_str_primary_agent_id',
  DEVICE_LABEL: 'pref_str_device_label',
  INSTANCE_SETUP_COMPLETED: 'pref_bool_instance_setup_completed',

  USER_NAME: 'pref_str_user_name',
  VPS_BASE_URL: 'pref_str_vps_base_url',
  WS_ENDPOINT_URL: 'pref_str_ws_endpoint_url',
  REQUEST_TIMEOUT_MS: 'pref_int_request_timeout_ms',
  PREFERRED_PROVIDER: 'pref_str_preferred_provider',
  SECONDARY_MODEL: 'pref_str_secondary_model',
  LOCAL_ANDROID_INFERENCE_ENABLED: 'pref_bool_local_android_inference_enabled',
  BOUND_WHATSAPP_NUMBER: 'pref_str_bound_whatsapp_number',
  BOUND_GMAIL_ACCOUNT: 'pref_str_bound_gmail_account',
  BOUND_OUTLOOK_ACCOUNT: 'pref_str_bound_outlook_account',
  PREFERRED_WRITING_STYLE: 'pref_str_preferred_writing_style',
  REQUIRE_CONFIRMATION_SENSITIVE: 'pref_bool_require_confirmation_sensitive',

  // Radar monitoring preferences
  RADAR_EMAILS_SEM_RESPOSTA: 'pref_bool_radar_emails_sem_resposta',
  RADAR_COMPROMISSOS: 'pref_bool_radar_compromissos',
  RADAR_DOCUMENTOS_PENDENTES: 'pref_bool_radar_documentos_pendentes',
  RADAR_TAREFAS_ATRASADAS: 'pref_bool_radar_tarefas_atrasadas',
  RADAR_CONVERSAS_RELEVANTES: 'pref_bool_radar_conversas_relevantes',
  RADAR_PRIORITY_FILTER: 'pref_str_radar_priority_filter',

  // Persisted VPS connection status & last health check
  VPS_CONNECTION_STATE: 'pref_str_vps_connection_state',
  VPS_LAST_HEALTH_REACHABLE: 'pref_bool_vps_last_health_reachable',
  VPS_LAST_HEALTH_STATUS_CODE: 'pref_int_vps_last_health_status_code',
  VPS_LAST_HEALTH_MESSAGE: 'pref_str_vps_last_health_message',
  VPS_LAST_HEALTH_CHECKED_AT: 'pref_str_vps_last_health_checked_at',

  // Metadata
  META_REVISION: 'pref_int_meta_revision',
  META_UPDATED_AT: 'pref_str_meta_updated_at',
} as const;

type RawPreferencesMap = Record<string, string | number | boolean | null>;

export interface DataStoreDiagnostics {
  fileName: string;
  revision: number;
  keysCount: number;
  lastUpdatedAt: string;
  persistedKeysPreview: Array<{ key: string; value: string }>;
}

export interface UserPreferencesSnapshot {
  settings: AppSettingsState;
  radarPrefs: RadarMonitoringPreferences;
  radarPriorityFilter: RadarPriority | 'todas';
  connectionState: ConnectionState;
  lastHealthResult: ApiHealthResult | null;
  diagnostics: DataStoreDiagnostics;
}

export const AGENT_DEFAULT_DEVICE_META: Record<
  DarioAgentId,
  { instanceId: string; deviceLabel: string }
> = {
  gemeos: {
    instanceId: DEFAULT_INSTANCE_ID,
    deviceLabel: 'Celular Pessoal · Gêmeos (Twin)',
  },
  azusa: {
    instanceId: 'inst-church-azusa',
    deviceLabel: 'Celular da Igreja · Azusa',
  },
  croma: {
    instanceId: 'inst-store-croma',
    deviceLabel: 'Celular da Loja · Croma (MarquesColor)',
  },
  b2b: {
    instanceId: 'inst-commercial-b2b',
    deviceLabel: 'Celular Comercial · B2B',
  },
};

const DEFAULT_RAW_PREFERENCES: RawPreferencesMap = {
  [PreferencesKeys.INSTANCE_ID]: DEFAULT_INSTANCE_ID,
  [PreferencesKeys.PRIMARY_AGENT_ID]: 'gemeos',
  [PreferencesKeys.DEVICE_LABEL]: 'Celular Pessoal · Gêmeos (Twin)',
  [PreferencesKeys.INSTANCE_SETUP_COMPLETED]: true,

  [PreferencesKeys.USER_NAME]: 'Dario Marques',
  [PreferencesKeys.VPS_BASE_URL]: '',
  [PreferencesKeys.WS_ENDPOINT_URL]: '',
  [PreferencesKeys.REQUEST_TIMEOUT_MS]: 4000,
  [PreferencesKeys.PREFERRED_PROVIDER]: 'gemini',
  [PreferencesKeys.SECONDARY_MODEL]: 'gemma_local',
  [PreferencesKeys.LOCAL_ANDROID_INFERENCE_ENABLED]: true,
  [PreferencesKeys.BOUND_WHATSAPP_NUMBER]: '',
  [PreferencesKeys.BOUND_GMAIL_ACCOUNT]: 'PrDariomarques@gmail.com',
  [PreferencesKeys.BOUND_OUTLOOK_ACCOUNT]: '',
  [PreferencesKeys.PREFERRED_WRITING_STYLE]: 'profissional',
  [PreferencesKeys.REQUIRE_CONFIRMATION_SENSITIVE]: true,

  [PreferencesKeys.RADAR_EMAILS_SEM_RESPOSTA]: true,
  [PreferencesKeys.RADAR_COMPROMISSOS]: true,
  [PreferencesKeys.RADAR_DOCUMENTOS_PENDENTES]: true,
  [PreferencesKeys.RADAR_TAREFAS_ATRASADAS]: true,
  [PreferencesKeys.RADAR_CONVERSAS_RELEVANTES]: false,
  [PreferencesKeys.RADAR_PRIORITY_FILTER]: 'todas',

  [PreferencesKeys.VPS_CONNECTION_STATE]: 'disconnected_demo',
  [PreferencesKeys.VPS_LAST_HEALTH_REACHABLE]: false,
  [PreferencesKeys.VPS_LAST_HEALTH_STATUS_CODE]: null,
  [PreferencesKeys.VPS_LAST_HEALTH_MESSAGE]: null,
  [PreferencesKeys.VPS_LAST_HEALTH_CHECKED_AT]: null,

  [PreferencesKeys.META_REVISION]: 1,
  [PreferencesKeys.META_UPDATED_AT]: 'Inicializado',
};

type PreferencesListener = (snapshot: UserPreferencesSnapshot) => void;

export class UserPreferencesRepository {
  private rawStore: RawPreferencesMap;
  private listeners = new Set<PreferencesListener>();
  private readonly storageNamespaceKey: string;

  constructor(instanceNamespace?: string) {
    this.storageNamespaceKey = instanceNamespace
      ? `${DATASTORE_STORAGE_KEY}__${instanceNamespace}`
      : DATASTORE_STORAGE_KEY;
    this.rawStore = this.readFromDisk();
  }

  private getStorage(): Storage | null {
    try {
      return typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : null;
    } catch {
      return null;
    }
  }

  private readFromDisk(): RawPreferencesMap {
    try {
      const storage = this.getStorage();
      if (!storage) {
        return { ...DEFAULT_RAW_PREFERENCES };
      }
      const saved = storage.getItem(this.storageNamespaceKey);
      if (!saved) {
        this.writeToDisk(DEFAULT_RAW_PREFERENCES);
        return { ...DEFAULT_RAW_PREFERENCES };
      }

      const parsed = JSON.parse(saved) as RawPreferencesMap;
      return { ...DEFAULT_RAW_PREFERENCES, ...parsed };
    } catch {
      return { ...DEFAULT_RAW_PREFERENCES };
    }
  }

  private writeToDisk(nextStore: RawPreferencesMap): void {
    try {
      const storage = this.getStorage();
      storage?.setItem(this.storageNamespaceKey, JSON.stringify(nextStore));
    } catch {
      // Ignore storage errors in restricted environments
    }
  }

  async edit(mutator: (draft: RawPreferencesMap) => void): Promise<UserPreferencesSnapshot> {
    const nextStore: RawPreferencesMap = { ...this.rawStore };
    mutator(nextStore);

    const currentRevision = Number(nextStore[PreferencesKeys.META_REVISION] ?? 1);
    nextStore[PreferencesKeys.META_REVISION] = currentRevision + 1;
    nextStore[PreferencesKeys.META_UPDATED_AT] = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    this.rawStore = nextStore;
    this.writeToDisk(nextStore);

    const snapshot = this.getSnapshot();
    this.notifyListeners(snapshot);
    return snapshot;
  }

  subscribe(listener: PreferencesListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(snapshot: UserPreferencesSnapshot): void {
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  getSnapshot(): UserPreferencesSnapshot {
    const raw = this.rawStore;

    const settings: AppSettingsState = {
      instanceId: String(raw[PreferencesKeys.INSTANCE_ID] ?? DEFAULT_INSTANCE_ID),
      primaryAgentId: (raw[PreferencesKeys.PRIMARY_AGENT_ID] as DarioAgentId) ?? 'gemeos',
      deviceLabel: String(
        raw[PreferencesKeys.DEVICE_LABEL] ?? 'Celular Pessoal · Gêmeos (Twin)'
      ),
      instanceSetupCompleted: Boolean(
        raw[PreferencesKeys.INSTANCE_SETUP_COMPLETED] ?? true
      ),
      userName: String(raw[PreferencesKeys.USER_NAME] ?? 'Dario Marques'),
      vpsBaseUrl: String(raw[PreferencesKeys.VPS_BASE_URL] ?? ''),
      wsEndpointUrl: String(raw[PreferencesKeys.WS_ENDPOINT_URL] ?? ''),
      requestTimeoutMs: Number(raw[PreferencesKeys.REQUEST_TIMEOUT_MS] ?? 4000),
      preferredProvider:
        (raw[PreferencesKeys.PREFERRED_PROVIDER] as ModelProviderOption) ?? 'gemini',
      secondaryModel:
        (raw[PreferencesKeys.SECONDARY_MODEL] as ModelProviderOption) ?? 'gemma_local',
      localAndroidInferenceEnabled: Boolean(
        raw[PreferencesKeys.LOCAL_ANDROID_INFERENCE_ENABLED] ?? true
      ),
      boundWhatsAppNumber: String(raw[PreferencesKeys.BOUND_WHATSAPP_NUMBER] ?? ''),
      boundGmailAccount: String(raw[PreferencesKeys.BOUND_GMAIL_ACCOUNT] ?? ''),
      boundOutlookAccount: String(raw[PreferencesKeys.BOUND_OUTLOOK_ACCOUNT] ?? ''),
      preferredWritingStyle:
        (raw[PreferencesKeys.PREFERRED_WRITING_STYLE] as AppSettingsState['preferredWritingStyle']) ??
        'profissional',
      requireConfirmationForSensitiveActions: Boolean(
        raw[PreferencesKeys.REQUIRE_CONFIRMATION_SENSITIVE] ?? true
      ),
    };

    const radarPrefs: RadarMonitoringPreferences = {
      emails_sem_resposta: Boolean(raw[PreferencesKeys.RADAR_EMAILS_SEM_RESPOSTA] ?? true),
      compromissos: Boolean(raw[PreferencesKeys.RADAR_COMPROMISSOS] ?? true),
      documentos_pendentes: Boolean(raw[PreferencesKeys.RADAR_DOCUMENTOS_PENDENTES] ?? true),
      tarefas_atrasadas: Boolean(raw[PreferencesKeys.RADAR_TAREFAS_ATRASADAS] ?? true),
      conversas_relevantes: Boolean(raw[PreferencesKeys.RADAR_CONVERSAS_RELEVANTES] ?? false),
    };

    const radarPriorityFilter =
      (raw[PreferencesKeys.RADAR_PRIORITY_FILTER] as RadarPriority | 'todas') ?? 'todas';

    const storedConnState =
      (raw[PreferencesKeys.VPS_CONNECTION_STATE] as ConnectionState) ?? 'disconnected_demo';
    const connectionState: ConnectionState =
      storedConnState === 'checking'
        ? settings.vpsBaseUrl.trim()
          ? 'unreachable'
          : 'disconnected_demo'
        : storedConnState;

    const lastMessage = raw[PreferencesKeys.VPS_LAST_HEALTH_MESSAGE];
    const lastCheckedAt = raw[PreferencesKeys.VPS_LAST_HEALTH_CHECKED_AT];
    const lastStatusCode = raw[PreferencesKeys.VPS_LAST_HEALTH_STATUS_CODE];

    const lastHealthResult: ApiHealthResult | null =
      typeof lastMessage === 'string' && typeof lastCheckedAt === 'string'
        ? {
            reachable: Boolean(raw[PreferencesKeys.VPS_LAST_HEALTH_REACHABLE]),
            statusCode: typeof lastStatusCode === 'number' ? lastStatusCode : undefined,
            message: lastMessage,
            checkedAt: lastCheckedAt,
          }
        : null;

    const persistedKeysPreview = [
      { key: 'instance_id', value: settings.instanceId },
      { key: 'primary_agent_id', value: settings.primaryAgentId },
      { key: 'primary_model', value: settings.preferredProvider },
      { key: 'secondary_model', value: settings.secondaryModel },
      { key: 'user_name', value: settings.userName },
      { key: 'vps_connection_state', value: connectionState },
    ];

    const diagnostics: DataStoreDiagnostics = {
      fileName: DATASTORE_FILE_NAME,
      revision: Number(raw[PreferencesKeys.META_REVISION] ?? 1),
      keysCount: Object.keys(PreferencesKeys).length,
      lastUpdatedAt: String(raw[PreferencesKeys.META_UPDATED_AT] ?? 'Inicializado'),
      persistedKeysPreview,
    };

    return {
      settings,
      radarPrefs,
      radarPriorityFilter,
      connectionState,
      lastHealthResult,
      diagnostics,
    };
  }

  async updateSettings(patch: Partial<AppSettingsState>): Promise<UserPreferencesSnapshot> {
    return this.edit((prefs) => {
      if (patch.instanceId !== undefined) {
        prefs[PreferencesKeys.INSTANCE_ID] = patch.instanceId;
      }
      if (patch.primaryAgentId !== undefined) {
        prefs[PreferencesKeys.PRIMARY_AGENT_ID] = patch.primaryAgentId;
      }
      if (patch.deviceLabel !== undefined) {
        prefs[PreferencesKeys.DEVICE_LABEL] = patch.deviceLabel;
      }
      if (patch.instanceSetupCompleted !== undefined) {
        prefs[PreferencesKeys.INSTANCE_SETUP_COMPLETED] = patch.instanceSetupCompleted;
      }
      if (patch.userName !== undefined) {
        prefs[PreferencesKeys.USER_NAME] = patch.userName;
      }
      if (patch.vpsBaseUrl !== undefined) {
        prefs[PreferencesKeys.VPS_BASE_URL] = patch.vpsBaseUrl;
        if (!patch.vpsBaseUrl.trim()) {
          prefs[PreferencesKeys.VPS_CONNECTION_STATE] = 'disconnected_demo';
        }
      }
      if (patch.wsEndpointUrl !== undefined) {
        prefs[PreferencesKeys.WS_ENDPOINT_URL] = patch.wsEndpointUrl;
      }
      if (patch.requestTimeoutMs !== undefined) {
        prefs[PreferencesKeys.REQUEST_TIMEOUT_MS] = patch.requestTimeoutMs;
      }
      if (patch.preferredProvider !== undefined) {
        prefs[PreferencesKeys.PREFERRED_PROVIDER] = patch.preferredProvider;
      }
      if (patch.secondaryModel !== undefined) {
        prefs[PreferencesKeys.SECONDARY_MODEL] = patch.secondaryModel;
      }
      if (patch.localAndroidInferenceEnabled !== undefined) {
        prefs[PreferencesKeys.LOCAL_ANDROID_INFERENCE_ENABLED] =
          patch.localAndroidInferenceEnabled;
      }
      if (patch.boundWhatsAppNumber !== undefined) {
        prefs[PreferencesKeys.BOUND_WHATSAPP_NUMBER] = patch.boundWhatsAppNumber;
      }
      if (patch.boundGmailAccount !== undefined) {
        prefs[PreferencesKeys.BOUND_GMAIL_ACCOUNT] = patch.boundGmailAccount;
      }
      if (patch.boundOutlookAccount !== undefined) {
        prefs[PreferencesKeys.BOUND_OUTLOOK_ACCOUNT] = patch.boundOutlookAccount;
      }
      if (patch.preferredWritingStyle !== undefined) {
        prefs[PreferencesKeys.PREFERRED_WRITING_STYLE] = patch.preferredWritingStyle;
      }
      if (patch.requireConfirmationForSensitiveActions !== undefined) {
        prefs[PreferencesKeys.REQUIRE_CONFIRMATION_SENSITIVE] =
          patch.requireConfirmationForSensitiveActions;
      }
    });
  }

  /**
   * Authorized reconfiguration of the installation's primary agent and isolated instance_id.
   */
  async reconfigureInstanceAgent(
    agentId: DarioAgentId,
    customInstanceId?: string,
    customDeviceLabel?: string
  ): Promise<UserPreferencesSnapshot> {
    const meta = AGENT_DEFAULT_DEVICE_META[agentId];
    const nextInstanceId = customInstanceId?.trim() || meta.instanceId;
    const nextLabel = customDeviceLabel?.trim() || meta.deviceLabel;

    return this.edit((prefs) => {
      const previousAgentId = prefs[PreferencesKeys.PRIMARY_AGENT_ID];
      const previousInstanceId = prefs[PreferencesKeys.INSTANCE_ID];
      prefs[PreferencesKeys.PRIMARY_AGENT_ID] = agentId;
      prefs[PreferencesKeys.INSTANCE_ID] = nextInstanceId;
      prefs[PreferencesKeys.DEVICE_LABEL] = nextLabel;
      prefs[PreferencesKeys.INSTANCE_SETUP_COMPLETED] = true;

      if (previousAgentId !== agentId || previousInstanceId !== nextInstanceId) {
        prefs[PreferencesKeys.BOUND_WHATSAPP_NUMBER] = '';
        prefs[PreferencesKeys.BOUND_GMAIL_ACCOUNT] = '';
        prefs[PreferencesKeys.BOUND_OUTLOOK_ACCOUNT] = '';
      }
    });
  }

  async toggleRadarPreference(
    key: keyof RadarMonitoringPreferences
  ): Promise<UserPreferencesSnapshot> {
    const keyMap: Record<keyof RadarMonitoringPreferences, string> = {
      emails_sem_resposta: PreferencesKeys.RADAR_EMAILS_SEM_RESPOSTA,
      compromissos: PreferencesKeys.RADAR_COMPROMISSOS,
      documentos_pendentes: PreferencesKeys.RADAR_DOCUMENTOS_PENDENTES,
      tarefas_atrasadas: PreferencesKeys.RADAR_TAREFAS_ATRASADAS,
      conversas_relevantes: PreferencesKeys.RADAR_CONVERSAS_RELEVANTES,
    };

    const prefKey = keyMap[key];
    return this.edit((prefs) => {
      prefs[prefKey] = !prefs[prefKey];
    });
  }

  async updateRadarPriorityFilter(
    filter: RadarPriority | 'todas'
  ): Promise<UserPreferencesSnapshot> {
    return this.edit((prefs) => {
      prefs[PreferencesKeys.RADAR_PRIORITY_FILTER] = filter;
    });
  }

  async updateVpsConnectionStatus(
    connectionState: ConnectionState,
    healthResult?: ApiHealthResult | null
  ): Promise<UserPreferencesSnapshot> {
    return this.edit((prefs) => {
      prefs[PreferencesKeys.VPS_CONNECTION_STATE] = connectionState;
      if (healthResult !== undefined) {
        if (healthResult === null) {
          prefs[PreferencesKeys.VPS_LAST_HEALTH_REACHABLE] = false;
          prefs[PreferencesKeys.VPS_LAST_HEALTH_STATUS_CODE] = null;
          prefs[PreferencesKeys.VPS_LAST_HEALTH_MESSAGE] = null;
          prefs[PreferencesKeys.VPS_LAST_HEALTH_CHECKED_AT] = null;
        } else {
          prefs[PreferencesKeys.VPS_LAST_HEALTH_REACHABLE] = healthResult.reachable;
          prefs[PreferencesKeys.VPS_LAST_HEALTH_STATUS_CODE] =
            healthResult.statusCode ?? null;
          prefs[PreferencesKeys.VPS_LAST_HEALTH_MESSAGE] = healthResult.message;
          prefs[PreferencesKeys.VPS_LAST_HEALTH_CHECKED_AT] = healthResult.checkedAt;
        }
      }
    });
  }

  async resetToDefaults(): Promise<UserPreferencesSnapshot> {
    this.rawStore = {
      ...DEFAULT_RAW_PREFERENCES,
      [PreferencesKeys.META_REVISION]: 1,
      [PreferencesKeys.META_UPDATED_AT]: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
    this.writeToDisk(this.rawStore);
    const snapshot = this.getSnapshot();
    this.notifyListeners(snapshot);
    return snapshot;
  }
}

export const userPreferencesRepository = new UserPreferencesRepository();
