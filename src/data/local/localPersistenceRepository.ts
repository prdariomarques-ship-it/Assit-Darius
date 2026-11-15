import {
  ArtifactItem,
  ConversationThread,
  DarioAgentId,
  NotificationItem,
  RadarSignal,
  ScheduledTask,
} from '../../domain/models';
import {
  DEMO_ARTIFACTS,
  DEMO_CONVERSATIONS,
  DEMO_NOTIFICATIONS,
  DEMO_RADAR_SIGNALS,
  DEMO_SCHEDULED_TASKS,
  getSeedConversationsForAgent,
} from '../demoRepository';
import {
  ArtifactDao,
  ConversationDao,
  DarioRoomDatabase,
  DB_VERSION,
  DEFAULT_INSTANCE_ID,
  NotificationDao,
  RadarSignalDao,
  ScheduledTaskDao,
  TABLES,
} from './daos';
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
} from './entities';

export interface LocalDatabaseDiagnostics {
  engine: string;
  instanceId: string;
  agentId: DarioAgentId;
  schemaVersion: number;
  conversationsCount: number;
  messagesCount: number;
  artifactsCount: number;
  scheduledTasksCount: number;
  radarSignalsCount: number;
  notificationsCount: number;
  lastSyncedAt: string;
}

export class LocalPersistenceRepository {
  private db: DarioRoomDatabase;
  private conversationDao: ConversationDao;
  private artifactDao: ArtifactDao;
  private scheduledTaskDao: ScheduledTaskDao;
  private radarSignalDao: RadarSignalDao;
  private notificationDao: NotificationDao;
  private instanceId: string;
  private agentId: DarioAgentId;

  constructor(
    instanceId: string = DEFAULT_INSTANCE_ID,
    agentId: DarioAgentId = 'gemeos'
  ) {
    this.instanceId = instanceId;
    this.agentId = agentId;
    this.db = DarioRoomDatabase.forInstance(instanceId);
    this.conversationDao = new ConversationDao(this.db);
    this.artifactDao = new ArtifactDao(this.db);
    this.scheduledTaskDao = new ScheduledTaskDao(this.db);
    this.radarSignalDao = new RadarSignalDao(this.db);
    this.notificationDao = new NotificationDao(this.db);
  }

  /**
   * Switches the active installation context (`instance_id` + `agent_id`),
   * binding all DAOs to that installation's physically isolated IndexedDB database.
   */
  setActiveInstance(instanceId: string, agentId: DarioAgentId): void {
    this.instanceId = instanceId.trim() || DEFAULT_INSTANCE_ID;
    this.agentId = agentId;
    this.db = DarioRoomDatabase.forInstance(this.instanceId);
    this.conversationDao = new ConversationDao(this.db);
    this.artifactDao = new ArtifactDao(this.db);
    this.scheduledTaskDao = new ScheduledTaskDao(this.db);
    this.radarSignalDao = new RadarSignalDao(this.db);
    this.notificationDao = new NotificationDao(this.db);
  }

  getActiveInstanceId(): string {
    return this.instanceId;
  }

  getActiveAgentId(): DarioAgentId {
    return this.agentId;
  }

  getDatabaseName(): string {
    return this.db.getDatabaseName();
  }

  private async isSeedKeyPresent(key: string): Promise<boolean> {
    const idb = await this.db.open();
    return new Promise((resolve) => {
      const tx = idb.transaction(TABLES.META, 'readonly');
      const req = tx.objectStore(TABLES.META).get(key);
      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => resolve(false);
    });
  }

