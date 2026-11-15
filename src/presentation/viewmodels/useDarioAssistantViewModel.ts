import { useCallback, useEffect, useMemo, useState } from 'react';
import { HttpDarioApiClient } from '../../data/apiClient';
import {
  CONNECTOR_CATALOG,
  DEMO_ARTIFACTS,
  DEMO_ASSISTANTS,
  DEMO_CONVERSATIONS,
  DEMO_NOTIFICATIONS,
  DEMO_RADAR_SIGNALS,
  DEMO_SCHEDULED_TASKS,
} from '../../data/demoRepository';
import {
  LocalDatabaseDiagnostics,
  localPersistenceRepository,
} from '../../data/local/localPersistenceRepository';
import {
  userPreferencesRepository,
  UserPreferencesSnapshot,
} from '../../data/preferences/userPreferencesDataStore';
import {
  AppSettingsState,
  ArtifactFormat,
  ArtifactItem,
  ConversationThread,
  NotificationItem,
  PrimaryTab,
  RadarMonitoringPreferences,
  RadarPriority,
  RadarSignal,
  ScheduleFrequency,
  ScheduledTask,
} from '../../domain/models';

const UI_STATE_STORAGE_KEY = 'dario_assistant_phase1_ui_state_v1';

interface PersistedUiState {
  activeTab: PrimaryTab;
  selectedConversationId: string | null;
  selectedArtifactId: string | null;
}

