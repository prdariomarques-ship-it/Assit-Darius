import {
  ArtifactItem,
  AssistantProfile,
  ConnectorDefinition,
  ConversationThread,
  DarioAgentId,
  NotificationItem,
  RadarSignal,
  ScheduledTask,
  WhatsAppConnectionRecord,
  WhatsAppRoutingRule,
} from '../domain/models';

export const DEMO_ASSISTANTS: AssistantProfile[] = [
  {
    id: 'gemeos',
    name: 'Gêmeos (Twin)',
    deviceTarget: 'Celular Pessoal (Prioridade #1)',
    role: 'Assistente pessoal, memória, CRM pessoal, grupos e estilo de escrita',
    domainScope:
      'WhatsApp pessoal, Gmail, Outlook, Conversation Intelligence, análise de grupos, Whisper, memória pessoal, CRM pessoal, Radar e Learning Engine.',
    description:
      'Prioridade inicial de desenvolvimento. Opera no celular pessoal com memória isolada, CRM pessoal, análise de grupos e roteamento entre inferência local (Gemma) e modelos na VPS (Nemotron, Qwen, Gemini).',
    recommendedTier: 'advanced',
    developmentPriority: 1,
    isolationPolicy:
      'Instância isolada no celular pessoal. Nenhuma outra instalação acessa a memória ou conversas do Gêmeos.',
    targetPhase: 'Fase 4 · Quatro Agentes',
    isDemo: true,
  },
  {
    id: 'azusa',
    name: 'Azusa',
    deviceTarget: 'Celular da Igreja',
    role: 'Igreja, comunidade, eventos e acompanhamento de grupos',
    domainScope: 'Conversas e grupos da igreja e comunidade, cronogramas de eventos e acompanhamento pastoral/operacional.',
    description:
      'Configurada para a instalação no celular da igreja, com conta WhatsApp própria, e-mail próprio e banco local independente.',
    recommendedTier: 'intermediate',
    developmentPriority: 2,
    isolationPolicy:
      'Banco local, sessão WhatsApp e memória exclusivos da instalação da igreja (Azusa).',
    targetPhase: 'Fase 4 · Quatro Agentes',
    isDemo: true,
  },
  {
    id: 'croma',
    name: 'Croma',
    deviceTarget: 'Celular da Loja (MarquesColor)',
    role: 'Operação MarquesColor: clientes, orçamentos, produtos, vendas e pós-venda',
    domainScope: 'Atendimento da loja MarquesColor, catálogo, orçamentos, pedidos e acompanhamento pós-venda.',
    description:
      'Configurada para o celular da loja MarquesColor, mantendo número de WhatsApp, contatos e histórico de orçamentos 100% isolados.',
    recommendedTier: 'intermediate',
    developmentPriority: 3,
    isolationPolicy:
      'Banco local, sessão WhatsApp e memória restritos exclusivamente à instalação da loja MarquesColor.',
    targetPhase: 'Fase 4 · Quatro Agentes',
    isDemo: true,
  },
  {
    id: 'b2b',
    name: 'B2B',
    deviceTarget: 'Celular Comercial',
    role: 'Relacionamento comercial, propostas, oportunidades e vendas corporativas',
    domainScope: 'Prospecção corporativa, propostas comerciais, contratos, negociações e acompanhamento de contas.',
    description:
      'Configurada para o celular comercial B2B, operando com número de WhatsApp e caixa de e-mail corporativa independentes.',
    recommendedTier: 'intermediate',
    developmentPriority: 4,
    isolationPolicy:
      'Banco local, sessão WhatsApp e memória isolados na instalação comercial B2B.',
    targetPhase: 'Fase 4 · Quatro Agentes',
    isDemo: true,
  },
];

