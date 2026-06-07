import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  fetchUpstreamModels,
  syncUpstreamModels,
  UPSTREAM_PROVIDER_ID,
} from './model-sync';

const prisma = new PrismaClient();

const PRICE_MARKUP = 1.3;

function withMarkup(price: number): number {
  return Number((price * PRICE_MARKUP).toFixed(8));
}

async function main() {
  console.log('Seeding MatrixAPI database...');

  const adminHash = await bcrypt.hash('admin123456', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@matrixapi.ai',
      passwordHash: adminHash,
      role: 'ADMIN',
      balance: 999999,
      inviteCode: 'ADMIN001',
    },
  });
  console.log('Admin user: admin / admin123456');

  const userHash = await bcrypt.hash('user123456', 10);
  const demoUser = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@matrixapi.ai',
      passwordHash: userHash,
      role: 'USER',
      balance: 100,
      inviteCode: 'DEMO001',
    },
  });
  console.log('Demo user: demo / user123456');

  await prisma.provider.upsert({
    where: { id: UPSTREAM_PROVIDER_ID },
    update: {
      name: 'n1n',
      baseUrl: process.env.UPSTREAM_BASE_URL || 'https://api.n1n.ai/v1',
      apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
      priority: 1,
      status: 'ACTIVE',
    },
    create: {
      id: UPSTREAM_PROVIDER_ID,
      name: 'n1n',
      baseUrl: process.env.UPSTREAM_BASE_URL || 'https://api.n1n.ai/v1',
      apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
      priority: 1,
      status: 'ACTIVE',
    },
  });
  console.log('Provider created: n1n');

  await seedModels();

  await prisma.apiKey.upsert({
    where: { secret: 'sk-demo-matrix-api-key-for-testing' },
    update: {},
    create: {
      userId: demoUser.id,
      name: 'Demo Key',
      secret: 'sk-demo-matrix-api-key-for-testing',
    },
  });
  console.log('Demo API key: sk-demo-matrix-api-key-for-testing');

  await prisma.announcement.upsert({
    where: { id: 'welcome' },
    update: {
      title: 'Welcome to MatrixAPI',
      content: 'MatrixAPI is now live with OpenAI-compatible access through n1n.',
      priority: 10,
      published: true,
    },
    create: {
      id: 'welcome',
      title: 'Welcome to MatrixAPI',
      content: 'MatrixAPI is now live with OpenAI-compatible access through n1n.',
      priority: 10,
      published: true,
    },
  });
  console.log('Sample announcement created');

  await seedGroupsAndDynamicRate();

  console.log('Seeding complete.');
}

async function seedModels() {
  const baseUrl = process.env.UPSTREAM_BASE_URL || 'https://api.n1n.ai/v1';
  const apiKey = process.env.OPENAI_API_KEY || 'sk-placeholder';

  try {
    const payload = await fetchUpstreamModels(baseUrl, apiKey);
    const models = await syncUpstreamModels(prisma, payload, UPSTREAM_PROVIDER_ID);
    console.log(`${models.length} upstream models synced with 30% markup`);
    return;
  } catch (error) {
    console.warn(`Upstream model sync failed, using fallback models: ${error.message}`);
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
  console.log(`${models.length} fallback models created with 30% markup`);
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
