import {
  DarioAgentId,
  WhatsAppConnectionRecord,
  WhatsAppProviderType,
} from '../domain/models';

export interface ApiHealthResult {
  reachable: boolean;
  statusCode?: number;
  message: string;
  checkedAt: string;
}

export interface WhatsAppPairingRequestPayload {
  phone_number: string;
  provider: WhatsAppProviderType;
  default_agent_id: DarioAgentId;
}

export interface WhatsAppPairingResult {
  ok: boolean;
  connection_id?: string;
  /**
   * Ephemeral 8-character pairing code returned by Dario OS when the WhatsApp Web
   * Multi-Device socket (`requestPairingCode`) is active on the VPS.
   * NEVER persisted to disk, IndexedDB, localStorage, or logs.
   */
  ephemeral_pairing_code?: string;
  expires_in_seconds?: number;
  message: string;
  requested_at: string;
}

export function normalizeWhatsAppPhoneNumber(rawInput: string): string {
  return rawInput.replace(/\D+/g, '');
}

export function isValidWhatsAppPhoneNumber(rawInput: string): boolean {
  const digits = normalizeWhatsAppPhoneNumber(rawInput);
  return digits.length >= 10 && digits.length <= 15;
}

export interface DarioApiClient {
  getBaseUrl(): string;
  checkHealth(timeoutMs?: number): Promise<ApiHealthResult>;
  requestWhatsAppPairingCode(
    payload: WhatsAppPairingRequestPayload,
    timeoutMs?: number
  ): Promise<WhatsAppPairingResult>;
  fetchWhatsAppConnections(timeoutMs?: number): Promise<{
    ok: boolean;
    connections: WhatsAppConnectionRecord[];
    message: string;
  }>;
}

export class HttpDarioApiClient implements DarioApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.trim().replace(/\/+$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async checkHealth(timeoutMs = 4000): Promise<ApiHealthResult> {
    const checkedAt = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (!this.baseUrl) {
      return {
        reachable: false,
        message: 'Nenhum endpoint do Dario OS configurado. Operando em modo local de inspeção.',
        checkedAt,
      };
    }

    try {
      new URL(this.baseUrl);
    } catch {
      return {
        reachable: false,
        message: 'URL do Dario OS inválida. Informe um endereço http:// ou https:// válido.',
        checkedAt,
      };
    }

    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      return {
        reachable: response.ok,
        statusCode: response.status,
        message: response.ok
          ? `Dario OS respondeu HTTP ${response.status} em /health.`
          : `Dario OS respondeu com status HTTP ${response.status}.`,
        checkedAt,
      };
    } catch (err) {
      const reason =
        err instanceof DOMException && err.name === 'AbortError'
          ? `Tempo limite excedido (${timeoutMs} ms).`
          : 'Não foi possível alcançar o endpoint /health do Dario OS (rede inacessível, VPS desligada ou CORS).';

      return {
        reachable: false,
        message: reason,
        checkedAt,
      };
    } finally {
      globalThis.clearTimeout(timer);
    }
  }

  async requestWhatsAppPairingCode(
    payload: WhatsAppPairingRequestPayload,
    timeoutMs = 6000
  ): Promise<WhatsAppPairingResult> {
    const requested_at = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const cleanPhone = normalizeWhatsAppPhoneNumber(payload.phone_number);
    if (!isValidWhatsAppPhoneNumber(cleanPhone)) {
      return {
        ok: false,
        message:
          'Número de telefone inválido. Informe o DDI + DDD + número (ex.: 5511999999999, entre 10 e 15 dígitos).',
        requested_at,
      };
    }

    if (!this.baseUrl) {
      return {
        ok: false,
        message:
          'Endpoint do Dario OS não configurado em Configurações. Nenhum código de pareamento fictício foi gerado — conecte a VPS para solicitar o código real ao WhatsApp Connector.',
        requested_at,
      };
    }

    try {
      new URL(this.baseUrl);
    } catch {
      return {
        ok: false,
        message: 'URL base do Dario OS inválida.',
        requested_at,
      };
    }

    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/whatsapp/connections/pairing-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            phone_number: cleanPhone,
            provider: payload.provider,
            default_agent_id: payload.default_agent_id,
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        return {
          ok: false,
          message: `O Dario OS retornou HTTP ${response.status} ao solicitar código de pareamento.`,
          requested_at,
        };
      }

      const data = (await response.json()) as {
        connection_id?: string;
        pairing_code?: string;
        expires_in_seconds?: number;
      };

      if (!data.pairing_code) {
        return {
          ok: false,
          message: 'Resposta do Dario OS não continha o campo pairing_code.',
          requested_at,
        };
      }

      return {
        ok: true,
        connection_id: data.connection_id,
        ephemeral_pairing_code: data.pairing_code,
        expires_in_seconds: data.expires_in_seconds ?? 120,
        message:
          'Código temporário recebido do Dario OS. Digite-o no WhatsApp Business em Dispositivos Conectados -> Conectar com número de telefone.',
        requested_at,
      };
    } catch (err) {
      const reason =
        err instanceof DOMException && err.name === 'AbortError'
          ? `Tempo limite excedido (${timeoutMs} ms) aguardando WhatsApp Connector no Dario OS.`
          : 'Não foi possível contatar /api/v1/whatsapp/connections/pairing-code no Dario OS.';
      return {
        ok: false,
        message: reason,
        requested_at,
      };
    } finally {
      globalThis.clearTimeout(timer);
    }
  }

  async fetchWhatsAppConnections(timeoutMs = 5000): Promise<{
    ok: boolean;
    connections: WhatsAppConnectionRecord[];
    message: string;
  }> {
    if (!this.baseUrl) {
      return {
        ok: false,
        connections: [],
        message: 'Dario OS não configurado. Exibindo registros demonstrativos locais.',
      };
    }

    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/whatsapp/connections`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          ok: false,
          connections: [],
          message: `Dario OS retornou HTTP ${response.status} ao consultar sessões WhatsApp.`,
        };
      }

      const data = (await response.json()) as {
        connections?: WhatsAppConnectionRecord[];
      };

      return {
        ok: true,
        connections: Array.isArray(data.connections) ? data.connections : [],
        message: 'Sessões sincronizadas com o Dario OS.',
      };
    } catch {
      return {
        ok: false,
        connections: [],
        message: 'Não foi possível consultar /api/v1/whatsapp/connections no Dario OS.',
      };
    } finally {
      globalThis.clearTimeout(timer);
    }
  }
}
