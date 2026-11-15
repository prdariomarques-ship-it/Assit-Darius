# Dario Assistant — Documentação Técnica da Fase 1 (Saneamento Concluído)

## 1. Arquitetura Aprovada (Alternativa A — PWA + Integração Dario OS)
O Dario Assistant é desenvolvido em **React 19 + TypeScript + Vite 8 + Tailwind CSS v4**, estruturado em camadas **MVVM** e preparado para empacotamento PWA (Fase 2) e conexão via API Gateway autenticada aos motores do **Dario OS** e aos quatro agentes (**Azusa**, **B2B**, **Gêmeos**, **Croma**).

## 2. Persistência Local Integral (IndexedDB Schema v2)
O banco local `dario_assistant_room_db_v1` (versão 2) armazena todas as entidades de estado do aplicativo:

1. `conversations` (`ConversationEntity`): Tópicos isolados por `isolatedContextKey`.
2. `conversation_messages` (`ConversationMessageEntity`): Mensagens vinculadas por `conversationId` com exclusão em cascata (`CASCADE`).
3. `artifacts` (`ArtifactEntity`): Documentos e metadados extraídos.
4. `scheduled_tasks` (`ScheduledTaskEntity`): Agendamentos criados, pausados ou removidos pelo usuário.
5. `radar_signals` (`RadarSignalEntity`): Sinais proativos e seu estado de revisão (`acknowledged`).
6. `notifications` (`NotificationEntity`): Notificações e seu estado de leitura (`read`).
7. `room_meta`: Controle de migração e seed inicial (`initial_seed_v1` e `initial_seed_v2`).

## 3. Preferências do Usuário (`UserPreferencesRepository`)
Armazenadas de forma atômica em `dario_user_preferences.preferences_pb` (`localStorage`) com controle de revisão incremental:
- `userName`, `vpsBaseUrl`, `wsEndpointUrl`, `requestTimeoutMs`, `preferredProvider`, `preferredWritingStyle`, `requireConfirmationForSensitiveActions`.
- `radarPrefs` (5 categorias de monitoramento) e `radarPriorityFilter`.
- `connectionState` e último resultado real de `/health`.

## 4. Suíte de Testes Automatizados (`src/data/__tests__/persistenceAndApi.test.ts`)
Executada via `npm test` (`vitest run` + `fake-indexeddb`):
- Valida mapeadores bidirecionais de todas as entidades.
- Valida integridade referencial `CASCADE` em `ConversationDao`.
- Valida operações CRUD em `ArtifactDao`, `ScheduledTaskDao`, `RadarSignalDao` e `NotificationDao`.
- Valida preservação de estado entre reinicializações no `LocalPersistenceRepository`.
- Valida transações e recuperação de estado transitório no `UserPreferencesRepository`.
- Valida tratamento de URLs vazias ou inválidas no `HttpDarioApiClient`.
