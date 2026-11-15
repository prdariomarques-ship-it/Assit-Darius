# Relatório de Auditoria e Incorporação do Dario Assistant ao Ecossistema Dario OS

## 1. O que está realmente funcionando (Implementação Real em Web/TS)
- **Estrutura de Diretórios e Compilação**: Projeto Web React 19 + TypeScript 7 + Vite 8 + Tailwind CSS v4 estruturado em três camadas (`src/domain/`, `src/data/`, `src/presentation/`), compilando sem erros em `tsc --noEmit` e `vite build`.
- **Interface e Navegação Responsiva**:
  - Layout completo com cabeçalho (`Header.tsx`), navegação lateral no desktop e barra inferior fixa no mobile (`NavigationShell.tsx`) cobrindo as 5 áreas: **Conversas**, **Artefatos**, **Agendados**, **Radar** e **Conectores**, além de **Central de Notificações** e **Configurações**.
- **Persistência Local no Navegador (Web)**:
  - **Conversas e Artefatos (`src/data/local/daos.ts` + `localPersistenceRepository.ts`)**: Persistidos de verdade no **IndexedDB** do navegador (`dario_assistant_room_db_v1`) com 4 `ObjectStores` (`conversations`, `conversation_messages`, `artifacts`, `room_meta`). Criar conversas, enviar rascunhos locais, arquivar, excluir conversas (com remoção em cascata das mensagens) e adicionar/excluir artefatos sobrevivem ao recarregamento (`F5`) e fechamento do navegador.
  - **Preferências do Usuário (`src/data/preferences/userPreferencesDataStore.ts`)**: Persistidas de verdade em **`localStorage`** (`dario_jetpack_datastore_preferences_pb_v1`), mantendo `userName`, `vpsBaseUrl`, `wsEndpointUrl`, `requestTimeoutMs`, `preferredProvider`, `preferredWritingStyle`, `radarPrefs`, `radarPriorityFilter` e o último resultado de `/health`.
- **Cliente HTTP (`src/data/apiClient.ts`)**:
  - `HttpDarioApiClient` executa requisições `fetch` reais para `<vpsBaseUrl>/health` com validação de URL e cancelamento por timeout (`AbortController`), sem mascarar falhas de rede ou CORS.

---

## 2. O que é apenas demonstração ou simulação conceitual
- **Não é um aplicativo Android nativo**:
  - Não existe `build.gradle.kts`, `AndroidManifest.xml`, código Kotlin compilável, Jetpack Compose, Room real (SQLite nativo Android) ou Jetpack DataStore real (`preferences_pb` binário Android).
  - As classes `DarioRoomDatabase`, `ConversationDao`, `ArtifactDao` e `UserPreferencesRepository` são **abstrações em TypeScript para o navegador** que imitam a nomenclatura do Android.
  - O arquivo `src/data/local/androidRoomReference.ts` contém apenas strings de código Kotlin para cópia manual.
- **Estado ainda em memória (não persistido)**:
  - **Agendados (`scheduledTasks`)**: Criar, pausar ou remover agendamentos em `ScheduledView.tsx` altera apenas um `useState` em memória; ao recarregar a página, volta para `DEMO_SCHEDULED_TASKS`.
  - **Sinais do Radar (`radarSignals` acknowledged) e Notificações (`notifications` read)**: Embora os filtros do Radar (`radarPrefs`) sejam salvos no `localStorage`, marcar um sinal do Radar como "Revisado" ou marcar notificações como "Lidas" está apenas em memória (`useState`).
- **Dados iniciais (`DEMO_*`)**:
  - Os 4 assistentes, 3 conversas iniciais, 4 artefatos, 3 agendamentos, 3 sinais do Radar e 5 conectores são registros estáticos de demonstração (`isDemo: true`).
- **Ausência de Testes Automatizados**:
  - Há validação estática (`tsc --noEmit`) e de bundle (`vite build`), mas **zero testes unitários ou de integração** (Vitest/Playwright) configurados no `package.json`.

---

## 3. O que precisa ser corrigido
1. **Dependências instaladas mas ainda não utilizadas no `package.json`**:
   - `@google/genai`, `express`, `dotenv` e `motion` constam no `package.json` do template inicial, mas não são importados em nenhum arquivo de `src/`. Devem ser removidos se o frontend permanecer puro ou utilizados apenas quando o servidor proxy (`server.ts`) for ativado.
2. **Persistência incompleta para Agendados, Sinais do Radar e Notificações**:
   - Se o objetivo é manter 100% do estado da Fase 1 entre reinicializações, as alterações em `scheduledTasks` (novos agendamentos/pausas) e o estado de leitura de `radarSignals` e `notifications` também precisam de store no IndexedDB.
3. **Ausência de suíte de testes automatizados**:
   - Adicionar testes unitários para os mapeadores (`entities.ts`), repositório de preferências e cliente HTTP.
