# AGENTS.md — Guia de Continuidade Técnica (Codex · Claude Code · Antigravity)

## 1. Identidade e Arquitetura Aprovada (Alternativa A — Multiagente com Instalações Independentes)
- **Projeto**: `dario-assistant` (Um único Dario Assistant, quatro agentes operacionais e múltiplas instalações independentes conectadas ao Dario OS).
- **Decisão Arquitetural Oficial**: **Alternativa A** — Manter React 19 + TypeScript + Vite 8 + Tailwind CSS v4, evoluindo para **PWA instalável** integrada ao **Dario OS** via API Gateway autenticada na VPS.
- **Prioridade #1 de Desenvolvimento**: **Gêmeos (Twin)** no celular pessoal (WhatsApp pessoal via código de pareamento, Gmail, Outlook, Conversation Intelligence, análise de grupos, Whisper, memória pessoal, CRM pessoal, Radar, Learning Engine, Model Router, Gemma, Nemotron, Qwen e inferência local Android quando viável).

## 2. Quatro Agentes Operacionais e Isolamento por Instalação (`instance_id`)
1. **Gêmeos (`gemeos`)** — Celular pessoal (`inst-default-gemeos`): Assistente pessoal, memória privada, WhatsApp pessoal, Gmail e Outlook.
2. **Azusa (`azusa`)** — Celular da igreja (`inst-church-azusa`): Igreja, comunidade, grupos e eventos.
3. **Croma (`croma`)** — Celular da loja (`inst-store-croma`): Operação MarquesColor, orçamentos, pedidos e pós-venda.
4. **B2B (`b2b`)** — Celular comercial (`inst-commercial-b2b`): Relacionamento comercial, propostas corporativas e pipeline.

### Regras de Isolamento Estrito entre Instalações
- Cada instalação possui `instance_id` próprio, `agent_id` principal, conta WhatsApp própria (pareada por código de 8 caracteres em Dispositivos Conectados), contas de e-mail próprias (Gmail e Outlook), sessão independente, memória independente, banco IndexedDB físico independente (`dario_assistant_room_db_v1` / `dario_assistant_room_db_v1__<instance_id>`) e preferências próprias.
- **Proibido misturar dados de instalações diferentes** ou permitir que o agente de uma instalação acesse automaticamente a memória de outra.
- **Modelos de IA desacoplados da identidade**: Cada instalação seleciona seu Modelo Principal (`preferredProvider`) e Modelo Secundário (`secondaryModel`) — incluindo `gemma_local`, `nemotron`, `qwen_harness`, `llama_harness`, `gemini`, `ollama` — sem que a troca de modelo altere a identidade ou a memória do agente.

## 3. Fronteiras Arquiteturais Invioláveis
1. **Não migrar para Kotlin neste momento**.
2. **Não duplicar motores do Dario OS**:
   - Proibido criar outro Harness, outro Model Router ou outro Memory Engine.
3. **Pareamento WhatsApp estilo Zapia por Instalação**:
   - Não depender de um único número central de WhatsApp para todos os agentes; cada instalação pareia seu próprio número via código de 8 caracteres gerenciado pelo conector único do Dario OS.

## 4. Comandos Obrigatórios de Verificação
- Executar testes automatizados (Vitest + fake-indexeddb): `npm test`
- Checagem de tipos TypeScript: `npm run lint` (`tsc --noEmit`)
- Build de produção Web: `npm run build` (`vite build`)