export const WHATSAPP_AGENT_ROUTING_RULES: WhatsAppRoutingRule[] = [
  {
    rule_id: 'route-gemeos',
    agent_id: 'gemeos',
    agent_name: 'Gêmeos (Twin)',
    device_target: 'Celular Pessoal · Prioridade #1',
    scope_summary:
      'WhatsApp pessoal, análise de grupos, transcrição Whisper, CRM pessoal e memória pessoal.',
    match_criteria: ['instance_id do celular pessoal', 'Número WhatsApp pessoal pareado', 'Gmail & Outlook pessoais'],
    privacy_boundary:
      'Isolamento físico por instance_id. Memória e conversas nunca são compartilhadas automaticamente com outras instalações.',
  },
  {
    rule_id: 'route-azusa',
    agent_id: 'azusa',
    agent_name: 'Azusa',
    device_target: 'Celular da Igreja',
    scope_summary: 'Igreja, grupos da comunidade, eventos e acompanhamento.',
    match_criteria: ['instance_id do celular da igreja', 'Número WhatsApp da igreja pareado'],
    privacy_boundary: 'Isolado na instalação da igreja; sem acesso aos dados pessoais (Gêmeos), loja (Croma) ou B2B.',
  },
  {
    rule_id: 'route-croma',
    agent_id: 'croma',
    agent_name: 'Croma (MarquesColor)',
    device_target: 'Celular da Loja',
    scope_summary: 'Clientes, orçamentos, produtos, vendas e pós-venda da MarquesColor.',
    match_criteria: ['instance_id do celular da loja', 'Número WhatsApp da MarquesColor pareado'],
    privacy_boundary: 'Isolado exclusivamente para a operação MarquesColor.',
  },
  {
    rule_id: 'route-b2b',
    agent_id: 'b2b',
    agent_name: 'B2B',
    device_target: 'Celular Comercial',
    scope_summary: 'Relacionamento comercial, propostas, oportunidades e vendas B2B.',
    match_criteria: ['instance_id do celular comercial', 'Número WhatsApp comercial pareado'],
    privacy_boundary: 'Isolado exclusivamente na instalação comercial B2B.',
  },
];

export const DEMO_WHATSAPP_CONNECTIONS: WhatsAppConnectionRecord[] = [
  {
    connection_id: 'wa-conn-gemeos-personal',
    instance_id: 'inst-default-gemeos',
    agent_id: 'gemeos',
    phone_number: '+55 (Celular Pessoal · Gêmeos)',
    provider: 'linked_device_pairing_code',
    connection_status: 'disconnected',
    session_reference: 'encrypted://dario-os/instances/inst-default-gemeos/wa-session',
    last_connected_at: null,
    last_event_at: null,
    last_error: 'Pronto para pareamento por código de 8 dígitos na instância pessoal (Gêmeos).',
    reconnection_status: 'idle',
    default_agent_id: 'gemeos',
    isDemo: true,
  },
  {
    connection_id: 'wa-conn-azusa-church',
    instance_id: 'inst-church-azusa',
    agent_id: 'azusa',
    phone_number: '+55 (Celular da Igreja · Azusa)',
    provider: 'linked_device_pairing_code',
    connection_status: 'disconnected',
    session_reference: 'encrypted://dario-os/instances/inst-church-azusa/wa-session',
    last_connected_at: null,
    last_event_at: null,
    last_error: 'Sessão independente associada à instalação do celular da igreja.',
    reconnection_status: 'idle',
    default_agent_id: 'azusa',
    isDemo: true,
  },
  {
    connection_id: 'wa-conn-croma-store',
    instance_id: 'inst-store-croma',
    agent_id: 'croma',
    phone_number: '+55 (Celular da Loja · Croma)',
    provider: 'linked_device_pairing_code',
    connection_status: 'disconnected',
    session_reference: 'encrypted://dario-os/instances/inst-store-croma/wa-session',
    last_connected_at: null,
    last_event_at: null,
    last_error: 'Sessão independente associada à instalação da loja MarquesColor.',
    reconnection_status: 'idle',
    default_agent_id: 'croma',
    isDemo: true,
  },
  {
    connection_id: 'wa-conn-b2b-commercial',
    instance_id: 'inst-commercial-b2b',
    agent_id: 'b2b',
    phone_number: '+55 (Celular Comercial · B2B)',
    provider: 'linked_device_pairing_code',
    connection_status: 'disconnected',
    session_reference: 'encrypted://dario-os/instances/inst-commercial-b2b/wa-session',
    last_connected_at: null,
    last_event_at: null,
    last_error: 'Sessão independente associada à instalação comercial B2B.',
    reconnection_status: 'idle',
    default_agent_id: 'b2b',
    isDemo: true,
  },
];

