const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding groups and dynamic rate...');

  const groups = [
    { name: 'codex-plus', multiplier: 0.1, desc: 'Codex Plus group - 0.1x multiplier' },
    { name: 'codex-pro', multiplier: 0.18, desc: 'Codex Pro group - 0.18x multiplier' },
    { name: 'default', multiplier: 1.0, desc: 'Default group - 1.0x multiplier' },
    { name: 'test', multiplier: 2.0, desc: 'Test group - 2.0x multiplier' },
  ];

  for (const g of groups) {
    await prisma.group.upsert({
      where: { name: g.name },
      update: { multiplier: g.multiplier, desc: g.desc },
      create: g,
    });
  }
  console.log(`Created ${groups.length} groups`);

  await prisma.dynamicRate.create({
    data: { rate: 0.0556, cap: 0.0650 },
  });
  console.log('DynamicRate created: rate=0.0556, cap=0.0650');

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
