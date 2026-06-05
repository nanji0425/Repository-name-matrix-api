import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MatrixAPI database...');

  // Create admin user
  const adminHash = await bcrypt.hash('admin123456', 10);
  const admin = await prisma.user.upsert({
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
  console.log(`✅ Admin user: admin / admin123456`);

  // Create demo user
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
  console.log(`✅ Demo user: demo / user123456`);

  // Create providers
  const providers = [
    { name: 'OpenAI', baseUrl: 'https://api.openai.com', apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder', priority: 1 },
    { name: 'Anthropic', baseUrl: 'https://api.anthropic.com', apiKey: process.env.ANTHROPIC_API_KEY || 'sk-placeholder', priority: 2 },
    { name: 'Google AI', baseUrl: 'https://generativelanguage.googleapis.com', apiKey: process.env.GEMINI_API_KEY || 'placeholder', priority: 3 },
    { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', apiKey: process.env.DEEPSEEK_API_KEY || 'sk-placeholder', priority: 4 },
    { name: 'Qwen', baseUrl: 'https://dashscope.aliyuncs.com', apiKey: process.env.QWEN_API_KEY || 'sk-placeholder', priority: 5 },
    { name: 'xAI', baseUrl: 'https://api.x.ai', apiKey: process.env.XAI_API_KEY || 'xai-placeholder', priority: 6 },
  ];

  const createdProviders = await Promise.all(
    providers.map(p =>
      prisma.provider.upsert({
        where: { id: p.name.toLowerCase() },
        update: p,
        create: { id: p.name.toLowerCase(), ...p },
      }),
    ),
  );
  console.log(`✅ ${createdProviders.length} providers created`);

  // Create models with pricing
  const models = [
    { name: 'GPT-4o', modelCode: 'gpt-4o', providerId: 'openai', inputPrice: 0.005, outputPrice: 0.015, multiplier: 1, sortOrder: 1 },
    { name: 'GPT-4o Mini', modelCode: 'gpt-4o-mini', providerId: 'openai', inputPrice: 0.00015, outputPrice: 0.0006, multiplier: 1, sortOrder: 2 },
    { name: 'GPT-4 Turbo', modelCode: 'gpt-4-turbo', providerId: 'openai', inputPrice: 0.01, outputPrice: 0.03, multiplier: 1, sortOrder: 3 },
    { name: 'Claude 3.5 Sonnet', modelCode: 'claude-3-5-sonnet-20241022', providerId: 'anthropic', inputPrice: 0.003, outputPrice: 0.015, multiplier: 1, sortOrder: 4 },
    { name: 'Claude 3.5 Haiku', modelCode: 'claude-3-5-haiku-20241022', providerId: 'anthropic', inputPrice: 0.0008, outputPrice: 0.004, multiplier: 1, sortOrder: 5 },
    { name: 'Gemini 1.5 Pro', modelCode: 'gemini-1.5-pro', providerId: 'google ai', inputPrice: 0.00125, outputPrice: 0.005, multiplier: 1, sortOrder: 6 },
    { name: 'Gemini 1.5 Flash', modelCode: 'gemini-1.5-flash', providerId: 'google ai', inputPrice: 0.000075, outputPrice: 0.0003, multiplier: 1, sortOrder: 7 },
    { name: 'DeepSeek V3', modelCode: 'deepseek-chat', providerId: 'deepseek', inputPrice: 0.0005, outputPrice: 0.002, multiplier: 1, sortOrder: 8 },
    { name: 'DeepSeek R1', modelCode: 'deepseek-reasoner', providerId: 'deepseek', inputPrice: 0.00055, outputPrice: 0.00219, multiplier: 1, sortOrder: 9 },
    { name: 'Qwen Max', modelCode: 'qwen-max', providerId: 'qwen', inputPrice: 0.002, outputPrice: 0.006, multiplier: 1, sortOrder: 10 },
    { name: 'Qwen Plus', modelCode: 'qwen-plus', providerId: 'qwen', inputPrice: 0.0008, outputPrice: 0.002, multiplier: 1, sortOrder: 11 },
    { name: 'Grok 2', modelCode: 'grok-2', providerId: 'xai', inputPrice: 0.002, outputPrice: 0.01, multiplier: 1, sortOrder: 12 },
  ];

  await Promise.all(
    models.map(m =>
      prisma.model.upsert({
        where: { modelCode: m.modelCode },
        update: m,
        create: m,
      }),
    ),
  );
  console.log(`✅ ${models.length} models created`);

  // Create a demo API key
  await prisma.apiKey.upsert({
    where: { secret: 'sk-demo-matrix-api-key-for-testing' },
    update: {},
    create: {
      userId: demoUser.id,
      name: 'Demo Key',
      secret: 'sk-demo-matrix-api-key-for-testing',
    },
  });
  console.log(`✅ Demo API key: sk-demo-matrix-api-key-for-testing`);

  // Create sample announcement
  await prisma.announcement.upsert({
    where: { id: 'welcome' },
    update: {},
    create: {
      id: 'welcome',
      title: '🎉 Welcome to MatrixAPI',
      content: 'MatrixAPI is now live! We support GPT-4o, Claude 3.5, Gemini, DeepSeek, Qwen, and more. Get started today.',
      priority: 10,
      published: true,
    },
  });
  console.log(`✅ Sample announcement created`);

  // Seed groups and dynamic rate
  await seedGroupsAndDynamicRate();

  console.log('🎉 Seeding complete!');
}

/**
 * Seed groups and dynamic rate
 */
async function seedGroupsAndDynamicRate() {
  // Create groups
  const groups = [
    { name: 'codex-plus', multiplier: 0.1, desc: 'Codex Plus group — 0.1x multiplier' },
    { name: 'codex-pro', multiplier: 0.18, desc: 'Codex Pro group — 0.18x multiplier' },
    { name: 'default', multiplier: 1.0, desc: 'Default group — 1.0x multiplier' },
    { name: 'test', multiplier: 2.0, desc: 'Test group — 2.0x multiplier' },
  ];

  await Promise.all(
    groups.map(g =>
      prisma.group.upsert({
        where: { name: g.name },
        update: { multiplier: g.multiplier, desc: g.desc },
        create: g,
      }),
    ),
  );
  console.log(`✅ ${groups.length} groups created`);

  // Create dynamic rate
  await prisma.dynamicRate.create({
    data: {
      rate: 0.0556,
      cap: 0.0650,
    },
  });
  console.log('✅ DynamicRate created: rate=0.0556, cap=0.0650');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