export const DEMO_CONVERSATIONS: ConversationThread[] = [
  {
    id: 'conv-vps-01',
    title: 'Gêmeos (Twin) · CRM Pessoal e Análise de Grupos',
    subject: 'Contexto Pessoal',
    assistantId: 'gemeos',
    updatedAt: 'Hoje · 09:42',
    unreadCount: 0,
    archived: false,
    isolatedContextKey: 'ctx_gemeos_personal_01',
    isDemo: true,
    messages: [
      {
        id: 'm1',
        sender: 'user',
        content:
          'Esta instalação no meu celular pessoal deve operar prioritariamente com o Gêmeos, conectando meu WhatsApp pessoal, Gmail, Outlook e CRM pessoal.',
        timestamp: '09:40',
      },
      {
        id: 'm2',
        sender: 'assistant',
        content:
          'Registro demonstrativo (Gêmeos · Twin): esta instalação possui instance_id próprio, banco local isolado e seleção independente de modelo principal e secundário (Gemma local, Nemotron, Qwen ou Gemini).',
        timestamp: '09:41',
        classification: 'fato',
      },
    ],
  },
  {
    id: 'conv-nfe-02',
    title: 'Croma · Operação MarquesColor (Instância Loja)',
    subject: 'MarquesColor',
    assistantId: 'croma',
    updatedAt: 'Ontem · 18:15',
    unreadCount: 1,
    archived: false,
    isolatedContextKey: 'ctx_croma_marquescolor_02',
    isDemo: true,
    messages: [
      {
        id: 'm4',
        sender: 'user',
        content: 'No celular da loja, a instalação será configurada para o agente Croma com seu próprio WhatsApp.',
        timestamp: '18:14',
      },
      {
        id: 'm5',
        sender: 'assistant',
        content:
          'Registro demonstrativo: quando instalado no aparelho da loja e configurado como Croma, o aplicativo cria um banco local e uma sessão de WhatsApp exclusivos para a MarquesColor.',
        timestamp: '18:15',
        classification: 'fato',
      },
    ],
  },
  {
    id: 'conv-gmail-03',
    title: 'Azusa · Igreja e Comunidade (Instância Igreja)',
    subject: 'Igreja e Comunidade',
    assistantId: 'azusa',
    updatedAt: '12 Nov · 14:08',
    unreadCount: 0,
    archived: false,
    isolatedContextKey: 'ctx_azusa_church_03',
    isDemo: true,
    messages: [
      {
        id: 'm6',
        sender: 'user',
        content: 'O celular da igreja usará a Azusa sem misturar memórias com o meu celular pessoal.',
        timestamp: '14:07',
      },
      {
        id: 'm7',
        sender: 'assistant',
        content:
          'Registro demonstrativo: cada instalação mantém instance_id, agent_id, conta WhatsApp, e-mails e memória estritamente separados.',
        timestamp: '14:08',
        classification: 'fato',
      },
    ],
  },
];

export function getSeedConversationsForAgent(agentId: DarioAgentId): ConversationThread[] {
  const matching = DEMO_CONVERSATIONS.filter((c) => c.assistantId === agentId);
  if (matching.length > 0) return matching;
  return [
    {
      id: `conv-${agentId}-init`,
      title: `${agentId.toUpperCase()} · Contexto Inicial da Instância`,
      subject: 'Operação Isolada',
      assistantId: agentId,
      updatedAt: 'Agora · Isolado',
      unreadCount: 0,
      archived: false,
      isolatedContextKey: `ctx_${agentId}_instance_01`,
      isDemo: true,
      messages: [
        {
          id: `msg-${agentId}-1`,
          sender: 'system_notice',
          content: `Banco local inicializado exclusivamente para o agente ${agentId.toUpperCase()}. Nenhum dado de outra instalação é compartilhado.`,
          timestamp: '09:00',
        },
      ],
    },
  ];
}

export const DEMO_ARTIFACTS: ArtifactItem[] = [
  {
    id: 'art-01',
    title: 'NF-e_Fornecedor_Exemplo_3526.xml',
    format: 'XML',
    source: 'Upload na instância local (Exemplo)',
    processedAt: 'Exemplo · 14 Nov 08:10',
    confidence: 0.99,
    extractedPreview: 'Estrutura NF-e v4.00 · Campos previstos: CNPJ emitente, vNF, dhEmi e validação de schema.',
    errorsFound: null,
    targetPhase: 'Fase 5 · Intelligence Engine',
    isDemo: true,
  },
  {
    id: 'art-02',
    title: 'Audio_Grupo_WhatsApp_Whisper_01m42s.ogg',
    format: 'AUDIO',
    source: 'WhatsApp da Instância -> Whisper (Exemplo)',
    processedAt: 'Exemplo · 13 Nov 17:30',
    confidence: 0.91,
    extractedPreview:
      'Transcrição visual e contextual via Whisper + Conversation Intelligence para análise de grupo e CRM pessoal.',
    errorsFound: null,
    targetPhase: 'Fase 5 · Intelligence Engine',
    isDemo: true,
  },
  {
    id: 'art-03',
    title: 'Relatorio_CRM_Pessoal_Contatos.xlsx',
    format: 'XLSX',
    source: 'CRM Pessoal · Gêmeos (Exemplo)',
    processedAt: 'Exemplo · 12 Nov 11:20',
    confidence: 0.95,
    extractedPreview: 'Mapeamento de relacionamentos, pendências e histórico de interações isolado na instância.',
    errorsFound: null,
    targetPhase: 'Fase 5 · Intelligence Engine',
    isDemo: true,
  },
  {
    id: 'art-04',
    title: 'Documento_Anexo_Outlook_Gmail.pdf',
    format: 'PDF',
    source: 'Conector E-mail da Instância (Exemplo)',
    processedAt: 'Exemplo · 10 Nov 16:05',
    confidence: 0.92,
    extractedPreview: 'Extração textual + OCR isolada para o agente principal desta instalação.',
    errorsFound: null,
    targetPhase: 'Fase 5 · Intelligence Engine',
    isDemo: true,
  },
];