  private async markSeedKey(key: string): Promise<void> {
    const idb = await this.db.open();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(TABLES.META, 'readwrite');
      tx.objectStore(TABLES.META).put({
        key,
        value: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async initializeAndLoad(): Promise<{
    conversations: ConversationThread[];
    artifacts: ArtifactItem[];
    scheduledTasks: ScheduledTask[];
    radarSignals: RadarSignal[];
    notifications: NotificationItem[];
    diagnostics: LocalDatabaseDiagnostics;
  }> {
    const seededV1 = await this.isSeedKeyPresent('initial_seed_v1');
    if (!seededV1) {
      await this.seedV1Defaults();
      await this.markSeedKey('initial_seed_v1');
    }

    const seededV2 = await this.isSeedKeyPresent('initial_seed_v2');
    if (!seededV2) {
      await this.seedV2Defaults();
      await this.markSeedKey('initial_seed_v2');
    }

    const [
      convBundles,
      artifactEntities,
      scheduledEntities,
      radarEntities,
      notificationEntities,
    ] = await Promise.all([
      this.conversationDao.getAllConversationsWithMessages(),
      this.artifactDao.getAllArtifacts(),
      this.scheduledTaskDao.getAllScheduledTasks(),
      this.radarSignalDao.getAllRadarSignals(),
      this.notificationDao.getAllNotifications(),
    ]);

    const conversations = convBundles.map(mapEntitiesToConversation);
    const artifacts = artifactEntities.map(mapEntityToArtifact);
    const scheduledTasks = scheduledEntities.map(mapEntityToScheduledTask);
    const radarSignals = radarEntities.map(mapEntityToRadarSignal);
    const notifications = notificationEntities.map(mapEntityToNotification);
    const diagnostics = await this.getDiagnostics();

    return {
      conversations,
      artifacts,
      scheduledTasks,
      radarSignals,
      notifications,
      diagnostics,
    };
  }

  private async seedV1Defaults(): Promise<void> {
    const baseTime = Date.now();
    const seedConvs = getSeedConversationsForAgent(this.agentId);

    for (let i = 0; i < seedConvs.length; i++) {
      const conv = seedConvs[i];
      const entities = mapConversationToEntities(conv, baseTime - i * 60_000);
      await this.conversationDao.upsertConversationWithMessages(entities);
    }

    for (let i = 0; i < DEMO_ARTIFACTS.length; i++) {
      const art = DEMO_ARTIFACTS[i];
      const entity = mapArtifactToEntity(art, baseTime - i * 60_000);
      await this.artifactDao.upsertArtifact(entity);
    }
  }

  private async seedV2Defaults(): Promise<void> {
    const baseTime = Date.now();
    for (let i = 0; i < DEMO_SCHEDULED_TASKS.length; i++) {
      const task = DEMO_SCHEDULED_TASKS[i];
      const entity = mapScheduledTaskToEntity(task, baseTime - i * 60_000);
      await this.scheduledTaskDao.upsertScheduledTask(entity);
    }

    for (let i = 0; i < DEMO_RADAR_SIGNALS.length; i++) {
      const signal = DEMO_RADAR_SIGNALS[i];
      const entity = mapRadarSignalToEntity(signal, baseTime - i * 60_000);
      await this.radarSignalDao.upsertRadarSignal(entity);
    }

    for (let i = 0; i < DEMO_NOTIFICATIONS.length; i++) {
      const notif = DEMO_NOTIFICATIONS[i];
      const entity = mapNotificationToEntity(notif, baseTime - i * 60_000);
      await this.notificationDao.upsertNotification(entity);
    }
  }

  async saveConversation(
    thread: ConversationThread,
    sortTimestampMs = Date.now()
  ): Promise<LocalDatabaseDiagnostics> {
    const bundle = mapConversationToEntities(thread, sortTimestampMs);
    await this.conversationDao.upsertConversationWithMessages(bundle);
    return this.getDiagnostics();
  }

  async deleteConversation(id: string): Promise<LocalDatabaseDiagnostics> {
    await this.conversationDao.deleteConversationById(id);
    return this.getDiagnostics();
  }

  async saveArtifact(
    artifact: ArtifactItem,
    createdAtMs = Date.now()
  ): Promise<LocalDatabaseDiagnostics> {
    const entity = mapArtifactToEntity(artifact, createdAtMs);
    await this.artifactDao.upsertArtifact(entity);
    return this.getDiagnostics();
  }

  async deleteArtifact(id: string): Promise<LocalDatabaseDiagnostics> {
    await this.artifactDao.deleteArtifactById(id);
    return this.getDiagnostics();
  }

  async saveScheduledTask(
    task: ScheduledTask,
    sortOrderMs = Date.now()
  ): Promise<LocalDatabaseDiagnostics> {
    const entity = mapScheduledTaskToEntity(task, sortOrderMs);
    await this.scheduledTaskDao.upsertScheduledTask(entity);
    return this.getDiagnostics();
  }

  async deleteScheduledTask(id: string): Promise<LocalDatabaseDiagnostics> {
    await this.scheduledTaskDao.deleteScheduledTaskById(id);
    return this.getDiagnostics();
  }

  async saveRadarSignal(
    signal: RadarSignal,
    sortOrderMs = Date.now()
  ): Promise<LocalDatabaseDiagnostics> {
    const entity = mapRadarSignalToEntity(signal, sortOrderMs);
    await this.radarSignalDao.upsertRadarSignal(entity);
    return this.getDiagnostics();
  }

  async saveNotification(
    notification: NotificationItem,
    sortOrderMs = Date.now()
  ): Promise<LocalDatabaseDiagnostics> {
    const entity = mapNotificationToEntity(notification, sortOrderMs);
    await this.notificationDao.upsertNotification(entity);
    return this.getDiagnostics();
  }

  async markAllNotificationsRead(): Promise<LocalDatabaseDiagnostics> {
    await this.notificationDao.markAllAsRead();
    return this.getDiagnostics();
  }

  async resetToInitialSeed(): Promise<{
    conversations: ConversationThread[];
    artifacts: ArtifactItem[];
    scheduledTasks: ScheduledTask[];
    radarSignals: RadarSignal[];
    notifications: NotificationItem[];
    diagnostics: LocalDatabaseDiagnostics;
  }> {
    const idb = await this.db.open();
    await new Promise<void>((resolve, reject) => {
      const tx = idb.transaction(
        [
          TABLES.CONVERSATIONS,
          TABLES.MESSAGES,
          TABLES.ARTIFACTS,
          TABLES.SCHEDULED_TASKS,
          TABLES.RADAR_SIGNALS,
          TABLES.NOTIFICATIONS,
          TABLES.META,
        ],
        'readwrite'
      );
      tx.objectStore(TABLES.CONVERSATIONS).clear();
      tx.objectStore(TABLES.MESSAGES).clear();
      tx.objectStore(TABLES.ARTIFACTS).clear();
      tx.objectStore(TABLES.SCHEDULED_TASKS).clear();
      tx.objectStore(TABLES.RADAR_SIGNALS).clear();
      tx.objectStore(TABLES.NOTIFICATIONS).clear();
      tx.objectStore(TABLES.META).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    await this.seedV1Defaults();
    await this.markSeedKey('initial_seed_v1');
    await this.seedV2Defaults();
    await this.markSeedKey('initial_seed_v2');
    return this.initializeAndLoad();
  }

  async getDiagnostics(): Promise<LocalDatabaseDiagnostics> {
    const [convBundles, artifacts, scheduledTasks, radarSignals, notifications] =
      await Promise.all([
        this.conversationDao.getAllConversationsWithMessages(),
        this.artifactDao.getAllArtifacts(),
        this.scheduledTaskDao.getAllScheduledTasks(),
        this.radarSignalDao.getAllRadarSignals(),
        this.notificationDao.getAllNotifications(),
      ]);

    const messagesCount = convBundles.reduce((acc, item) => acc + item.messages.length, 0);

    return {
      engine: `IndexedDB (${this.db.getDatabaseName()})`,
      instanceId: this.instanceId,
      agentId: this.agentId,
      schemaVersion: DB_VERSION,
      conversationsCount: convBundles.length,
      messagesCount,
      artifactsCount: artifacts.length,
      scheduledTasksCount: scheduledTasks.length,
      radarSignalsCount: radarSignals.length,
      notificationsCount: notifications.length,
      lastSyncedAt: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  }
}

export const localPersistenceRepository = new LocalPersistenceRepository();
