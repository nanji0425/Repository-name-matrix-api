import { PrismaClient } from '@prisma/client';

export const UPSTREAM_PROVIDER_ID = 'bblabu';
export const DEFAULT_UPSTREAM_BASE_URL = 'https://api.bblabu.chat/v1';
export const PRICE_MARKUP = 1.4;

type UpstreamModel = {
  id?: string;
  name?: string;
  owned_by?: string;
  provider?: string;
  pricing?: {
    input?: number | string;
    output?: number | string;
    prompt?: number | string;
    completion?: number | string;
  };
  input_price?: number | string;
  output_price?: number | string;
  prompt_price?: number | string;
  completion_price?: number | string;
};

type ModelSeed = {
  name: string;
  modelCode: string;
  providerId: string;
  inputPrice: number;
  outputPrice: number;
  multiplier: number;
  status: string;
  sortOrder: number;
};

type UpstreamCandidate = {
  url: string;
  headers: Record<string, string>;
};

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function hasPositivePrice(input: number, output: number): boolean {
  return input > 0 || output > 0;
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

function buildBaseVariants(baseUrl: string) {
  const normalized = normalizeBaseUrl(baseUrl);
  const parsed = new URL(normalized);
  const baseOrigin = parsed.origin;
  const rootPath = parsed.pathname.replace(/\/(v1|api|keys|models|pricing|sign-in|login|dashboard|console)\/?$/i, '').replace(/\/+$/, '');
  const root = rootPath ? `${parsed.origin}${rootPath}` : baseOrigin;
  const alternateHost = parsed.hostname.startsWith('api.')
    ? `${parsed.protocol}//${parsed.hostname.replace(/^api\./i, '')}${parsed.port ? `:${parsed.port}` : ''}${rootPath}`
    : `${parsed.protocol}//api.${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}${rootPath}`;

  return unique([normalized, root, alternateHost]);
}

export function buildUpstreamCandidates(baseUrl: string, apiKey: string): UpstreamCandidate[] {
  const headers = [
    { Authorization: `Bearer ${apiKey}` },
    { Authorization: apiKey },
    { 'api-key': apiKey },
    { 'x-api-key': apiKey },
  ];

  return buildBaseVariants(baseUrl).flatMap((candidateBase) =>
    headers.map((header) => ({
      url: `${candidateBase.replace(/\/+$/, '')}/models`,
      headers: header,
    })),
  );
}

export function applyMarkup(price: number): number {
  return Number((price * PRICE_MARKUP).toFixed(8));
}

export function formatModelName(modelCode: string): string {
  const overrides: Record<string, string> = {
    openai: 'OpenAI',
    deepseek: 'DeepSeek',
    anthropic: 'Anthropic',
    google: 'Google',
    qwen: 'Qwen',
    minimax: 'MiniMax',
    runway: 'Runway',
    bytedance: 'ByteDance',
    moonshot: 'Moonshot',
    stability: 'Stability',
    luma: 'Luma',
    midjourney: 'Midjourney',
    xai: 'xAI',
  };

  return modelCode
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (overrides[lower]) return overrides[lower];
      if (lower === 'gpt') return 'GPT';
      if (lower === 'claude') return 'Claude';
      if (lower === 'deepseek') return 'DeepSeek';
      if (lower === 'gemini') return 'Gemini';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

export function normalizeUpstreamModels(payload: any, providerId = UPSTREAM_PROVIDER_ID): ModelSeed[] {
  const rawModels: UpstreamModel[] = Array.isArray(payload) ? payload : payload?.data || [];
  const seen = new Set<string>();

  return rawModels
    .map((model) => {
      const modelCode = String(model?.id || '').trim();
      if (!modelCode || seen.has(modelCode)) return null;
      seen.add(modelCode);

      const input = toNumber(model.pricing?.input ?? model.pricing?.prompt ?? model.input_price ?? model.prompt_price);
      const output = toNumber(model.pricing?.output ?? model.pricing?.completion ?? model.output_price ?? model.completion_price);
      if (!hasPositivePrice(input, output)) return null;

      return {
        name: model.name || formatModelName(modelCode),
        modelCode,
        providerId,
        inputPrice: applyMarkup(input),
        outputPrice: applyMarkup(output),
        multiplier: 1,
        status: 'ACTIVE',
        sortOrder: seen.size,
      };
    })
    .filter((model): model is ModelSeed => Boolean(model));
}

export async function fetchUpstreamModels(baseUrl: string, apiKey: string): Promise<any> {
  let lastError: Error | null = null;

  for (const candidate of buildUpstreamCandidates(baseUrl, apiKey)) {
    try {
      const response = await fetch(candidate.url, { headers: candidate.headers });
      if (!response.ok) {
        const body = await response.text();
        lastError = new Error(`Upstream models request failed: ${response.status} ${body}`);
        continue;
      }

      return response.json();
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error('Upstream models request failed');
}

export async function syncUpstreamModels(prisma: PrismaClient, payload: any, providerId = UPSTREAM_PROVIDER_ID) {
  const models = normalizeUpstreamModels(payload, providerId);

  for (const model of models) {
    await prisma.model.upsert({
      where: { modelCode: model.modelCode },
      update: model,
      create: model,
    });
  }

  return models;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const configuredApiKey = process.env.UPSTREAM_API_KEY || process.env.OPENAI_API_KEY;
    if (!configuredApiKey) {
      throw new Error('Missing UPSTREAM_API_KEY or OPENAI_API_KEY');
    }

    const provider = await prisma.provider.upsert({
      where: { id: UPSTREAM_PROVIDER_ID },
      update: {
        name: 'bblabu',
        baseUrl: process.env.UPSTREAM_BASE_URL || DEFAULT_UPSTREAM_BASE_URL,
        apiKey: configuredApiKey,
        priority: 1,
        status: 'ACTIVE',
      },
      create: {
        id: UPSTREAM_PROVIDER_ID,
        name: 'bblabu',
        baseUrl: process.env.UPSTREAM_BASE_URL || DEFAULT_UPSTREAM_BASE_URL,
        apiKey: configuredApiKey,
        priority: 1,
        status: 'ACTIVE',
      },
    });

    const baseUrl = process.env.UPSTREAM_BASE_URL || provider.baseUrl;
    const apiKey = process.env.UPSTREAM_API_KEY || process.env.OPENAI_API_KEY || provider.apiKey;

    if (!apiKey) {
      throw new Error('Missing UPSTREAM_API_KEY or provider apiKey');
    }

    const payload = await fetchUpstreamModels(baseUrl, apiKey);
    const models = await syncUpstreamModels(prisma, payload, UPSTREAM_PROVIDER_ID);
    console.log(`Synced ${models.length} upstream models with 40% markup`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