4. **Alinhamento de Nomenclatura**:
   - Evitar chamar camadas de `IndexedDB` e `localStorage` de "Room" e "Jetpack DataStore" no código Web se a arquitetura escolhida for PWA/Web, ou migrá-las de fato para Kotlin caso a decisão seja Android nativo.

---

## 4. O que pode ser reaproveitado
- **100% da Identidade Visual e UX**: Paleta dark grafite/verde-água, hierarquia tipográfica (`Plus Jakarta Sans` + `JetBrains Mono`), organização em 5 módulos (Conversas, Artefatos, Agendados, Radar, Conectores) e separação epistemológica (`fato`, `inferencia`, `sugestao`).
- **Contratos de Domínio (`src/domain/models.ts`)**: Modelos de dados prontos para servir como contrato JSON entre o cliente (Web/PWA ou Android) e o gateway da VPS.
- **Catálogo de Limites e Segurança (`CONNECTOR_CATALOG`)**: Regras de escopo mínimo e separação de estilos de escrita.
- **Snippets Kotlin (`src/data/local/androidRoomReference.ts`)**: Caso a opção Android nativo seja escolhida, as entidades Room, DAOs com `ForeignKey.CASCADE` e `UserPreferencesRepository` em Kotlin já servem como ponto de partida direto.

---

## 5. O que deve ser integrado ao Dario OS (Sem Duplicar Serviços)
O **Dario Assistant** não deve construir seus próprios motores de IA no backend. Ele deve consumir, via **API Gateway autenticada na VPS**, os serviços já existentes ou em estabilização no **Dario OS**:

| Capacidade no Dario Assistant | Módulo Existente no Dario OS a Reaproveitar | Regra de Integração |
| :--- | :--- | :--- |
| **Chat e Roteamento de Modelos** | **Model Router + Harness (Qwen / Llama / Gemini)** | O Dario Assistant envia o prompt + `isolatedContextKey` + `preferredTier`; o Model Router do Dario OS decide e executa o modelo. |
| **Memória e Perfil de Escrita** | **Memory Engine + Learning Engine** | O Dario Assistant consulta memórias validadas e perfis de estilo via endpoint REST versionado, sem criar outro banco vetorial paralelo. |
| **Radar e Priorização** | **Priority Engine + Market/News/Portfolio Intelligence + Compliance Agent** | O Radar do Dario Assistant exibe os alertas gerados pelo Priority Engine do Dario OS, filtrados pelas preferências do usuário. |
| **Avaliação de Respostas Críticas** | **Ensemble / Judge Engine + Benchmark Engine** | Ações sensíveis ou respostas complexas passam pelo Judge Engine existente antes de serem apresentadas como sugestão. |
| **Documentos, Áudio e Conectores** | **Serviços de OCR / Transcrição / Conectores na VPS** | Reaproveitar workers de Whisper/OCR na VPS através de fila autenticada; **não** reutilizar a sessão instável legada de WhatsApp do Dario OS até que seja isolada e auditada. |

---

## 6. Decisão de Arquitetura: Comparação (Alternativa A vs. Alternativa B)

| Critério | Alternativa A: Web App / PWA Instalável (React + TS + Vite) | Alternativa B: Android Nativo (Kotlin + Jetpack Compose + Room + DataStore) |
| :--- | :--- | :--- |
| **Aproveitamento do código atual** | **~95% imediato** (interface, estado, IndexedDB e contratos já estão prontos e rodando). | **~20% direto** (aproveita design, contratos JSON e os snippets Kotlin; exige reescrever todas as telas em Compose). |
| **Custo de manutenção** | **Baixo** — base única em TypeScript que roda no celular Android (instalável via Chrome/PWA), tablet e desktop. | **Médio/Alto** — exige manter pipeline Android Studio/Gradle/APK além dos serviços na VPS, e não oferece versão desktop sem outro frontend. |
| **Acesso a recursos do Android** | **Médio** — suporta instalação na tela inicial, Web Push Notifications, gravação de áudio/câmera e **Web Share Target API** (receber arquivos/áudios compartilhados quando instalado como PWA). **Não** suporta `NotificationListenerService` nativo em background. | **Total** — suporta `Intent.ACTION_SEND` nativo, `NotificationListenerService`, `WorkManager` em background e armazenamento criptografado via `AndroidKeyStore`. |
| **Compatibilidade com o Harness e Dario OS** | **Idêntica (Alta)** — ambos se comunicam com a VPS e o Model Router via HTTPS/REST e WebSocket/SSE. | **Idêntica (Alta)** — o processamento pesado (Qwen, Llama, OCR, Whisper, Memory) roda 100% na VPS, nunca no celular. |
| **Velocidade de evolução** | **Muito alta** — permite conectar o Model Router, o Harness e os 4 agentes em poucos dias. | **Moderada** — exige primeiro concluir a portabilidade da UI para Jetpack Compose antes de focar nas integrações de IA. |

