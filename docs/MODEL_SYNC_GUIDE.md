# 模型同步与分类功能

## 概述

MatrixAPI 已实现自动从上游同步所有模型，并自动应用 40% 加价策略和模型分类。

## 功能特性

### 1. 自动定价加价
- 所有模型价格自动在上游基础上 × 1.4 (加价 40%)
- 输入价格和输出价格均应用加价
- 价格精确到小数点后 8 位

### 2. 模型自动分类
模型根据名称自动分类为以下类别：

| 分类 | 说明 | 示例 |
|------|------|------|
| `text` | 文本生成模型 | GPT-4, Claude, Gemini, DeepSeek, Qwen |
| `image` | 图像生成模型 | DALL-E, Midjourney, Stable Diffusion, Flux |
| `video` | 视频生成模型 | Sora, Runway, Luma, Kling |
| `audio` | 音频处理模型 | Whisper, TTS, Speech |
| `embedding` | 嵌入向量模型 | text-embedding-* |
| `moderation` | 内容审核模型 | moderation-* |
| `general` | 通用/未分类 | 其他模型 |

### 3. 数据库 Schema

模型表新增 `category` 字段：

```prisma
model Model {
  // ... 其他字段
  category     String?  @default("general")
}
```

## 使用方法

### 方式 1: 使用同步脚本 (推荐)

```bash
# 在 backend 目录下运行
cd backend

# 使用默认配置同步
npm run sync-models

# 或指定上游地址和 API Key
UPSTREAM_BASE_URL=https://api.bblabu.chat/v1 \
UPSTREAM_API_KEY=sk-your-key \
npm run sync-models
```

### 方式 2: 在 seed 时自动同步

```bash
# 种子数据会自动从上游同步模型
npm run prisma:seed
```

### 方式 3: 直接运行 model-sync.ts

```bash
# 独立运行模型同步
cd backend
npm run models:sync
```

## 配置说明

### 环境变量

在 `.env` 文件中配置：

```env
# 上游 API 配置
UPSTREAM_BASE_URL=https://api.bblabu.chat/v1
UPSTREAM_API_KEY=sk-6ShTzN3ocQIlJfYXHjiu6BlaUUlmFhYQtQPrKERTPGkI

# 或使用通用的 OpenAI API Key 变量
OPENAI_API_KEY=sk-your-key
```

### 定价配置

在 `backend/prisma/model-sync.ts` 中：

```typescript
export const PRICE_MARKUP = 1.4;  // 40% 加价
```

修改此值可以调整加价比例。

## 数据库迁移

如果数据库中的 models 表还没有 `category` 字段，运行迁移：

```bash
cd backend

# 方式 1: 使用 Prisma 迁移
npx prisma migrate deploy

# 方式 2: 直接执行 SQL
psql -U matrixapi -d matrix_api -f prisma/migrations/add_model_category.sql
```

## API 使用

### 获取所有模型（按分类）

```typescript
// 获取所有文本生成模型
const textModels = await prisma.model.findMany({
  where: { category: 'text', status: 'ACTIVE' },
  orderBy: { sortOrder: 'asc' }
});

// 按分类分组
const modelsByCategory = await prisma.model.groupBy({
  by: ['category'],
  _count: true,
  where: { status: 'ACTIVE' }
});
```

### 显示模型价格

模型价格已自动应用 40% 加价：

```typescript
const model = await prisma.model.findUnique({
  where: { modelCode: 'gpt-4' }
});

console.log(`输入价格: $${model.inputPrice} / 1M tokens`);
console.log(`输出价格: $${model.outputPrice} / 1M tokens`);
// 这些价格已经是上游价格 × 1.4
```

## 同步输出示例

```
===== MatrixAPI 模型同步工具 =====

📡 上游地址: https://api.bblabu.chat/v1
💰 定价策略: 上游价格 × 1.4 (加价 40%)
🔑 使用 API Key: sk-6ShTzN...kI

✅ 供应商已配置: bblabu-upstream

🔄 正在从上游获取模型列表...
📦 从上游获取到 156 个模型

💾 正在同步模型到数据库...

✅ 同步完成！共同步 156 个模型

📊 模型分类统计:
  • 文本生成: 89 个模型
  • 图像生成: 34 个模型
  • 音频处理: 12 个模型
  • 嵌入向量: 8 个模型
  • 视频生成: 6 个模型
  • 内容审核: 3 个模型
  • 通用模型: 4 个模型

💵 价格示例 (前 5 个模型):
  • GPT-4 Turbo
    模型代码: gpt-4-turbo
    分类: text
    输入价格: $0.014000 / 1M tokens
    输出价格: $0.042000 / 1M tokens
  ...

✨ 所有模型已成功同步并应用 40% 加价！
```

## 注意事项

1. **价格更新**: 每次运行同步脚本都会更新模型价格，保持与上游一致（加价后）
2. **模型状态**: 同步时不会删除现有模型，只会更新或新增
3. **分类准确性**: 分类基于模型代码的关键词匹配，可能需要人工调整特殊情况
4. **并发同步**: 建议在低峰期运行同步任务，避免影响生产环境

## 故障排查

### 同步失败

```bash
❌ 同步失败: Upstream models request failed: 401

# 检查 API Key 是否正确
echo $UPSTREAM_API_KEY

# 测试上游 API
curl -H "Authorization: Bearer $UPSTREAM_API_KEY" \
     https://api.bblabu.chat/v1/models
```

### 分类不准确

手动更新模型分类：

```sql
UPDATE models SET category = 'video' WHERE model_code LIKE 'sora%';
```

或在代码中修改 `categorizeModel()` 函数的规则。

## 相关文件

- `backend/prisma/model-sync.ts` - 核心同步逻辑
- `backend/scripts/sync-models.ts` - CLI 同步工具
- `backend/prisma/seed.ts` - 使用模型同步的种子文件
- `backend/prisma/schema.prisma` - 数据库 Schema
- `backend/prisma/migrations/add_model_category.sql` - 数据库迁移文件
