import {
  ArtifactFormat,
  ArtifactItem,
  ConversationMessage,
  ConversationThread,
  EpistemicClassification,
  ImplementationPhase,
  NotificationItem,
  PrimaryTab,
  RadarCategory,
  RadarPriority,
  RadarSignal,
  ScheduledExecutionLog,
  ScheduledTask,
  ScheduleFrequency,
} from '../../domain/models';

/**
 * @Entity(tableName = "conversations")
 */
export interface ConversationEntity {
  id: string;
  title: string;
  subject: string;
  assistantId: string;
  updatedAt: string;
  unreadCount: number;
  archived: boolean;
  isolatedContextKey: string;
  isDemo: true;
  sortTimestampMs: number;
}

/**
 * @Entity(
 *   tableName = "conversation_messages",
 *   foreignKeys = [ForeignKey(entity = ConversationEntity::class, parentColumns = ["id"], childColumns = ["conversationId"], onDelete = CASCADE)]
 * )
 */
export interface ConversationMessageEntity {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant' | 'system_notice';
  content: string;
  timestamp: string;
  classification?: EpistemicClassification;
  attachmentLabel?: string;
  sequenceOrder: number;
}

/**
 * @Entity(tableName = "artifacts")
 */
export interface ArtifactEntity {
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
  createdAtMs: number;
}

/**
 * @Entity(tableName = "scheduled_tasks")
 */
export interface ScheduledTaskEntity {
  id: string;
  name: string;
  frequency: ScheduleFrequency;
  scheduleTime: string;
  enabled: boolean;
  requiresConfirmation: boolean;
  lastExecution: ScheduledExecutionLog;
  targetPhase: ImplementationPhase;
  isDemo: true;
  sortOrderMs: number;
}

/**
 * @Entity(tableName = "radar_signals")
 */
export interface RadarSignalEntity {
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
  sortOrderMs: number;
}

/**
 * @Entity(tableName = "notifications")
 */
export interface NotificationEntity {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  read: boolean;
  targetTab: PrimaryTab;
  isDemo: true;
  sortOrderMs: number;
}

/**
 * @Transaction @Relation projection: ConversationWithMessages
 */
export interface ConversationWithMessages {
  conversation: ConversationEntity;
  messages: ConversationMessageEntity[];
}

export function mapConversationToEntities(
  thread: ConversationThread,
  sortTimestampMs = Date.now()
): ConversationWithMessages {
  const conversation: ConversationEntity = {
    id: thread.id,
    title: thread.title,
    subject: thread.subject,
    assistantId: thread.assistantId,
    updatedAt: thread.updatedAt,
    unreadCount: thread.unreadCount,
    archived: thread.archived,
    isolatedContextKey: thread.isolatedContextKey,
    isDemo: true,
    sortTimestampMs,
  };

  const messages: ConversationMessageEntity[] = thread.messages.map((msg, index) => ({
    id: msg.id,
    conversationId: thread.id,
    sender: msg.sender,
    content: msg.content,
    timestamp: msg.timestamp,
    classification: msg.classification,
    attachmentLabel: msg.attachmentLabel,
    sequenceOrder: index,
  }));

  return { conversation, messages };
}

export function mapEntitiesToConversation(
  bundle: ConversationWithMessages
): ConversationThread {
  const sortedMessages: ConversationMessage[] = [...bundle.messages]
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    .map((m) => ({
      id: m.id,
      sender: m.sender,
      content: m.content,
      timestamp: m.timestamp,
      classification: m.classification,
      attachmentLabel: m.attachmentLabel,
    }));

  return {
    id: bundle.conversation.id,
    title: bundle.conversation.title,
    subject: bundle.conversation.subject,
    assistantId: bundle.conversation.assistantId,
    updatedAt: bundle.conversation.updatedAt,
    unreadCount: bundle.conversation.unreadCount,
    archived: bundle.conversation.archived,
    isolatedContextKey: bundle.conversation.isolatedContextKey,
    isDemo: true,
    messages: sortedMessages,
  };
}

export function mapArtifactToEntity(
  item: ArtifactItem,
  createdAtMs = Date.now()
): ArtifactEntity {
  return {
    id: item.id,
    title: item.title,
    format: item.format,
    source: item.source,
    processedAt: item.processedAt,
    confidence: item.confidence,
    extractedPreview: item.extractedPreview,
    errorsFound: item.errorsFound,
    targetPhase: item.targetPhase,
    isDemo: true,
    createdAtMs,
  };
}

export function mapEntityToArtifact(entity: ArtifactEntity): ArtifactItem {
  return {
    id: entity.id,
    title: entity.title,
    format: entity.format,
    source: entity.source,
    processedAt: entity.processedAt,
    confidence: entity.confidence,
    extractedPreview: entity.extractedPreview,
    errorsFound: entity.errorsFound,
    targetPhase: entity.targetPhase,
    isDemo: true,
  };
}

export function mapScheduledTaskToEntity(
  task: ScheduledTask,
  sortOrderMs = Date.now()
): ScheduledTaskEntity {
  return {
    id: task.id,
    name: task.name,
    frequency: task.frequency,
    scheduleTime: task.scheduleTime,
    enabled: task.enabled,
    requiresConfirmation: task.requiresConfirmation,
    lastExecution: { ...task.lastExecution },
    targetPhase: task.targetPhase,
    isDemo: true,
    sortOrderMs,
  };
}

export function mapEntityToScheduledTask(entity: ScheduledTaskEntity): ScheduledTask {
  return {
    id: entity.id,
    name: entity.name,
    frequency: entity.frequency,
    scheduleTime: entity.scheduleTime,
    enabled: entity.enabled,
    requiresConfirmation: entity.requiresConfirmation,
    lastExecution: { ...entity.lastExecution },
    targetPhase: entity.targetPhase,
    isDemo: true,
  };
}

export function mapRadarSignalToEntity(
  signal: RadarSignal,
  sortOrderMs = Date.now()
): RadarSignalEntity {
  return {
    id: signal.id,
    title: signal.title,
    summary: signal.summary,
    category: signal.category,
    priority: signal.priority,
    classification: signal.classification,
    origin: signal.origin,
    detectedAt: signal.detectedAt,
    acknowledged: signal.acknowledged,
    isDemo: true,
    sortOrderMs,
  };
}

export function mapEntityToRadarSignal(entity: RadarSignalEntity): RadarSignal {
  return {
    id: entity.id,
    title: entity.title,
    summary: entity.summary,
    category: entity.category,
    priority: entity.priority,
    classification: entity.classification,
    origin: entity.origin,
    detectedAt: entity.detectedAt,
    acknowledged: entity.acknowledged,
    isDemo: true,
  };
}

export function mapNotificationToEntity(
  notification: NotificationItem,
  sortOrderMs = Date.now()
): NotificationEntity {
  return {
    id: notification.id,
    title: notification.title,
    detail: notification.detail,
    timestamp: notification.timestamp,
    read: notification.read,
    targetTab: notification.targetTab,
    isDemo: true,
    sortOrderMs,
  };
}

export function mapEntityToNotification(entity: NotificationEntity): NotificationItem {
  return {
    id: entity.id,
    title: entity.title,
    detail: entity.detail,
    timestamp: entity.timestamp,
    read: entity.read,
    targetTab: entity.targetTab,
    isDemo: true,
  };
}
