import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { HttpDarioApiClient } from '../apiClient';
import {
  ArtifactDao,
  ConversationDao,
  DarioRoomDatabase,
  DB_NAME,
  getDatabaseNameForInstance,
  NotificationDao,
  RadarSignalDao,
  ScheduledTaskDao,
} from '../local/daos';
import {
  mapArtifactToEntity,
  mapConversationToEntities,
  mapEntitiesToConversation,
  mapEntityToArtifact,
  mapEntityToNotification,
  mapEntityToRadarSignal,
  mapEntityToScheduledTask,
  mapNotificationToEntity,
  mapRadarSignalToEntity,
  mapScheduledTaskToEntity,
} from '../local/entities';
import { LocalPersistenceRepository } from '../local/localPersistenceRepository';
import { UserPreferencesRepository } from '../preferences/userPreferencesDataStore';

function setupMemoryLocalStorage() {
  const store = new Map<string, string>();
  const mockStorage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    configurable: true,
    writable: true,
  });
}

async function deleteDbByName(dbName: string) {
  await new Promise<void>((resolve, reject) => {
    const req = globalThis.indexedDB.deleteDatabase(dbName);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

async function resetIndexedDb() {
  await DarioRoomDatabase.closeAllConnections();
  await deleteDbByName(DB_NAME);
  await deleteDbByName(getDatabaseNameForInstance('inst-store-croma'));
  await deleteDbByName(getDatabaseNameForInstance('inst-church-azusa'));
}

describe('Fase 1 Saneamento — Entidades, DAOs, Repositórios e Persistência', () => {
  beforeEach(async () => {
    setupMemoryLocalStorage();
    await resetIndexedDb();
  });

  it('mapeia conversas, artefatos, agendamentos, sinais do Radar e notificações sem perda de dados', () => {
    const convBundle = mapConversationToEntities(
      {
        id: 'c-1',
        title: 'Teste Isolamento',
        subject: 'Arquitetura',
        assistantId: 'ast-geral',
        updatedAt: '10:00',
        unreadCount: 2,
        archived: false,
        isolatedContextKey: 'ctx_test_1',
        isDemo: true,
        messages: [
          { id: 'm-1', sender: 'user', content: 'Olá', timestamp: '09:59' },
          {
            id: 'm-2',
            sender: 'assistant',
            content: 'Resposta factual',
            timestamp: '10:00',
            classification: 'fato',
          },
        ],
      },
      1000
    );

    const mappedConv = mapEntitiesToConversation(convBundle);
    expect(mappedConv.id).toBe('c-1');
    expect(mappedConv.messages).toHaveLength(2);
    expect(mappedConv.messages[1].classification).toBe('fato');

    const artEntity = mapArtifactToEntity(
      {
        id: 'a-1',
        title: 'nota.xml',
        format: 'XML',
        source: 'Teste',
        processedAt: '10:00',
        confidence: 0.98,
        extractedPreview: 'NF-e',
        errorsFound: null,
        targetPhase: 'Fase 3 · Document Intelligence',
        isDemo: true,
      },
      2000
    );
    expect(mapEntityToArtifact(artEntity).format).toBe('XML');

    const taskEntity = mapScheduledTaskToEntity(
      {
        id: 's-1',
        name: 'Resumo Diário',
        frequency: 'Diário',
        scheduleTime: '07:00',
        enabled: true,
        requiresConfirmation: true,
        targetPhase: 'Fase 7 · Radar & Agendamentos',
        isDemo: true,
        lastExecution: {
          executionId: 'ex-1',
          executedAt: 'Nunca',
          status: 'pendente_vps',
          attempts: 0,
          summary: 'Aguardando VPS',
        },
      },
      3000
    );
    expect(mapEntityToScheduledTask(taskEntity).requiresConfirmation).toBe(true);

    const radarEntity = mapRadarSignalToEntity(
      {
        id: 'r-1',
        title: 'Contrato pendente',
        summary: 'Vence amanhã',
        category: 'documentos_pendentes',
        priority: 'alta',
        classification: 'inferencia',
        origin: 'Teste',
        detectedAt: 'Hoje',
        acknowledged: true,
        isDemo: true,
      },
      4000
    );
    expect(mapEntityToRadarSignal(radarEntity).acknowledged).toBe(true);

    const notifEntity = mapNotificationToEntity(
      {
        id: 'n-1',
        title: 'Aviso',
        detail: 'Detalhe',
        timestamp: 'Agora',
        read: true,
        targetTab: 'radar',
        isDemo: true,
      },
      5000
    );
    expect(mapEntityToNotification(notifEntity).read).toBe(true);
  });

  it('ConversationDao garante integridade referencial CASCADE ao excluir uma conversa', async () => {
    const db = DarioRoomDatabase.getInstance();
    const dao = new ConversationDao(db);

    const bundle = mapConversationToEntities(
      {
        id: 'conv-cascade',
        title: 'Conversa com mensagens',
        subject: 'Teste',
        assistantId: 'ast-geral',
        updatedAt: 'Agora',
        unreadCount: 0,
        archived: false,
        isolatedContextKey: 'ctx_cascade',
        isDemo: true,
        messages: [
          { id: 'msg-a', sender: 'user', content: 'Msg 1', timestamp: '10:00' },
          { id: 'msg-b', sender: 'assistant', content: 'Msg 2', timestamp: '10:01' },
        ],
      },
      Date.now()
    );

    await dao.upsertConversationWithMessages(bundle);
    let all = await dao.getAllConversationsWithMessages();
    expect(all).toHaveLength(1);
    expect(all[0].messages).toHaveLength(2);

    await dao.deleteConversationById('conv-cascade');
    all = await dao.getAllConversationsWithMessages();
    expect(all).toHaveLength(0);
  });

  it('ScheduledTaskDao, RadarSignalDao e NotificationDao persistem alterações no IndexedDB', async () => {
    const db = DarioRoomDatabase.getInstance();
    const taskDao = new ScheduledTaskDao(db);
    const radarDao = new RadarSignalDao(db);
    const notifDao = new NotificationDao(db);
    const artDao = new ArtifactDao(db);

    // ArtifactDao
    await artDao.upsertArtifact(
      mapArtifactToEntity(
        {
          id: 'art-test',
          title: 'planilha.xlsx',
          format: 'XLSX',
          source: 'Local',
          processedAt: '12:00',
          confidence: 0.95,
          extractedPreview: 'Abas financeiras',
          errorsFound: null,
          targetPhase: 'Fase 3 · Document Intelligence',
          isDemo: true,
        },
        100
      )
    );
    expect(await artDao.getAllArtifacts()).toHaveLength(1);
    await artDao.deleteArtifactById('art-test');
    expect(await artDao.getAllArtifacts()).toHaveLength(0);

    // ScheduledTaskDao
    const task = mapScheduledTaskToEntity(
      {
        id: 'sch-test-1',
        name: 'Monitorar XML',
        frequency: 'Diário',
        scheduleTime: '18:00',
        enabled: true,
        requiresConfirmation: true,
        targetPhase: 'Fase 7 · Radar & Agendamentos',
        isDemo: true,
        lastExecution: {
          executionId: 'e1',
          executedAt: 'Nunca',
          status: 'pendente_vps',
          attempts: 0,
          summary: 'Pendente',
        },
      },
      200
    );
    await taskDao.upsertScheduledTask(task);
    await taskDao.upsertScheduledTask({ ...task, enabled: false });
    const loadedTasks = await taskDao.getAllScheduledTasks();
    expect(loadedTasks).toHaveLength(1);
    expect(loadedTasks[0].enabled).toBe(false);
    await taskDao.deleteScheduledTaskById('sch-test-1');
    expect(await taskDao.getAllScheduledTasks()).toHaveLength(0);

    // RadarSignalDao
    const signal = mapRadarSignalToEntity(
      {
        id: 'rad-test-1',
        title: 'Sinal de Teste',
        summary: 'Detalhe',
        category: 'compromissos',
        priority: 'alta',
        classification: 'fato',
        origin: 'Teste',
        detectedAt: 'Agora',
        acknowledged: false,
        isDemo: true,
      },
      300
    );
    await radarDao.upsertRadarSignal(signal);
    await radarDao.upsertRadarSignal({ ...signal, acknowledged: true });
    const loadedSignals = await radarDao.getAllRadarSignals();
    expect(loadedSignals[0].acknowledged).toBe(true);

    // NotificationDao
    await notifDao.upsertNotification(
      mapNotificationToEntity(
        {
          id: 'not-a',
          title: 'N1',
          detail: 'D1',
          timestamp: '10:00',
          read: false,
          targetTab: 'conversas',
          isDemo: true,
        },
        400
      )
    );
    await notifDao.upsertNotification(
      mapNotificationToEntity(
        {
          id: 'not-b',
          title: 'N2',
          detail: 'D2',
          timestamp: '10:05',
          read: false,
          targetTab: 'radar',
          isDemo: true,
        },
        500
      )
    );
    await notifDao.markAllAsRead();
    const loadedNotifs = await notifDao.getAllNotifications();
    expect(loadedNotifs.every((n) => n.read)).toBe(true);
  });

  it('LocalPersistenceRepository mantém estado entre reinicializações sem sobrescrever com o seed inicial', async () => {
    const repo = new LocalPersistenceRepository();
    const initial = await repo.initializeAndLoad();

    expect(initial.conversations.length).toBeGreaterThan(0);
    expect(initial.scheduledTasks.length).toBe(3);
    expect(initial.radarSignals.length).toBe(3);
    expect(initial.notifications.length).toBe(3);

    // Modifica agendamento, sinal do Radar e notificação
    const toggledTask = { ...initial.scheduledTasks[0], enabled: !initial.scheduledTasks[0].enabled };
    await repo.saveScheduledTask(toggledTask);

    const reviewedSignal = { ...initial.radarSignals[0], acknowledged: true };
    await repo.saveRadarSignal(reviewedSignal);

    await repo.markAllNotificationsRead();

    // Simula reinicialização do app chamando initializeAndLoad novamente
    const afterRestart = await repo.initializeAndLoad();
    const persistedTask = afterRestart.scheduledTasks.find((t) => t.id === toggledTask.id);
    const persistedSignal = afterRestart.radarSignals.find((s) => s.id === reviewedSignal.id);

    expect(persistedTask?.enabled).toBe(toggledTask.enabled);
    expect(persistedSignal?.acknowledged).toBe(true);
    expect(afterRestart.notifications.every((n) => n.read)).toBe(true);
  });

  it('UserPreferencesRepository persiste userName, radarPrefs e estado VPS com incremento atômico de revisão', async () => {
    const prefsRepo = new UserPreferencesRepository();
    const initial = prefsRepo.getSnapshot();
    expect(initial.settings.userName).toBe('Dario Marques');

    await prefsRepo.updateSettings({
      userName: 'Dario Admin',
      vpsBaseUrl: 'https://vps.dario.local',
      preferredProvider: 'qwen_harness',
    });
    await prefsRepo.toggleRadarPreference('conversas_relevantes');
    await prefsRepo.updateRadarPriorityFilter('alta');
    await prefsRepo.updateVpsConnectionStatus('checking');

    // Simula reabertura do app instanciando novo repositório sobre o mesmo localStorage
    const reloadedRepo = new UserPreferencesRepository();
    const snapshot = reloadedRepo.getSnapshot();

    expect(snapshot.settings.userName).toBe('Dario Admin');
    expect(snapshot.settings.preferredProvider).toBe('qwen_harness');
    expect(snapshot.radarPrefs.conversas_relevantes).toBe(true);
    expect(snapshot.radarPriorityFilter).toBe('alta');
    // Estado transitório 'checking' nunca fica travado após reinicialização
    expect(snapshot.connectionState).toBe('unreachable');
    expect(snapshot.diagnostics.revision).toBeGreaterThan(initial.diagnostics.revision);
  });

  it('HttpDarioApiClient valida URL vazia e formato inválido sem simular conexões falsas', async () => {
    const emptyClient = new HttpDarioApiClient('');
    const emptyRes = await emptyClient.checkHealth();
    expect(emptyRes.reachable).toBe(false);
    expect(emptyRes.message).toContain('Nenhum endpoint do Dario OS configurado');

    const invalidClient = new HttpDarioApiClient('url-invalida');
    const invalidRes = await invalidClient.checkHealth();
    expect(invalidRes.reachable).toBe(false);
    expect(invalidRes.message).toContain('URL do Dario OS inválida');
  });

  it('HttpDarioApiClient valida número de telefone e não gera código de pareamento falso sem Dario OS', async () => {
    const client = new HttpDarioApiClient('');

    const badPhoneRes = await client.requestWhatsAppPairingCode({
      phone_number: '123',
      provider: 'linked_device_pairing_code',
      default_agent_id: 'gemeos',
    });
    expect(badPhoneRes.ok).toBe(false);
    expect(badPhoneRes.ephemeral_pairing_code).toBeUndefined();
    expect(badPhoneRes.message).toContain('Número de telefone inválido');

    const unconfiguredVpsRes = await client.requestWhatsAppPairingCode({
      phone_number: '+55 (11) 99999-8888',
      provider: 'linked_device_pairing_code',
      default_agent_id: 'croma',
    });
    expect(unconfiguredVpsRes.ok).toBe(false);
    expect(unconfiguredVpsRes.ephemeral_pairing_code).toBeUndefined();
    expect(unconfiguredVpsRes.message).toContain('Nenhum código de pareamento fictício foi gerado');
  });

  it('Isolamento entre Instâncias: cada instalação (instance_id + agent_id) mantém banco IndexedDB físico independente sem misturar conversas', async () => {
    const repoPersonal = new LocalPersistenceRepository('inst-default-gemeos', 'gemeos');
    const statePersonal = await repoPersonal.initializeAndLoad();

    // Instância pessoal (Gêmeos) só recebe seed do agente gemeos
    expect(statePersonal.conversations.every((c) => c.assistantId === 'gemeos')).toBe(true);

    // Adiciona uma conversa privada exclusiva no celular pessoal (Gêmeos)
    await repoPersonal.saveConversation({
      id: 'conv-private-gemeos-only',
      title: 'Planejamento Familiar Privado',
      subject: 'Pessoal',
      assistantId: 'gemeos',
      updatedAt: 'Agora',
      unreadCount: 0,
      archived: false,
      isolatedContextKey: 'ctx_gemeos_private_1',
      isDemo: true,
      messages: [
        {
          id: 'm-priv-1',
          sender: 'user',
          content: 'Dado estritamente pessoal do celular Gêmeos',
          timestamp: '11:00',
        },
      ],
    });

    // Instancia banco de outra instalação independente (Celular da Loja -> Croma)
    const repoStore = new LocalPersistenceRepository('inst-store-croma', 'croma');
    const stateStore = await repoStore.initializeAndLoad();

    expect(repoStore.getDatabaseName()).toBe('dario_assistant_room_db_v1__inst-store-croma');
    expect(repoPersonal.getDatabaseName()).toBe('dario_assistant_room_db_v1');

    // A instância Croma possui apenas conversas do agente Croma e NUNCA enxerga a conversa privada do Gêmeos
    expect(stateStore.conversations.every((c) => c.assistantId === 'croma')).toBe(true);
    expect(stateStore.conversations.some((c) => c.id === 'conv-private-gemeos-only')).toBe(false);
  });

  it('UserPreferencesRepository suporta troca autorizada de instância/agente e seleção de modelos (Gemma, Nemotron, Qwen) sem alterar a identidade do agente', async () => {
    const prefs = new UserPreferencesRepository();
    const initial = prefs.getSnapshot();

    // Por padrão, a instalação inicia com Gêmeos (Prioridade #1 no celular pessoal)
    expect(initial.settings.primaryAgentId).toBe('gemeos');
    expect(initial.settings.instanceId).toBe('inst-default-gemeos');

    // Troca de modelo primário e secundário (Gemma Local + Nemotron) preserva agente e instância
    await prefs.updateSettings({
      preferredProvider: 'gemma_local',
      secondaryModel: 'nemotron',
      localAndroidInferenceEnabled: true,
      boundGmailAccount: 'dario@pessoal.com',
      boundOutlookAccount: 'dario@outlook.com',
    });

    const afterModelSwitch = prefs.getSnapshot();
    expect(afterModelSwitch.settings.primaryAgentId).toBe('gemeos');
    expect(afterModelSwitch.settings.instanceId).toBe('inst-default-gemeos');
    expect(afterModelSwitch.settings.preferredProvider).toBe('gemma_local');
    expect(afterModelSwitch.settings.secondaryModel).toBe('nemotron');
    expect(afterModelSwitch.settings.localAndroidInferenceEnabled).toBe(true);

    // Reconfiguração autorizada para o aparelho da loja (Croma)
    const afterReconfig = await prefs.reconfigureInstanceAgent('croma');
    expect(afterReconfig.settings.primaryAgentId).toBe('croma');
    expect(afterReconfig.settings.instanceId).toBe('inst-store-croma');
    expect(afterReconfig.settings.deviceLabel).toContain('Croma');
    // Ao trocar de instalação, contas vinculadas anteriores são limpas para evitar vazamento entre aparelhos
    expect(afterReconfig.settings.boundGmailAccount).toBe('');
    expect(afterReconfig.settings.boundOutlookAccount).toBe('');
  });

  it('Fase 2 PWA: manifest.webmanifest e ícones (192x192, 512x512, maskable, apple-touch-icon) estão válidos para instalação Android', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const manifestPath = path.resolve(process.cwd(), 'public/manifest.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.id).toBe('/');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.theme_color).toBe('#07090B');
    expect(manifest.background_color).toBe('#07090B');
    expect(manifest.share_target?.action).toBe('/?share-target=1');

    const sizes = manifest.icons.map((i: { sizes: string; purpose: string }) => `${i.sizes}:${i.purpose}`);
    expect(sizes).toContain('192x192:any');
    expect(sizes).toContain('512x512:any');
    expect(sizes).toContain('512x512:maskable');

    for (const file of [
      'public/pwa-192x192.png',
      'public/pwa-512x512.png',
      'public/pwa-maskable-512x512.png',
      'public/apple-touch-icon.png',
      'public/icon.svg',
    ]) {
      const fullPath = path.resolve(process.cwd(), file);
      expect(fs.existsSync(fullPath)).toBe(true);
      expect(fs.statSync(fullPath).size).toBeGreaterThan(100);
    }
  });

  it('Fase 2 PWA: captura evento beforeinstallprompt e aciona prompt() nativo do Android ao clicar em Instalar Dario', async () => {
    const pwaModule = await import('../../pwa/usePWAInstall');

    // Simula ambiente de janela (browser Android Chrome) caso estejamos em Node puro
    const listeners = new Map<string, Array<(e: Event) => void>>();
    const mockWin = {
      navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/131.0', onLine: true },
      matchMedia: () => ({ matches: false, addEventListener: () => {} }),
      addEventListener: (type: string, cb: (e: Event) => void) => {
        const list = listeners.get(type) ?? [];
        list.push(cb);
        listeners.set(type, list);
      },
      removeEventListener: () => {},
    };

    Object.defineProperty(globalThis, 'window', {
      value: mockWin,
      configurable: true,
      writable: true,
    });

    pwaModule.resetPWAInstallTestState();
    pwaModule.initPWAInstallListeners();

    let promptCalled = false;
    const fakeBeforeInstallPromptEvent = {
      preventDefault: () => {},
      prompt: async () => {
        promptCalled = true;
      },
      userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
    } as unknown as Event;

    // Dispara o evento beforeinstallprompt simulado
    for (const handler of listeners.get('beforeinstallprompt') ?? []) {
      handler(fakeBeforeInstallPromptEvent);
    }

    const outcome = await pwaModule.triggerNativeInstallPrompt();
    expect(promptCalled).toBe(true);
    expect(outcome).toBe('accepted');
  });
});
