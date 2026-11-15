# PROJECT_STATUS.md — Dario Assistant (Multiagente com Instalações Independentes)

**Última atualização**: 14 de Novembro de 2026
**Arquitetura Aprovada**: Um único aplicativo Dario Assistant (React + TypeScript + PWA) com **quatro agentes operacionais (`Gêmeos`, `Azusa`, `Croma`, `B2B`)** e **múltiplas instalações independentes por aparelho (`instance_id`)**, conectado ao **Dario OS** na VPS.

---

## Status Geral por Etapa

| Etapa | Escopo | Status | Testes Automatizados |
| :--- | :--- | :--- | :--- |
| **Fase 1: Saneamento + Isolamento Multi-Instância** | Persistência IndexedDB isolada fisicamente por `instance_id`, `UserPreferencesRepository` com identidade de instalação (`instanceId`, `primaryAgentId`, `deviceLabel`), seleção de modelos (`gemma_local`, `nemotron`, `qwen_harness`), contas próprias (WhatsApp, Gmail, Outlook) e suíte Vitest | **CONCLUÍDA E VALIDADA** | 10/10 testes passando (`npm test`) |
| **Fase 2: PWA Instalável por Aparelho** | `manifest.webmanifest`, Service Worker (`vite-plugin-pwa` + Workbox), ícones PNG (`192x192`, `512x512`, `maskable`, `apple-touch-icon`) e SVG, `share_target`, botão de instalação in-app (`PWAInstallButton`) e indicador offline (`OfflineIndicator`) | **CONCLUÍDA E VALIDADA** | Validada no Vitest + `vite build` (Service Worker `sw.js` gerado) |
| **Prioridade #1: Gêmeos (Celular Pessoal)** | WhatsApp pessoal (código de pareamento), Gmail, Outlook, Conversation Intelligence, análise de grupos, Whisper, memória pessoal, CRM pessoal, Radar, Learning Engine, Model Router (Gemma, Nemotron, Qwen) e inferência local Android | **EM PREPARAÇÃO (Próxima etapa de execução)** | — |
| **Fase 3: API Gateway Dario OS & Harness** | Contratos versionados com cabeçalhos `X-Dario-Instance-Id` e `X-Dario-Agent-Id`, streaming SSE, timeout/retry e roteamento para Gemma/Nemotron/Qwen | **PLANEJADA** | — |
| **Fase 4: Expansão para Azusa, Croma e B2B** | Ativação progressiva das instalações dedicadas da Igreja (`Azusa`), Loja MarquesColor (`Croma`) e Comercial (`B2B`) reutilizando o mesmo aplicativo | **PLANEJADA** | — |

---

## Registro de Entrega — Isolamento por Instalação (`instance_id` + `agent_id`)

### 1. Isolamento Físico de Banco Local e Preferências
- `DarioRoomDatabase.forInstance(instanceId)` (`src/data/local/daos.ts`): cada instalação cria e acessa seu próprio banco IndexedDB (`dario_assistant_room_db_v1` para a instalação padrão Gêmeos e `dario_assistant_room_db_v1__<instance_id>` para instalações dedicadas como `inst-church-azusa`, `inst-store-croma`, `inst-commercial-b2b`).
- `LocalPersistenceRepository` (`src/data/local/localPersistenceRepository.ts`): inicializa apenas as conversas do `agent_id` vinculado à instalação e impede qualquer leitura cruzada entre instalações.
- `UserPreferencesRepository` (`src/data/preferences/userPreferencesDataStore.ts`): persiste `instanceId`, `primaryAgentId`, `deviceLabel`, `preferredProvider` (Modelo Principal), `secondaryModel` (Modelo Secundário), `localAndroidInferenceEnabled` e contas vinculadas (`boundWhatsAppNumber`, `boundGmailAccount`, `boundOutlookAccount`).
- Controle de Autorização em **Ajustes**: a alteração do agente principal da instalação exige desbloqueio explícito com confirmação humana e limpa credenciais/contas de e-mail vinculadas ao aparelho anterior antes de abrir o banco isolado da nova instância.
