import {
  ArtifactEntity,
  ConversationEntity,
  ConversationMessageEntity,
  ConversationWithMessages,
  NotificationEntity,
  RadarSignalEntity,
  ScheduledTaskEntity,
} from './entities';

export const DEFAULT_INSTANCE_ID = 'inst-default-gemeos';
export const DB_NAME = 'dario_assistant_room_db_v1';
export const DB_VERSION = 2;

export function getDatabaseNameForInstance(instanceId?: string): string {
  const clean = instanceId?.trim();
  if (!clean || clean === DEFAULT_INSTANCE_ID) {
    return DB_NAME;
  }
  return `${DB_NAME}__${clean}`;
}

export const TABLES = {
  CONVERSATIONS: 'conversations',
  MESSAGES: 'conversation_messages',
  ARTIFACTS: 'artifacts',
  SCHEDULED_TASKS: 'scheduled_tasks',
  RADAR_SIGNALS: 'radar_signals',
  NOTIFICATIONS: 'notifications',
  META: 'room_meta',
} as const;

export interface RoomMetaRecord {
  key: string;
  value: string;
}

/**
 * IndexedDB transactional engine with physical database isolation per installation (`instance_id`).
 */
export class DarioRoomDatabase {
  private static instances = new Map<string, DarioRoomDatabase>();
  private dbPromise: Promise<IDBDatabase> | null = null;
  private readonly dbName: string;

  constructor(private readonly instanceId: string = DEFAULT_INSTANCE_ID) {
    this.dbName = getDatabaseNameForInstance(instanceId);
  }

  static getInstance(): DarioRoomDatabase {
    return DarioRoomDatabase.forInstance(DEFAULT_INSTANCE_ID);
  }

  static forInstance(instanceId: string = DEFAULT_INSTANCE_ID): DarioRoomDatabase {
    const key = instanceId.trim() || DEFAULT_INSTANCE_ID;
    let instance = DarioRoomDatabase.instances.get(key);
    if (!instance) {
      instance = new DarioRoomDatabase(key);
      DarioRoomDatabase.instances.set(key, instance);
    }
    return instance;
  }

  getDatabaseName(): string {
    return this.dbName;
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  async closeAndResetConnection(): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      db.close();
      this.dbPromise = null;
    }
  }

  static async closeAllConnections(): Promise<void> {
    for (const db of DarioRoomDatabase.instances.values()) {
      await db.closeAndResetConnection();
    }
    DarioRoomDatabase.instances.clear();
  }

  open(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const idbFactory = globalThis.indexedDB;
      if (!idbFactory) {
        reject(new Error('IndexedDB não está disponível neste ambiente'));
        return;
      }

      const request = idbFactory.open(this.dbName, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(TABLES.CONVERSATIONS)) {
          const convStore = db.createObjectStore(TABLES.CONVERSATIONS, { keyPath: 'id' });
          convStore.createIndex('idx_archived', 'archived', { unique: false });
          convStore.createIndex('idx_sortTimestampMs', 'sortTimestampMs', { unique: false });
        }

        if (!db.objectStoreNames.contains(TABLES.MESSAGES)) {
          const msgStore = db.createObjectStore(TABLES.MESSAGES, { keyPath: 'id' });
          msgStore.createIndex('idx_conversationId', 'conversationId', { unique: false });
        }

        if (!db.objectStoreNames.contains(TABLES.ARTIFACTS)) {
          const artStore = db.createObjectStore(TABLES.ARTIFACTS, { keyPath: 'id' });
          artStore.createIndex('idx_format', 'format', { unique: false });
          artStore.createIndex('idx_createdAtMs', 'createdAtMs', { unique: false });
        }

        if (!db.objectStoreNames.contains(TABLES.SCHEDULED_TASKS)) {
          const schStore = db.createObjectStore(TABLES.SCHEDULED_TASKS, { keyPath: 'id' });
          schStore.createIndex('idx_enabled', 'enabled', { unique: false });
          schStore.createIndex('idx_sortOrderMs', 'sortOrderMs', { unique: false });
        }

        if (!db.objectStoreNames.contains(TABLES.RADAR_SIGNALS)) {
          const radStore = db.createObjectStore(TABLES.RADAR_SIGNALS, { keyPath: 'id' });
          radStore.createIndex('idx_priority', 'priority', { unique: false });
          radStore.createIndex('idx_acknowledged', 'acknowledged', { unique: false });
          radStore.createIndex('idx_sortOrderMs', 'sortOrderMs', { unique: false });
        }

        if (!db.objectStoreNames.contains(TABLES.NOTIFICATIONS)) {
          const notStore = db.createObjectStore(TABLES.NOTIFICATIONS, { keyPath: 'id' });
          notStore.createIndex('idx_read', 'read', { unique: false });
          notStore.createIndex('idx_sortOrderMs', 'sortOrderMs', { unique: false });
        }

        if (!db.objectStoreNames.contains(TABLES.META)) {
          db.createObjectStore(TABLES.META, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error('Falha ao abrir banco local IndexedDB'));
    });

    return this.dbPromise;
  }
}

