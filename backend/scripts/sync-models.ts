#!/usr/bin/env ts-node
/**
 * 模型同步脚本
 * 用途：从上游 API 同步所有模型，自动应用 40% 加价，并按分类整理
 *
 * 使用方法：
 * npm run sync-models
 *
 * 或使用环境变量：
 * UPSTREAM_BASE_URL=https://api.bblabu.chat/v1 UPSTREAM_API_KEY=sk-xxx npm run sync-models
 */

import { PrismaClient } from '@prisma/client';
import {
  fetchUpstreamModels,
  syncUpstreamModels,
  UPSTREAM_PROVIDER_ID,
  DEFAULT_UPSTREAM_BASE_URL,
  PRICE_MARKUP,
} from '../prisma/model-sync';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('===== MatrixAPI 模型同步工具 =====\n');

    // 1. 获取配置
    const baseUrl = process.env.UPSTREAM_BASE_URL || DEFAULT_UPSTREAM_BASE_URL;
    const apiKey = process.env.UPSTREAM_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('❌ 缺少上游 API Key。请设置环境变量 UPSTREAM_API_KEY 或 OPENAI_API_KEY');
    }

    console.log(`📡 上游地址: ${baseUrl}`);
    console.log(`💰 定价策略: 上游价格 × ${PRICE_MARKUP} (加价 ${((PRICE_MARKUP - 1) * 100).toFixed(0)}%)`);
    console.log(`🔑 使用 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);

    // 2. 确保供应商存在
    const provider = await prisma.provider.upsert({
      where: { id: UPSTREAM_PROVIDER_ID },
      update: {
        name: 'bblabu-upstream',
        baseUrl,
        apiKey,
        priority: 1,
        status: 'ACTIVE',
      },
      create: {
        id: UPSTREAM_PROVIDER_ID,
        name: 'bblabu-upstream',
        baseUrl,
        apiKey,
        priority: 1,
        status: 'ACTIVE',
      },
    });
    console.log(`✅ 供应商已配置: ${provider.name}\n`);

    // 3. 获取上游模型列表
    console.log('🔄 正在从上游获取模型列表...');
    const payload = await fetchUpstreamModels(baseUrl, apiKey);
    const rawModels = Array.isArray(payload) ? payload : payload?.data || [];
    console.log(`📦 从上游获取到 ${rawModels.length} 个模型\n`);

    // 4. 同步模型到数据库
    console.log('💾 正在同步模型到数据库...');
    const models = await syncUpstreamModels(prisma, payload, UPSTREAM_PROVIDER_ID);

    // 5. 按分类统计
    const categoryStats = models.reduce((acc, model) => {
      const cat = model.category || 'general';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n✅ 同步完成！共同步 ${models.length} 个模型\n`);
    console.log('📊 模型分类统计:');
    Object.entries(categoryStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        const categoryName = {
          text: '文本生成',
          image: '图像生成',
          video: '视频生成',
          audio: '音频处理',
          embedding: '嵌入向量',
          moderation: '内容审核',
          general: '通用模型',
        }[category] || category;
        console.log(`  • ${categoryName}: ${count} 个模型`);
      });

    // 6. 显示价格示例
    console.log('\n💵 价格示例 (前 5 个模型):');
    models.slice(0, 5).forEach((model) => {
      console.log(`  • ${model.name}`);
      console.log(`    模型代码: ${model.modelCode}`);
      console.log(`    分类: ${model.category || 'general'}`);
      console.log(`    输入价格: $${model.inputPrice.toFixed(6)} / 1M tokens`);
      console.log(`    输出价格: $${model.outputPrice.toFixed(6)} / 1M tokens`);
    });

    console.log('\n✨ 所有模型已成功同步并应用 40% 加价！');
  } catch (error: any) {
    console.error('\n❌ 同步失败:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
