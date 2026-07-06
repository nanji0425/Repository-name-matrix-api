import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  fetchUpstreamModels,
  DEFAULT_UPSTREAM_BASE_URL,
  syncUpstreamModels,
  UPSTREAM_PROVIDER_ID,
} from './model-sync';

const prisma = new PrismaClient();

const PRICE_MARKUP = 1.4;

function withMarkup(price: number): number {
  return Number((price * PRICE_MARKUP).toFixed(8));
}

function getRequiredUpstreamApiKey() {
  const apiKey = process.env.UPSTREAM_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('UPSTREAM_API_KEY must be set before seeding production data');
  }
  return apiKey;
}

async function main() {
  console.log('Seeding MatrixAPI database...');

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD must be set to at least 12 characters before seeding production data');
  }
  const demoEnabled = process.env.ENABLE_DEMO_DATA === 'true';
  const demoPassword = process.env.DEMO_PASSWORD;
  if (demoEnabled && (!demoPassword || demoPassword.length < 12)) {
    throw new Error('DEMO_PASSWORD must be set to at least 12 characters when ENABLE_DEMO_DATA=true');
  }
  const upstreamBaseUrl = process.env.UPSTREAM_BASE_URL || DEFAULT_UPSTREAM_BASE_URL;
  const upstreamApiKey = getRequiredUpstreamApiKey();
  const upstreamPayload = await loadUpstreamPayload(upstreamBaseUrl, upstreamApiKey);

  const adminHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      passwordHash: adminHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      username: adminUsername,
      email: process.env.ADMIN_EMAIL || `${adminUsername}@matrixapi.local`,
      passwordHash: adminHash,
      role: 'ADMIN',
      balance: 999999,
      inviteCode: 'ADMIN001',
    },
  });
  console.log(`Admin user created or verified: ${adminUsername}`);

  await prisma.provider.upsert({
    where: { id: UPSTREAM_PROVIDER_ID },
    update: {
      name: 'bblabu',
      baseUrl: upstreamBaseUrl,
      apiKey: upstreamApiKey,
      priority: 1,
      status: 'ACTIVE',
    },
    create: {
      id: UPSTREAM_PROVIDER_ID,
      name: 'bblabu',
      baseUrl: upstreamBaseUrl,
      apiKey: upstreamApiKey,
      priority: 1,
      status: 'ACTIVE',
    },
  });
  console.log('Provider created: bblabu');

  await seedModels(upstreamPayload);

  if (demoEnabled) {
    const userHash = await bcrypt.hash(demoPassword, 10);
    const demoUser = await prisma.user.upsert({
      where: { username: 'demo' },
      update: {
        passwordHash: userHash,
        status: 'ACTIVE',
      },
      create: {
        username: 'demo',
        email: 'demo@matrixapi.ai',
        passwordHash: userHash,
        role: 'USER',
        balance: 100,
        inviteCode: 'DEMO001',
      },
    });
    console.log('Demo user created or verified: demo');

    const demoApiKey = process.env.DEMO_API_KEY;
    if (demoApiKey) {
      await prisma.apiKey.upsert({
        where: { secret: demoApiKey },
        update: { status: 'ACTIVE' },
        create: {
          userId: demoUser.id,
          name: 'Demo Key',
          secret: demoApiKey,
        },
      });
      console.log('Demo API key created for non-production demo use');
    }
  }

  await prisma.announcement.upsert({
    where: { id: 'welcome' },
    update: {
      title: 'Welcome to MatrixAPI',
      content: 'MatrixAPI is now live with OpenAI-compatible gateway access.',
      priority: 10,
      published: true,
    },
    create: {
      id: 'welcome',
      title: 'Welcome to MatrixAPI',
      content: 'MatrixAPI is now live with OpenAI-compatible gateway access.',
      priority: 10,
      published: true,
    },
  });
  console.log('Sample announcement created');

  await seedGroupsAndDynamicRate();

  console.log('Seeding complete.');
}

async function loadUpstreamPayload(baseUrl: string, apiKey: string) {
  try {
    return await fetchUpstreamModels(baseUrl, apiKey);
  } catch (error) {
    if (process.env.ALLOW_FALLBACK_MODELS !== 'true') {
      throw new Error(`Upstream model sync failed: ${error.message}`);
    }

    console.warn(`Upstream model sync failed, using fallback models because ALLOW_FALLBACK_MODELS=true: ${error.message}`);
    return null;
  }
}

async function seedModels(upstreamPayload: any) {
  if (upstreamPayload) {
    const models = await syncUpstreamModels(prisma, upstreamPayload, UPSTREAM_PROVIDER_ID);
    console.log(`${models.length} upstream models synced with 40% markup`);
    return;
  }

  const models = [
    { name: 'GPT-5.5', modelCode: 'gpt-5.5', inputPrice: 0.5, outputPrice: 3.0, sortOrder: 1 },
    { name: 'GPT-5.4', modelCode: 'gpt-5.4', inputPrice: 0.25, outputPrice: 1.5, sortOrder: 2 },
    { name: 'GPT-5.4 Mini', modelCode: 'gpt-5.4-mini', inputPrice: 0.25, outputPrice: 1.5, sortOrder: 3 },
    { name: 'GPT-5.3 Codex', modelCode: 'gpt-5.3-codex', inputPrice: 1.75, outputPrice: 14.0, sortOrder: 4 },
    { name: 'GPT-5.2', modelCode: 'gpt-5.2', inputPrice: 75.0, outputPrice: 600.0, sortOrder: 5 },
    { name: 'Codex Auto Review', modelCode: 'codex-auto-review', inputPrice: 0.5, outputPrice: 3.0, sortOrder: 6 },
    { name: 'GPT Image 2', modelCode: 'gpt-image-2', inputPrice: 0.06, outputPrice: 0, sortOrder: 7 },
  ].map(model => ({
    ...model,
    providerId: UPSTREAM_PROVIDER_ID,
    inputPrice: withMarkup(model.inputPrice),
    outputPrice: withMarkup(model.outputPrice),
    multiplier: 1,
    status: 'ACTIVE',
  }));

  await Promise.all(
    models.map(model =>
      prisma.model.upsert({
        where: { modelCode: model.modelCode },
        update: model,
        create: model,
      }),
    ),
  );
  console.log(`${models.length} fallback models created with 40% markup`);
}

async function seedGroupsAndDynamicRate() {
  const groups = [
    { name: 'codex-plus', multiplier: 0.1, desc: 'Codex Plus group - 0.1x multiplier' },
    { name: 'codex-pro', multiplier: 0.18, desc: 'Codex Pro group - 0.18x multiplier' },
    { name: 'default', multiplier: 1.0, desc: 'Default group - 1.0x multiplier' },
    { name: 'test', multiplier: 2.0, desc: 'Test group - 2.0x multiplier' },
  ];

  await Promise.all(
    groups.map(group =>
      prisma.group.upsert({
        where: { name: group.name },
        update: { multiplier: group.multiplier, desc: group.desc },
        create: group,
      }),
    ),
  );
  console.log(`${groups.length} groups created`);

  const latestRate = await prisma.dynamicRate.findFirst({
    orderBy: { createdAt: 'desc' },
  });
  if (!latestRate) {
    await prisma.dynamicRate.create({
      data: {
        rate: 0.0556,
        cap: 0.065,
      },
    });
    console.log('DynamicRate created: rate=0.0556, cap=0.0650');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