/**
 * DAO for Conversations and Messages (`@Transaction` + `CASCADE` support)
 */
export class ConversationDao {
  constructor(private readonly database: DarioRoomDatabase) {}

  async getAllConversationsWithMessages(): Promise<ConversationWithMessages[]> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([TABLES.CONVERSATIONS, TABLES.MESSAGES], 'readonly');
      const convStore = tx.objectStore(TABLES.CONVERSATIONS);
      const msgStore = tx.objectStore(TABLES.MESSAGES);

      const convReq = convStore.getAll();
      const msgReq = msgStore.getAll();

      tx.oncomplete = () => {
        const conversations = (convReq.result as ConversationEntity[]).sort(
          (a, b) => b.sortTimestampMs - a.sortTimestampMs
        );
        const allMessages = msgReq.result as ConversationMessageEntity[];

        const grouped = new Map<string, ConversationMessageEntity[]>();
        for (const msg of allMessages) {
          const list = grouped.get(msg.conversationId) ?? [];
          list.push(msg);
          grouped.set(msg.conversationId, list);
        }

        const result: ConversationWithMessages[] = conversations.map((conversation) => ({
          conversation,
          messages: (grouped.get(conversation.id) ?? []).sort(
            (a, b) => a.sequenceOrder - b.sequenceOrder
          ),
        }));
        resolve(result);
      };

      tx.onerror = () => reject(tx.error ?? new Error('Erro ao ler conversas do IndexedDB'));
    });
  }

  async upsertConversationWithMessages(bundle: ConversationWithMessages): Promise<void> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([TABLES.CONVERSATIONS, TABLES.MESSAGES], 'readwrite');
      const convStore = tx.objectStore(TABLES.CONVERSATIONS);
      const msgStore = tx.objectStore(TABLES.MESSAGES);
      const msgIndex = msgStore.index('idx_conversationId');

      convStore.put(bundle.conversation);

      const existingKeysReq = msgIndex.getAllKeys(IDBKeyRange.only(bundle.conversation.id));
      existingKeysReq.onsuccess = () => {
        for (const key of existingKeysReq.result) {
          msgStore.delete(key);
        }
        for (const msg of bundle.messages) {
          msgStore.put(msg);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Erro ao salvar conversa no banco local'));
    });
  }

  async deleteConversationById(conversationId: string): Promise<void> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([TABLES.CONVERSATIONS, TABLES.MESSAGES], 'readwrite');
      const convStore = tx.objectStore(TABLES.CONVERSATIONS);
      const msgStore = tx.objectStore(TABLES.MESSAGES);
      const msgIndex = msgStore.index('idx_conversationId');

      convStore.delete(conversationId);

      const keysReq = msgIndex.getAllKeys(IDBKeyRange.only(conversationId));
      keysReq.onsuccess = () => {
        for (const key of keysReq.result) {
          msgStore.delete(key);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Erro ao excluir conversa do banco local'));
    });
  }
}

/**
 * DAO for Artifacts
 */
export class ArtifactDao {
  constructor(private readonly database: DarioRoomDatabase) {}