### Recomendação Arquitetural
- **Curto e Médio Prazo (Recomendado): Alternativa A (Transformar a base React/TS atual em PWA Instalável + Backend Adapter para o Dario OS)**, adicionando um micro-app Android complementar ("Companion Bridge" mínimo em Kotlin) **apenas se e quando** o `NotificationListenerService` for estritamente necessário.
- **Justificativa**: Como todo o trabalho pesado (Harness Qwen/Llama, Model Router, Memory Engine, Radar 24h e os 4 agentes) roda na **VPS**, reescrever toda a interface em Kotlin agora atrasaria a entrega de valor real e criaria duas frentes de código antes mesmo de estabilizar os contratos da API com o Dario OS. Uma PWA com `manifest.json`, Service Worker e `share_target` já entrega instalação no Android e recebimento de arquivos/áudios compartilhados com custo mínimo.

---

## 7. Integração com os Quatro Agentes (Azusa, B2B, Gêmeos, Croma)
O **Dario Assistant** atuará como **Interface Pessoal Unificada (Cockpit do Usuário)** sobre os quatro agentes, sem duplicar suas regras de negócio:

1. **Azusa**:
   - *Papel no ecossistema*: Operações, atendimento/automação e triagem contextual.
   - *Como o Dario Assistant complementa*: Na aba **Conversas** e no **Radar**, o usuário recebe escalonamentos da Azusa que exigem decisão humana (aprovação atômica) e pode instruir a Azusa por voz ou texto.
2. **B2B**:
   - *Papel no ecossistema*: Inteligência comercial, propostas, relacionamento corporativo e acompanhamento de contas/contratos.
   - *Como o Dario Assistant complementa*: A aba **Artefatos** (XML fiscal, PDFs de contratos, planilhas) e o conector **Gmail Intelligence** (estilo Profissional) alimentam e consultam o agente B2B para preparar respostas comerciais no tom do usuário.
3. **Gêmeos**:
   - *Papel no ecossistema*: Simulação, avaliação cruzada, contraponto analítico e representação de perfil/contexto.
   - *Como o Dario Assistant complementa*: Integrado ao **Learning Engine** e ao **Ensemble/Judge Engine** para redigir rascunhos fiéis ao estilo do usuário (Profissional, Pessoal, Técnico) e validar decisões antes de execução.
4. **Croma**:
   - *Papel no ecossistema*: Criação, ativos visuais/multimodais, identidade e síntese de apresentações/artefatos.
   - *Como o Dario Assistant complementa*: A aba **Artefatos** e **Conversas** permite solicitar, inspecionar e aprovar entregas multimodais geradas pelo Croma diretamente no celular/desktop.

---

## 8. Estimativa de Esforço e Plano de Execução Incremental (Mudanças Pequenas e Testáveis)

| Etapa | Escopo Técnico (Pequeno e Testável) | Esforço Estimado | Critério de Aceite / Teste |
| :--- | :--- | :--- | :--- |
| **Etapa 1: Saneamento e Testes da Base Atual** | Remover dependências não usadas, persistir `scheduledTasks` e `notifications` no IndexedDB e adicionar testes unitários (`vitest`) para DAOs e DataStore. | **4 a 6 horas** | `npm test`, `npm run lint` e `npm run build` passando 100%; estado de todas as 5 abas preservado após `F5`. |
| **Etapa 2: Empacotamento PWA Instalável no Android** | Adicionar `manifest.webmanifest`, ícones, Service Worker e configuração `share_target` para instalar no Android. | **3 a 4 horas** | App instalável no Chrome Android com abertura em tela cheia e funcionamento offline do shell. |
| **Etapa 3: Gateway de Integração com Model Router & Harness (Fase 2)** | Criar rota segura `/api/v1/chat` conectando ao Model Router / Harness (Gemini, Qwen, Llama) na VPS com streaming SSE e isolamento por `isolatedContextKey`. | **8 a 12 horas** | Envio de mensagem real retornando resposta do modelo selecionado via Model Router sem expor chaves no cliente. |
| **Etapa 4: Ponte para os 4 Agentes (Azusa, B2B, Gêmeos, Croma)** | Substituir `DEMO_ASSISTANTS` pelos 4 agentes reais consumindo os endpoints de cada agente na VPS com autenticação e confirmação para ações críticas. | **8 a 12 horas** | Seleção de Azusa, B2B, Gêmeos ou Croma em uma conversa roteando para o respectivo agente e exibindo status real. |
| **Etapa 5: Integração com Memory Engine, Priority Engine (Radar) e Documentos** | Conectar abas Artefatos e Radar aos serviços existentes do Dario OS na VPS (OCR, XML parser, Whisper e Priority Engine). | **12 a 16 horas** | Upload de PDF/XML/Áudio processado na VPS e sinais reais do Priority Engine exibidos no Radar. |