export const DEMO_SCHEDULED_TASKS: ScheduledTask[] = [
  {
    id: 'sch-01',
    name: 'Resumo matinal WhatsApp + Gmail + Outlook (Instância Local)',
    frequency: 'Diário',
    scheduleTime: '07:30',
    enabled: true,
    requiresConfirmation: false,
    targetPhase: 'Fase 5 · Intelligence Engine',
    isDemo: true,
    lastExecution: {
      executionId: 'demo-exec-101',
      executedAt: 'Exemplo · 07:30',
      status: 'pendente_vps',
      attempts: 0,
      summary: 'Associado exclusivamente ao instance_id e agent_id desta instalação.',
    },
  },
  {
    id: 'sch-02',
    name: 'Revisão de pendências do CRM Pessoal e Grupos',
    frequency: 'Horário específico',
    scheduleTime: '18:00',
    enabled: true,
    requiresConfirmation: true,
    targetPhase: 'Fase 5 · Intelligence Engine',
    isDemo: true,
    lastExecution: {
      executionId: 'demo-exec-102',
      executedAt: 'Exemplo · 18:00',
      status: 'pendente_vps',
      attempts: 0,
      summary: 'Nenhuma mensagem é enviada sem aprovação humana.',
    },
  },
  {
    id: 'sch-03',
    name: 'Consolidação semanal de memória da instância',
    frequency: 'Semanal',
    scheduleTime: 'Segunda · 08:00',
    enabled: false,
    requiresConfirmation: false,
    targetPhase: 'Fase 5 · Intelligence Engine',
    isDemo: true,
    lastExecution: {
      executionId: 'demo-exec-103',
      executedAt: 'Pausado',
      status: 'pendente_vps',
      attempts: 0,
      summary: 'Tarefa demonstrativa desativada localmente.',
    },
  },
];

export const DEMO_RADAR_SIGNALS: RadarSignal[] = [
  {
    id: 'rad-01',
    title: 'Pendência identificada em conversa/grupo do WhatsApp da instância (Exemplo)',
    summary: 'Sinal detectado pelo Conversation Intelligence + CRM Pessoal para o agente principal deste aparelho.',
    category: 'conversas_relevantes',
    priority: 'alta',
    classification: 'fato',
    origin: 'Exemplo · Conversation Intelligence (Instância Local)',
    detectedAt: 'Exemplo · 08:45',
    acknowledged: false,
    isDemo: true,
  },
  {
    id: 'rad-02',
    title: 'E-mail importante sem resposta em Gmail / Outlook da instância (Exemplo)',
    summary: 'Alerta proativo restrito às contas de e-mail conectadas nesta instalação.',
    category: 'emails_sem_resposta',
    priority: 'media',
    classification: 'fato',
    origin: 'Exemplo · Gmail / Outlook Connector',
    detectedAt: 'Exemplo · Ontem',
    acknowledged: false,
    isDemo: true,
  },
  {
    id: 'rad-03',
    title: 'Sugestão de follow-up no CRM Pessoal (Exemplo)',
    summary: 'Sugestão baseada no histórico de interações; nunca promovida a fato sem validação.',
    category: 'compromissos',
    priority: 'baixa',
    classification: 'sugestao',
    origin: 'Exemplo · Memory Engine + Learning Engine',
    detectedAt: 'Exemplo · 12 Nov',
    acknowledged: true,
    isDemo: true,
  },
];

