export interface KotlinRoomSourceSnippet {
  id: string;
  filename: string;
  layer: 'Entity' | 'DAO' | 'Database' | 'DataStore' | 'Repository' | 'DI (Hilt)';
  description: string;
  code: string;
}

export const ANDROID_ROOM_KOTLIN_SNIPPETS: KotlinRoomSourceSnippet[] = [
  {
    id: 'jetpack-datastore',
    filename: 'data/preferences/UserPreferencesRepository.kt',
    layer: 'DataStore',
    description: 'Jetpack Preferences DataStore persistindo userName, radarPrefs e estado da conexão VPS com Flow reativo.',
    code: `package com.dario.assistant.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStoreFile
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

data class RadarMonitoringPreferences(
    val emailsSemResposta: Boolean = true,
    val compromissos: Boolean = true,
    val documentosPendentes: Boolean = true,
    val tarefasAtrasadas: Boolean = true,
    val conversasRelevantes: Boolean = false
)

data class UserPreferences(
    val userName: String,
    val vpsBaseUrl: String,
    val wsEndpointUrl: String,
    val requestTimeoutMs: Int,
    val preferredProvider: String,
    val preferredWritingStyle: String,
    val requireConfirmationForSensitiveActions: Boolean,
    val connectionState: String,
    val lastHealthMessage: String?,
    val lastHealthCheckedAt: String?,
    val radarPrefs: RadarMonitoringPreferences
)

@Singleton
class UserPreferencesRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    private object Keys {
        val USER_NAME = stringPreferencesKey("pref_str_user_name")
        val VPS_BASE_URL = stringPreferencesKey("pref_str_vps_base_url")
        val WS_ENDPOINT_URL = stringPreferencesKey("pref_str_ws_endpoint_url")
        val REQUEST_TIMEOUT_MS = intPreferencesKey("pref_int_request_timeout_ms")
        val PREFERRED_PROVIDER = stringPreferencesKey("pref_str_preferred_provider")
        val PREFERRED_WRITING_STYLE = stringPreferencesKey("pref_str_preferred_writing_style")
        val REQUIRE_CONFIRMATION = booleanPreferencesKey("pref_bool_require_confirmation_sensitive")

        val VPS_CONNECTION_STATE = stringPreferencesKey("pref_str_vps_connection_state")
        val VPS_LAST_HEALTH_MESSAGE = stringPreferencesKey("pref_str_vps_last_health_message")
        val VPS_LAST_HEALTH_CHECKED_AT = stringPreferencesKey("pref_str_vps_last_health_checked_at")

        val RADAR_EMAILS = booleanPreferencesKey("pref_bool_radar_emails_sem_resposta")
        val RADAR_COMPROMISSOS = booleanPreferencesKey("pref_bool_radar_compromissos")
        val RADAR_DOCUMENTOS = booleanPreferencesKey("pref_bool_radar_documentos_pendentes")
        val RADAR_TAREFAS = booleanPreferencesKey("pref_bool_radar_tarefas_atrasadas")
        val RADAR_CONVERSAS = booleanPreferencesKey("pref_bool_radar_conversas_relevantes")
    }

    val userPreferencesFlow: Flow<UserPreferences> = dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { prefs ->
            UserPreferences(
                userName = prefs[Keys.USER_NAME] ?: "Dario Marques",
                vpsBaseUrl = prefs[Keys.VPS_BASE_URL] ?: "",
                wsEndpointUrl = prefs[Keys.WS_ENDPOINT_URL] ?: "",
                requestTimeoutMs = prefs[Keys.REQUEST_TIMEOUT_MS] ?: 4000,
                preferredProvider = prefs[Keys.PREFERRED_PROVIDER] ?: "gemini",
                preferredWritingStyle = prefs[Keys.PREFERRED_WRITING_STYLE] ?: "profissional",
                requireConfirmationForSensitiveActions = prefs[Keys.REQUIRE_CONFIRMATION] ?: true,
                connectionState = prefs[Keys.VPS_CONNECTION_STATE] ?: "disconnected_demo",
                lastHealthMessage = prefs[Keys.VPS_LAST_HEALTH_MESSAGE],
                lastHealthCheckedAt = prefs[Keys.VPS_LAST_HEALTH_CHECKED_AT],
                radarPrefs = RadarMonitoringPreferences(
                    emailsSemResposta = prefs[Keys.RADAR_EMAILS] ?: true,
                    compromissos = prefs[Keys.RADAR_COMPROMISSOS] ?: true,
                    documentosPendentes = prefs[Keys.RADAR_DOCUMENTOS] ?: true,
                    tarefasAtrasadas = prefs[Keys.RADAR_TAREFAS] ?: true,
                    conversasRelevantes = prefs[Keys.RADAR_CONVERSAS] ?: false
                )
            )
        }

    suspend fun updateUserName(name: String) {
        dataStore.edit { it[Keys.USER_NAME] = name }
    }

    suspend fun updateVpsConnectionState(state: String, message: String?, checkedAt: String?) {
        dataStore.edit { prefs ->
            prefs[Keys.VPS_CONNECTION_STATE] = state
            if (message != null) prefs[Keys.VPS_LAST_HEALTH_MESSAGE] = message
            if (checkedAt != null) prefs[Keys.VPS_LAST_HEALTH_CHECKED_AT] = checkedAt
        }
    }

    suspend fun toggleRadarPreference(category: String) {
        dataStore.edit { prefs ->
            when (category) {
                "emails_sem_resposta" -> prefs[Keys.RADAR_EMAILS] = !(prefs[Keys.RADAR_EMAILS] ?: true)
                "compromissos" -> prefs[Keys.RADAR_COMPROMISSOS] = !(prefs[Keys.RADAR_COMPROMISSOS] ?: true)
                "documentos_pendentes" -> prefs[Keys.RADAR_DOCUMENTOS] = !(prefs[Keys.RADAR_DOCUMENTOS] ?: true)
                "tarefas_atrasadas" -> prefs[Keys.RADAR_TAREFAS] = !(prefs[Keys.RADAR_TAREFAS] ?: true)
                "conversas_relevantes" -> prefs[Keys.RADAR_CONVERSAS] = !(prefs[Keys.RADAR_CONVERSAS] ?: false)
            }
        }
    }
}

@Module
@InstallIn(SingletonComponent::class)
object DataStoreModule {
    @Provides
    @Singleton
    fun providePreferencesDataStore(@ApplicationContext context: Context): DataStore<Preferences> {
        return PreferenceDataStoreFactory.create(
            produceFile = { context.preferencesDataStoreFile("dario_user_preferences") }
        )
    }
}`,
  },
  {
    id: 'room-entities',
    filename: 'data/local/entity/RoomEntities.kt',
    layer: 'Entity',
    description: 'Entidades @Entity para conversas, mensagens (com ForeignKey CASCADE) e artefatos.',
    code: `package com.dario.assistant.data.local.entity

import androidx.room.Embedded
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import androidx.room.Relation

@Entity(
    tableName = "conversations",
    indices = [
        Index(value = ["archived"]),
        Index(value = ["sortTimestampMs"])
    ]
)
data class ConversationEntity(
    @PrimaryKey val id: String,
    val title: String,
    val subject: String,
    val assistantId: String,
    val updatedAt: String,
    val unreadCount: Int,
    val archived: Boolean,
    val isolatedContextKey: String,
    val isDemo: Boolean = true,
    val sortTimestampMs: Long
)

@Entity(
    tableName = "conversation_messages",
    foreignKeys = [
        ForeignKey(
            entity = ConversationEntity::class,
            parentColumns = ["id"],
            childColumns = ["conversationId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["conversationId"])]
)
data class ConversationMessageEntity(
    @PrimaryKey val id: String,
    val conversationId: String,
    val sender: String,
    val content: String,
    val timestamp: String,
    val classification: String?,
    val attachmentLabel: String?,
    val sequenceOrder: Int
)

data class ConversationWithMessagesRelation(
    @Embedded val conversation: ConversationEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "conversationId"
    )
    val messages: List<ConversationMessageEntity>
)

@Entity(
    tableName = "artifacts",
    indices = [
        Index(value = ["format"]),
        Index(value = ["createdAtMs"])
    ]
)
data class ArtifactEntity(
    @PrimaryKey val id: String,
    val title: String,
    val format: String,
    val source: String,
    val processedAt: String,
    val confidence: Double,
    val extractedPreview: String,
    val errorsFound: String?,
    val targetPhase: String,
    val isDemo: Boolean = true,
    val createdAtMs: Long
)`,
  },
  {
    id: 'room-daos',
    filename: 'data/local/dao/DarioDaos.kt',
    layer: 'DAO',
    description: 'Interfaces @Dao reativas com Flow<List<...>> e transações atômicas.',
    code: `package com.dario.assistant.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import com.dario.assistant.data.local.entity.ArtifactEntity
import com.dario.assistant.data.local.entity.ConversationEntity
import com.dario.assistant.data.local.entity.ConversationMessageEntity
import com.dario.assistant.data.local.entity.ConversationWithMessagesRelation
import kotlinx.coroutines.flow.Flow

@Dao
interface ConversationDao {

    @Transaction
    @Query("SELECT * FROM conversations ORDER BY sortTimestampMs DESC")
    fun observeConversationsWithMessages(): Flow<List<ConversationWithMessagesRelation>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertConversation(conversation: ConversationEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessages(messages: List<ConversationMessageEntity>)

    @Query("DELETE FROM conversation_messages WHERE conversationId = :conversationId")
    suspend fun deleteMessagesForConversation(conversationId: String)

    @Transaction
    suspend fun upsertConversationWithMessages(
        conversation: ConversationEntity,
        messages: List<ConversationMessageEntity>
    ) {
        upsertConversation(conversation)
        deleteMessagesForConversation(conversation.id)
        insertMessages(messages)
    }

    @Query("DELETE FROM conversations WHERE id = :conversationId")
    suspend fun deleteConversationById(conversationId: String)
}

@Dao
interface ArtifactDao {

    @Query("SELECT * FROM artifacts ORDER BY createdAtMs DESC")
    fun observeArtifacts(): Flow<List<ArtifactEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertArtifact(artifact: ArtifactEntity)

    @Query("DELETE FROM artifacts WHERE id = :artifactId")
    suspend fun deleteArtifactById(artifactId: String)
}`,
  },
  {
    id: 'room-database',
    filename: 'data/local/DarioRoomDatabase.kt',
    layer: 'Database',
    description: 'Definição @Database do Room e módulo Hilt para injeção Singleton.',
    code: `package com.dario.assistant.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.dario.assistant.data.local.dao.ArtifactDao
import com.dario.assistant.data.local.dao.ConversationDao
import com.dario.assistant.data.local.entity.ArtifactEntity
import com.dario.assistant.data.local.entity.ConversationEntity
import com.dario.assistant.data.local.entity.ConversationMessageEntity
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Database(
    entities = [
        ConversationEntity::class,
        ConversationMessageEntity::class,
        ArtifactEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class DarioRoomDatabase : RoomDatabase() {
    abstract fun conversationDao(): ConversationDao
    abstract fun artifactDao(): ArtifactDao
}

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDarioRoomDatabase(
        @ApplicationContext context: Context
    ): DarioRoomDatabase {
        return Room.databaseBuilder(
            context,
            DarioRoomDatabase::class.java,
            "dario_assistant_room.db"
        )
            .fallbackToDestructiveMigrationOnDowngrade()
            .build()
    }

    @Provides
    fun provideConversationDao(db: DarioRoomDatabase): ConversationDao = db.conversationDao()

    @Provides
    fun provideArtifactDao(db: DarioRoomDatabase): ArtifactDao = db.artifactDao()
}`,
  },
];