function loadInitialUiState(): PersistedUiState {
  try {
    const raw = window.localStorage.getItem(UI_STATE_STORAGE_KEY);
    if (!raw) {
      return {
        activeTab: 'conversas',
        selectedConversationId: DEMO_CONVERSATIONS[0]?.id ?? null,
        selectedArtifactId: DEMO_ARTIFACTS[0]?.id ?? null,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedUiState>;
    return {
      activeTab: parsed.activeTab ?? 'conversas',
      selectedConversationId: parsed.selectedConversationId ?? DEMO_CONVERSATIONS[0]?.id ?? null,
      selectedArtifactId: parsed.selectedArtifactId ?? DEMO_ARTIFACTS[0]?.id ?? null,
    };
  } catch {
    return {
      activeTab: 'conversas',
      selectedConversationId: DEMO_CONVERSATIONS[0]?.id ?? null,
      selectedArtifactId: DEMO_ARTIFACTS[0]?.id ?? null,
    };
  }
}

export function useDarioAssistantViewModel() {
  const initialUi = useMemo(() => loadInitialUiState(), []);

  const [activeTab, setActiveTab] = useState<PrimaryTab>(initialUi.activeTab);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Estado reativo alimentado pelo UserPreferencesRepository (Jetpack DataStore)
  const [prefsSnapshot, setPrefsSnapshot] = useState<UserPreferencesSnapshot>(() =>
    userPreferencesRepository.getSnapshot()
  );

  const [dbReady, setDbReady] = useState(false);
  const [dbDiagnostics, setDbDiagnostics] = useState<LocalDatabaseDiagnostics | null>(null);

  const [conversations, setConversations] = useState<ConversationThread[]>(DEMO_CONVERSATIONS);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialUi.selectedConversationId
  );
  const [conversationSearch, setConversationSearch] = useState('');
  const [showArchivedConversations, setShowArchivedConversations] = useState(false);
  const [composerDraft, setComposerDraft] = useState('');
  const [composerFeedback, setComposerFeedback] = useState<string | null>(null);

  const [allArtifacts, setAllArtifacts] = useState<ArtifactItem[]>(DEMO_ARTIFACTS);
  const [artifactFormatFilter, setArtifactFormatFilter] = useState<ArtifactFormat | 'TODOS'>('TODOS');
  const [artifactSearch, setArtifactSearch] = useState('');
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    initialUi.selectedArtifactId
  );

  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>(DEMO_SCHEDULED_TASKS);
  const [radarSignals, setRadarSignals] = useState<RadarSignal[]>(DEMO_RADAR_SIGNALS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEMO_NOTIFICATIONS);

  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(
    CONNECTOR_CATALOG[0]?.id ?? null
  );

  // Coleta reativa do UserPreferencesRepository
  useEffect(() => {
    const unsubscribe = userPreferencesRepository.subscribe((snapshot) => {
      setPrefsSnapshot(snapshot);
    });
    return unsubscribe;
  }, []);

  const {
    settings,
    radarPrefs,
    radarPriorityFilter,
    connectionState,
    lastHealthResult,
    diagnostics: dataStoreDiagnostics,
  } = prefsSnapshot;

  // Inicialização e troca de banco local isolado por instalação (instance_id + primaryAgentId)
  useEffect(() => {
    let active = true;
    localPersistenceRepository.setActiveInstance(
      settings.instanceId,
      settings.primaryAgentId
    );
    localPersistenceRepository
      .initializeAndLoad()
      .then(
        ({
          conversations: loadedConvs,
          artifacts: loadedArts,
          scheduledTasks: loadedTasks,
          radarSignals: loadedRadar,
          notifications: loadedNotifs,
          diagnostics,
        }) => {
          if (!active) return;
          setConversations(loadedConvs);
          setAllArtifacts(loadedArts);
          setScheduledTasks(loadedTasks);
          setRadarSignals(loadedRadar);
          setNotifications(loadedNotifs);
          setDbDiagnostics(diagnostics);
          setDbReady(true);

          setSelectedConversationId((prev) => {
            if (prev && loadedConvs.some((c) => c.id === prev)) return prev;
            return loadedConvs[0]?.id ?? null;
          });

          setSelectedArtifactId((prev) => {
            if (prev && loadedArts.some((a) => a.id === prev)) return prev;
            return loadedArts[0]?.id ?? null;
          });
        }
      )
      .catch(() => {
        if (!active) return;
        setDbReady(true);
      });

    return () => {
      active = false;
    };
  }, [settings.instanceId, settings.primaryAgentId]);

  // Persiste aba e itens selecionados para manter o estado da sessão ao reiniciar
  useEffect(() => {
    try {
      const uiState: PersistedUiState = {
        activeTab,
        selectedConversationId,
        selectedArtifactId,
      };
      window.localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(uiState));
    } catch {
      // Ignore storage errors
    }
  }, [activeTab, selectedConversationId, selectedArtifactId]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    return conversations.filter((conv) => {
      if (conv.archived !== showArchivedConversations) return false;
      if (!query) return true;
      const inMessages = conv.messages.some((m) => m.content.toLowerCase().includes(query));
      return (
        conv.title.toLowerCase().includes(query) ||
        conv.subject.toLowerCase().includes(query) ||
        inMessages
      );
    });
  }, [conversations, conversationSearch, showArchivedConversations]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const filteredArtifacts = useMemo(() => {
    const query = artifactSearch.trim().toLowerCase();
    return allArtifacts.filter((art) => {
      if (artifactFormatFilter !== 'TODOS' && art.format !== artifactFormatFilter) return false;
      if (!query) return true;
      return (
        art.title.toLowerCase().includes(query) ||
        art.extractedPreview.toLowerCase().includes(query) ||
        art.source.toLowerCase().includes(query)
      );
    });
  }, [allArtifacts, artifactFormatFilter, artifactSearch]);

  const selectedArtifact = useMemo(
    () => allArtifacts.find((a) => a.id === selectedArtifactId) ?? filteredArtifacts[0] ?? null,
    [allArtifacts, filteredArtifacts, selectedArtifactId]
  );

  const filteredRadarSignals = useMemo(() => {
    return radarSignals.filter((sig) => {
      if (!radarPrefs[sig.category]) return false;
      if (radarPriorityFilter !== 'todas' && sig.priority !== radarPriorityFilter) return false;
      return true;
    });
  }, [radarSignals, radarPrefs, radarPriorityFilter]);

  const selectedConnector = useMemo(
    () => CONNECTOR_CATALOG.find((c) => c.id === selectedConnectorId) ?? CONNECTOR_CATALOG[0] ?? null,
    [selectedConnectorId]
  );

  const selectConversation = useCallback((id: string) => {
    setSelectedConversationId(id);
    setComposerFeedback(null);
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== id) return conv;
        const updated = { ...conv, unreadCount: 0 };
        void localPersistenceRepository
          .saveConversation(updated)
          .then((diag) => setDbDiagnostics(diag));
        return updated;
      })
    );
  }, []);

  const createLocalDemoThread = useCallback(
    (subject: string, title: string, assistantId: string) => {
      const cleanTitle = title.trim();
      if (!cleanTitle) return;
      const nowMs = Date.now();
      const newId = `conv-local-${nowMs}`;
      const newThread: ConversationThread = {
        id: newId,
        title: cleanTitle,
        subject: subject.trim() || 'Geral',
        assistantId,
        updatedAt: 'Agora · Persistido',
        unreadCount: 0,
        archived: false,
        isolatedContextKey: `ctx_local_${nowMs}`,
        isDemo: true,
        messages: [
          {
            id: `msg-${nowMs}`,
            sender: 'system_notice',
            content:
              'Conversa persistida no banco de dados local (Room / IndexedDB) com contexto isolado. O estado permanece salvo entre reinicializações do app.',
            timestamp: new Date().toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ],
      };
      setConversations((prev) => [newThread, ...prev]);
      setShowArchivedConversations(false);
      setSelectedConversationId(newId);

      void localPersistenceRepository
        .saveConversation(newThread, nowMs)
        .then((diag) => setDbDiagnostics(diag));
    },
    []
  );

  const toggleArchiveConversation = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== id) return conv;
        const updated: ConversationThread = { ...conv, archived: !conv.archived };
        void localPersistenceRepository
          .saveConversation(updated)
          .then((diag) => setDbDiagnostics(diag));
        return updated;
      })
    );
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((conv) => conv.id !== id);
        if (selectedConversationId === id) {
          setSelectedConversationId(next[0]?.id ?? null);
        }
        return next;
      });
      void localPersistenceRepository
        .deleteConversation(id)
        .then((diag) => setDbDiagnostics(diag));
    },
    [selectedConversationId]
  );

  const submitDraftPhase1 = useCallback(() => {
    const text = composerDraft.trim();
    if (!text || !selectedConversationId) return;

    const nowMs = Date.now();
    const nowLabel = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== selectedConversationId) return conv;
        const updated: ConversationThread = {
          ...conv,
          updatedAt: `Persistido · ${nowLabel}`,
          messages: [
            ...conv.messages,
            {
              id: `msg-user-${nowMs}`,
              sender: 'user',
              content: text,
              timestamp: nowLabel,
            },
            {
              id: `msg-notice-${nowMs + 1}`,
              sender: 'system_notice',
              content:
                'Mensagem gravada no banco de dados local (ConversationDao). Nenhuma resposta fictícia de IA foi gerada porque o Model Router na VPS entra na Fase 3.',
              timestamp: nowLabel,
            },
          ],
        };

        void localPersistenceRepository
          .saveConversation(updated, nowMs)
          .then((diag) => setDbDiagnostics(diag));

        return updated;
      })
    );
    setComposerDraft('');
    setComposerFeedback('Mensagem salva no banco de dados local (Room / IndexedDB).');
  }, [composerDraft, selectedConversationId]);

  const addLocalArtifact = useCallback(
    (title: string, format: ArtifactFormat, source: string, extractedPreview: string) => {
      const cleanTitle = title.trim();
      if (!cleanTitle) return;
      const nowMs = Date.now();
      const nowLabel = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const newArtifact: ArtifactItem = {
        id: `art-local-${nowMs}`,
        title: cleanTitle,
        format,
        source: source.trim() || 'Registro local persistido (Room)',
        processedAt: `Persistido · ${nowLabel}`,
        confidence: 0.94,
        extractedPreview:
          extractedPreview.trim() ||
          'Artefato registrado localmente no banco de dados para validação de persistência MVVM.',
        errorsFound: null,
        targetPhase:
          format === 'AUDIO'
            ? 'Fase 4 · WhatsApp Intelligence'
            : 'Fase 3 · Document Intelligence',
        isDemo: true,
      };

      setAllArtifacts((prev) => [newArtifact, ...prev]);
      setSelectedArtifactId(newArtifact.id);

      void localPersistenceRepository
        .saveArtifact(newArtifact, nowMs)
        .then((diag) => setDbDiagnostics(diag));
    },
    []
  );

  const deleteLocalArtifact = useCallback(
    (id: string) => {
      setAllArtifacts((prev) => {
        const next = prev.filter((item) => item.id !== id);
        if (selectedArtifactId === id) {
          setSelectedArtifactId(next[0]?.id ?? null);
        }
        return next;
      });
      void localPersistenceRepository
        .deleteArtifact(id)
        .then((diag) => setDbDiagnostics(diag));
    },
    [selectedArtifactId]
  );

  const resetLocalDatabase = useCallback(async () => {
    const {
      conversations: resetConvs,
      artifacts: resetArts,
      scheduledTasks: resetTasks,
      radarSignals: resetRadar,
      notifications: resetNotifs,
      diagnostics,
    } = await localPersistenceRepository.resetToInitialSeed();
    setConversations(resetConvs);
    setAllArtifacts(resetArts);
    setScheduledTasks(resetTasks);
    setRadarSignals(resetRadar);
    setNotifications(resetNotifs);
    setDbDiagnostics(diagnostics);
    setSelectedConversationId(resetConvs[0]?.id ?? null);
    setSelectedArtifactId(resetArts[0]?.id ?? null);
  }, []);

  // Persiste alternância de agendamento no IndexedDB (ScheduledTaskDao)
  const toggleScheduledTask = useCallback((id: string) => {
    setScheduledTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const updated: ScheduledTask = { ...task, enabled: !task.enabled };
        void localPersistenceRepository
          .saveScheduledTask(updated)
          .then((diag) => setDbDiagnostics(diag));
        return updated;
      })
    );
  }, []);

  // Cria e persiste novo agendamento no IndexedDB (ScheduledTaskDao)
  const addLocalDemoSchedule = useCallback(
    (
      name: string,
      frequency: ScheduleFrequency,
      scheduleTime: string,
      requiresConfirmation: boolean
    ) => {
      const cleanName = name.trim();
      if (!cleanName) return;
      const nowMs = Date.now();
      const item: ScheduledTask = {
        id: `sch-local-${nowMs}`,
        name: cleanName,
        frequency,
        scheduleTime: scheduleTime.trim() || '09:00',
        enabled: true,
        requiresConfirmation,
        targetPhase: 'Fase 7 · Radar & Agendamentos',
        isDemo: true,
        lastExecution: {
          executionId: `demo-local-${nowMs}`,
          executedAt: 'Nunca executado',
          status: 'pendente_vps',
          attempts: 0,
          summary: 'Agendamento persistido no banco local. Execução real requer Scheduler na VPS.',
        },
      };
      setScheduledTasks((prev) => [item, ...prev]);
      void localPersistenceRepository
        .saveScheduledTask(item, nowMs)
        .then((diag) => setDbDiagnostics(diag));
    },
    []
  );

  // Remove agendamento do IndexedDB (ScheduledTaskDao)
  const removeScheduledTask = useCallback((id: string) => {
    setScheduledTasks((prev) => prev.filter((task) => task.id !== id));
    void localPersistenceRepository
      .deleteScheduledTask(id)
      .then((diag) => setDbDiagnostics(diag));
  }, []);

  // Persiste estado de revisão do sinal do Radar no IndexedDB (RadarSignalDao)
  const toggleRadarSignalAcknowledged = useCallback((id: string) => {
    setRadarSignals((prev) =>
      prev.map((sig) => {
        if (sig.id !== id) return sig;
        const updated: RadarSignal = { ...sig, acknowledged: !sig.acknowledged };
        void localPersistenceRepository
          .saveRadarSignal(updated)
          .then((diag) => setDbDiagnostics(diag));
        return updated;
      })
    );
  }, []);

  // Persiste no Jetpack DataStore ao alternar preferência de monitoramento do Radar
  const toggleRadarPreference = useCallback((key: keyof RadarMonitoringPreferences) => {
    void userPreferencesRepository.toggleRadarPreference(key);
  }, []);

  // Persiste filtro de prioridade do Radar no Jetpack DataStore
  const setRadarPriorityFilter = useCallback((filter: RadarPriority | 'todas') => {
    void userPreferencesRepository.updateRadarPriorityFilter(filter);
  }, []);

  // Persiste estado de leitura da notificação no IndexedDB (NotificationDao)
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated: NotificationItem = { ...item, read: true };
        void localPersistenceRepository
          .saveNotification(updated)
          .then((diag) => setDbDiagnostics(diag));
        return updated;
      })
    );
  }, []);

  // Persiste todas as notificações como lidas no IndexedDB (NotificationDao)
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    void localPersistenceRepository
      .markAllNotificationsRead()
      .then((diag) => setDbDiagnostics(diag));
  }, []);

  // Persiste configurações (userName, vpsBaseUrl, etc.) no Jetpack DataStore
  const updateSettings = useCallback((patch: Partial<AppSettingsState>) => {
    void userPreferencesRepository.updateSettings(patch);
  }, []);

  // Executa checagem real do endpoint /health e persiste o estado e resultado no Jetpack DataStore
  const testVpsConnection = useCallback(async () => {
    await userPreferencesRepository.updateVpsConnectionStatus('checking');
    const client = new HttpDarioApiClient(settings.vpsBaseUrl);
    const result = await client.checkHealth(settings.requestTimeoutMs);

    const nextState = !settings.vpsBaseUrl.trim()
      ? 'disconnected_demo'
      : result.reachable
        ? 'configured_unverified'
        : 'unreachable';

    await userPreferencesRepository.updateVpsConnectionStatus(nextState, result);
  }, [settings.requestTimeoutMs, settings.vpsBaseUrl]);

  const resetUserPreferences = useCallback(async () => {
    await userPreferencesRepository.resetToDefaults();
  }, []);

  const reconfigureInstallation = useCallback(
    async (agentId: typeof settings.primaryAgentId, customInstanceId?: string, customDeviceLabel?: string) => {
      await userPreferencesRepository.reconfigureInstanceAgent(
        agentId,
        customInstanceId,
        customDeviceLabel
      );
    },
    []
  );

  return {
    activeTab,
    setActiveTab,
    settingsOpen,
    setSettingsOpen,
    notificationsOpen,
    setNotificationsOpen,
    settings,
    updateSettings,
    reconfigureInstallation,
    connectionState,
    lastHealthResult,
    testVpsConnection,
    dataStoreDiagnostics,
    resetUserPreferences,
    dbReady,
    dbDiagnostics,
    resetLocalDatabase,
    assistants: DEMO_ASSISTANTS,
    conversations: filteredConversations,
    allConversationsCount: conversations.length,
    selectedConversation,
    selectedConversationId,
    selectConversation,
    conversationSearch,
    setConversationSearch,
    showArchivedConversations,
    setShowArchivedConversations,
    createLocalDemoThread,
    toggleArchiveConversation,
    deleteConversation,
    composerDraft,
    setComposerDraft,
    composerFeedback,
    submitDraftPhase1,
    artifacts: filteredArtifacts,
    selectedArtifact,
    setSelectedArtifactId,
    artifactFormatFilter,
    setArtifactFormatFilter,
    artifactSearch,
    setArtifactSearch,
    addLocalArtifact,
    deleteLocalArtifact,
    scheduledTasks,
    toggleScheduledTask,
    addLocalDemoSchedule,
    removeScheduledTask,
    radarSignals: filteredRadarSignals,
    allRadarSignalsCount: radarSignals.length,
    radarPriorityFilter,
    setRadarPriorityFilter,
    radarPrefs,
    toggleRadarPreference,
    toggleRadarSignalAcknowledged,
    connectors: CONNECTOR_CATALOG,
    selectedConnector,
    setSelectedConnectorId,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
  };
}
