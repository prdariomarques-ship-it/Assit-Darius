# Arquitetura Unificada: Dario OS + WhatsApp Connector + Dario Assistant (Multiagente com Instalações Independentes)

## 1. Princípio Arquitetural Central
O ecossistema opera como **um único aplicativo Dario Assistant, quatro agentes operacionais e múltiplas instalações independentes**, tendo o **Dario OS (VPS)** como núcleo central:
- **Dario OS (VPS)**: Núcleo único de inteligência, gerenciamento de sessões multi-instância, filas, transcrição Whisper, OCR, Memory Engine particionado por `(instance_id, agent_id)`, Learning Engine, CRM pessoal/comercial e Model Router/Harness.
- **Quatro Instalações Independentes (Mesmo App/PWA em Aparelhos Distintos)**:
  1. **Celular Pessoal → `Gêmeos (Twin)` (`inst-default-gemeos`) [PRIORIDADE #1]**: Assistente pessoal completo (WhatsApp pessoal, Gmail, Outlook, Conversation Intelligence, análise de grupos, Whisper, memória pessoal, CRM pessoal, Radar, Learning Engine, Model Router com Gemma, Nemotron, Qwen e inferência local no Android).
  2. **Celular da Igreja → `Azusa` (`inst-church-azusa`)**: Comunidade, grupos e eventos pastorais.
  3. **Celular da Loja → `Croma` (`inst-store-croma`)**: Operação MarquesColor, orçamentos, pedidos e pós-venda.
  4. **Celular Comercial → `B2B` (`inst-commercial-b2b`)**: Relacionamento corporativo, propostas e vendas B2B.

---

## 2. Estratégia de Isolamento Estrito entre Instalações (`instance_id` + `agent_id`)

Cada aparelho instalado possui identidade e escopo de dados rigorosamente isolados em **três camadas**:

| Camada | Mecanismo de Isolamento | Garantia de Privacidade |
| :--- | :--- | :--- |
| **1. Dispositivo Local (PWA / Android)** | Banco IndexedDB físico separado por instalação (`dario_assistant_room_db_v1__<instance_id>`) + Namespace de preferências em `UserPreferencesRepository`. | Uma instalação nunca lê nem compartilha conversas, mensagens, artefatos ou credenciais de outra instalação. A troca do `primaryAgentId` exige desbloqueio explícito em Ajustes. |
| **2. Transporte e API Gateway (Dario OS)** | Toda requisição HTTP/SSE inclui `instance_id` e `agent_id` autenticados pelo token da instalação. | O API Gateway rejeita consultas cujo token de instalação tente ler partições de memória ou sessões de outro `instance_id`. |
| **3. Backend Dario OS (Memória, Sessões e Conectores)** | Particionamento obrigatório por `(instance_id, agent_id)` nas tabelas `whatsapp_connections`, `email_connections`, `memory_entries` e `conversation_threads`. | O agente de uma instalação jamais acessa automaticamente a memória, o WhatsApp ou os e-mails de outra instalação. |

---

## 3. Pareamento de WhatsApp por Instalação (Experiência Estilo Zapia)

- **Sem número central único**: Não existe um único WhatsApp compartilhado para todos os agentes. Cada instalação conecta **sua própria conta de WhatsApp**.
- **Fluxo de Pareamento em Cada Aparelho**:
  1. Na instalação do aparelho (ex.: Celular Pessoal com **Gêmeos**, ou Celular da Loja com **Croma**), o usuário abre **Conectores → WhatsApp**.
  2. Informa o número de telefone daquele aparelho/operação.
  3. O **Dario OS** inicia uma sessão isolada vinculada a `(instance_id, agent_id)` e retorna o **código de pareamento efêmero de 8 caracteres** (protocolo *Linked Devices / Dispositivos Conectados*).
  4. O usuário digita o código no WhatsApp daquele aparelho (*Dispositivos conectados → Conectar com número de telefone*).
  5. Os eventos recebidos por aquela sessão alimentam exclusivamente o pipeline do `agent_id` e `instance_id` correspondentes.

---

## 4. Modelos de IA por Instalação (Identidade e Memória Independentes do Modelo)

Cada instalação pode configurar em **Ajustes**:
- **Modelo Principal (`preferredProvider`)** e **Modelo Secundário / Fallback (`secondaryModel`)**:
  - `gemma_local` (Gemma · Execução Local Android / On-Device para triagem rápida e privacidade offline)
  - `nemotron` (NVIDIA Nemotron via Harness no Dario OS para raciocínio profundo)
  - `qwen_harness` (Qwen 2.5 via Harness no Dario OS)
  - `llama_harness` (Llama 3.3 via Harness no Dario OS)
  - `gemini` (Gemini via Model Router)
  - `ollama` (Ollama Local na VPS)
- **Regra de Ouro**: Os modelos (`Gemma`, `Nemotron`, `Qwen`, `Llama`, `Gemini`) são motores intercambiáveis de inferência. A **identidade operacional**, as **regras de negócio** e a **memória de longo prazo** pertencem exclusivamente ao par `(instance_id, agent_id)` no Memory Engine.

---

## 5. Pipeline Único do Intelligence Engine por Instalação

Todo evento capturado pelos conectores da instalação (WhatsApp da instalação, Gmail da instalação, Outlook da instalação) percorre no Dario OS:
1. **Connector Ingestion (`instance_id`, `agent_id`, `connection_id`)** → deduplicação idempotente por `external_message_id`.
2. **Event Normalization** → envelope canônico (1:1, grupo, e-mail, anexo ou áudio).
3. **Audio Transcription (Whisper) & OCR** → gera **Transcrição Visual** e **Transcrição Contextual** para áudios e extração estruturada para PDFs/XMLs/planilhas.
4. **Conversation Intelligence & Group Analysis** → identifica participantes, compromissos, pendências e sentimento na conversa ou grupo.
5. **Scoped Memory Engine & Personal/Commercial CRM** → grava e consulta memórias estritamente dentro do namespace `(instance_id, agent_id)`.
6. **Agent Execution & Radar** → gera sinais no Radar, agendamentos ou sugestões de resposta no estilo do usuário (Learning Engine), exigindo aprovação humana para envios externos sensíveis.
