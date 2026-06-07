import { PrismaClient } from '@prisma/client';

export const UPSTREAM_PROVIDER_ID = 'n1n';
export const PRICE_MARKUP = 1.3;

type UpstreamModel = {
  id?: string;
  name?: string;
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

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function applyMarkup(price: number): number {
  return Number((price * PRICE_MARKUP).toFixed(8));
}

export function formatModelName(modelCode: string): string {
  return modelCode
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => {
      if (part.toLowerCase() === 'gpt') return 'GPT';
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
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upstream models request failed: ${response.status} ${body}`);
  }

  return response.json();
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
    const provider = await prisma.provider.findUnique({
      where: { id: UPSTREAM_PROVIDER_ID },
    });

    const baseUrl = process.env.UPSTREAM_BASE_URL || provider?.baseUrl || 'https://api.n1n.ai/v1';
    const apiKey = process.env.OPENAI_API_KEY || provider?.apiKey;

    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY or provider apiKey');
    }

    const payload = await fetchUpstreamModels(baseUrl, apiKey);
    const models = await syncUpstreamModels(prisma, payload, UPSTREAM_PROVIDER_ID);
    console.log(`Synced ${models.length} upstream models with 30% markup`);
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