  async getAllArtifacts(): Promise<ArtifactEntity[]> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLES.ARTIFACTS, 'readonly');
      const store = tx.objectStore(TABLES.ARTIFACTS);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = (req.result as ArtifactEntity[]).sort(
          (a, b) => b.createdAtMs - a.createdAtMs
        );
        resolve(list);
      };
      req.onerror = () => reject(req.error ?? new Error('Erro ao listar artefatos do banco local'));
    });
  }

  async upsertArtifact(entity: ArtifactEntity): Promise<void> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLES.ARTIFACTS, 'readwrite');
      tx.objectStore(TABLES.ARTIFACTS).put(entity);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Erro ao persistir artefato no banco local'));
    });
  }

  async deleteArtifactById(artifactId: string): Promise<void> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLES.ARTIFACTS, 'readwrite');
      tx.objectStore(TABLES.ARTIFACTS).delete(artifactId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Erro ao excluir artefato do banco local'));
    });
  }
}

/**
 * DAO for Scheduled Tasks
 */
export class ScheduledTaskDao {
  constructor(private readonly database: DarioRoomDatabase) {}

  async getAllScheduledTasks(): Promise<ScheduledTaskEntity[]> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLES.SCHEDULED_TASKS, 'readonly');
      const req = tx.objectStore(TABLES.SCHEDULED_TASKS).getAll();
      req.onsuccess = () => {
        const list = (req.result as ScheduledTaskEntity[]).sort(
          (a, b) => b.sortOrderMs - a.sortOrderMs
        );
        resolve(list);
      };
      req.onerror = () =>
        reject(req.error ?? new Error('Erro ao listar agendamentos do banco local'));
    });
  }

  async upsertScheduledTask(entity: ScheduledTaskEntity): Promise<void> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLES.SCHEDULED_TASKS, 'readwrite');
      tx.objectStore(TABLES.SCHEDULED_TASKS).put(entity);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error('Erro ao salvar agendamento no banco local'));
    });
  }

  async deleteScheduledTaskById(taskId: string): Promise<void> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLES.SCHEDULED_TASKS, 'readwrite');
      tx.objectStore(TABLES.SCHEDULED_TASKS).delete(taskId);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error('Erro ao excluir agendamento do banco local'));
    });
  }
}

/**
 * DAO for Radar Signals (including acknowledged review state)
 */
export class RadarSignalDao {
  constructor(private readonly database: DarioRoomDatabase) {}

  async getAllRadarSignals(): Promise<RadarSignalEntity[]> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLES.RADAR_SIGNALS, 'readonly');
      const req = tx.objectStore(TABLES.RADAR_SIGNALS).getAll();
      req.onsuccess = () => {
        const list = (req.result as RadarSignalEntity[]).sort(
          (a, b) => b.sortOrderMs - a.sortOrderMs
        );
        resolve(list);
      };
      req.onerror = () =>
        reject(req.error ?? new Error('Erro ao listar sinais do Radar no banco local'));
    });
  }

  async upsertRadarSignal(entity: RadarSignalEntity): Promise<void> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLES.RADAR_SIGNALS, 'readwrite');
      tx.objectStore(TABLES.RADAR_SIGNALS).put(entity);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error('Erro ao atualizar sinal do Radar no banco local'));
    });
  }
}

/**
 * DAO for Notifications (including read state)
 */
export class NotificationDao {
  constructor(private readonly database: DarioRoomDatabase) {}

  async getAllNotifications(): Promise<NotificationEntity[]> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLES.NOTIFICATIONS, 'readonly');
      const req = tx.objectStore(TABLES.NOTIFICATIONS).getAll();
      req.onsuccess = () => {
        const list = (req.result as NotificationEntity[]).sort(
          (a, b) => b.sortOrderMs - a.sortOrderMs
        );
        resolve(list);
      };
      req.onerror = () =>
        reject(req.error ?? new Error('Erro ao listar notificações do banco local'));
    });
  }

  async upsertNotification(entity: NotificationEntity): Promise<void> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLES.NOTIFICATIONS, 'readwrite');
      tx.objectStore(TABLES.NOTIFICATIONS).put(entity);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error('Erro ao salvar notificação no banco local'));
    });
  }

  async markAllAsRead(): Promise<void> {
    const db = await this.database.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TABLES.NOTIFICATIONS, 'readwrite');
      const store = tx.objectStore(TABLES.NOTIFICATIONS);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result as NotificationEntity[];
        for (const item of items) {
          store.put({ ...item, read: true });
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error('Erro ao marcar notificações como lidas no banco local'));
    });
  }
}