export const CONNECTOR_CATALOG: ConnectorDefinition[] = [
  {
    id: 'conn-whatsapp',
    name: 'WhatsApp da Instância (Dispositivos Conectados)',
    category: 'Mensageria, Grupos, Whisper e Conversation Intelligence',
    status: 'conector_central_dario_os',
    statusLabel: '1 Número por Instalação · Código de Pareamento',
    targetPhase: 'Fase 3 · API & Harness',
    summary:
      'Cada instalação conecta seu próprio número de WhatsApp por código de pareamento de 8 caracteres, vinculado ao instance_id e ao agente principal do aparelho (Gêmeos, Azusa, Croma ou B2B).',
    permissionsRequired: [
      'Pareamento autorizado no celular da instância (Dispositivos conectados -> Conectar com número de telefone)',
      'Isolamento por instance_id + agent_id sem dependência de número único central',
      'Aprovação humana obrigatória para envio de mensagens',
    ],
    technicalConstraints: [
      'O número conectado fica vinculado exclusivamente à instância e ao seu agente principal.',
      'Suporta análise de grupos, transcrição de áudio via Whisper e CRM pessoal.',
      'O código de pareamento é efêmero e nunca persiste em banco ou logs.',
    ],
    securityBoundary:
      'Sessão criptografada isolada por instance_id e connection_id; proibida leitura cruzada entre instalações.',
  },
  {
    id: 'conn-gmail',
    name: 'Gmail da Instância (OAuth 2.0)',
    category: 'E-mail, Compromissos e Learning Engine',
    status: 'requer_oauth_backend',
    statusLabel: 'Conta própria por instalação · Fase 5',
    targetPhase: 'Fase 5 · Intelligence Engine',
    summary: 'Conecta a conta Gmail específica desta instalação (pessoal no Gêmeos, igreja na Azusa, loja na Croma ou comercial no B2B).',
    permissionsRequired: ['gmail.readonly (escopo mínimo inicial)', 'Vínculo estrito ao instance_id'],
    technicalConstraints: [
      'Contas de e-mail de uma instalação nunca ficam visíveis para outra instalação.',
    ],
    securityBoundary: 'Tokens OAuth isolados por instance_id + agent_id no cofre seguro.',
  },
  {
    id: 'conn-outlook',
    name: 'Outlook / Microsoft 365 da Instância (OAuth 2.0)',
    category: 'E-mail Corporativo/Pessoal e Calendário',
    status: 'requer_oauth_backend',
    statusLabel: 'Conta própria por instalação · Fase 5',
    targetPhase: 'Fase 5 · Intelligence Engine',
    summary: 'Integração Microsoft Graph (Mail.Read, Calendars.Read) isolada para a conta Outlook configurada nesta instalação.',
    permissionsRequired: ['Mail.Read', 'Calendars.Read', 'offline_access'],
    technicalConstraints: [
      'Alimenta o Radar, o CRM pessoal e o Learning Engine apenas dentro do escopo do instance_id atual.',
    ],
    securityBoundary: 'Isolamento total de credenciais e mensagens por instância.',
  },
  {
    id: 'conn-model-harness',
    name: 'Model Router + Inferência Local Android (Gemma · Nemotron · Qwen)',
    category: 'Modelos Principal e Secundário Independentes da Memória',
    status: 'nao_configurado',
    statusLabel: 'Configurável por Instância · Fase 3',
    targetPhase: 'Fase 3 · API & Harness',
    summary:
      'Permite escolher o Modelo Principal e o Modelo Secundário de cada instalação (Gemma local no Android, NVIDIA Nemotron, Qwen, Llama, Gemini), mantendo a memória e a identidade do agente independentes do modelo.',
    permissionsRequired: ['Roteador de modelos na VPS ou runtime local Android para Gemma'],
    technicalConstraints: [
      'Trocar de modelo principal ou secundário nunca altera nem apaga a memória ou a identidade do agente.',
      'Suporta inferência local no Android (Gemma) para triagem rápida e privacidade offline.',
    ],
    securityBoundary: 'Contexto enviado ao modelo sempre restrito ao instance_id e agent_id ativos.',
  },
];

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'not-01',
    title: 'Isolamento Multi-Instância Ativo',
    detail: 'Esta instalação possui instance_id, agente principal, banco local e modelos próprios.',
    timestamp: 'Agora',
    read: false,
    targetTab: 'conectores',
    isDemo: true,
  },
  {
    id: 'not-02',
    title: 'Prioridade #1: Gêmeos (Twin) no Celular Pessoal',
    detail: 'Pipeline preparado para WhatsApp pessoal, Gmail, Outlook, Whisper, CRM pessoal e Gemma/Nemotron/Qwen.',
    timestamp: '08:45',
    read: false,
    targetTab: 'radar',
    isDemo: true,
  },
  {
    id: 'not-03',
    title: 'Agendamento da Instância Local',
    detail: 'Rotinas programadas operam isoladas para o agente principal deste aparelho.',
    timestamp: '07:30',
    read: true,
    targetTab: 'agendados',
    isDemo: true,
  },
];
