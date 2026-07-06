import {
  Bot,
  Brain,
  Code2,
  Database,
  FileText,
  Globe2,
  Headphones,
  Image,
  KeyRound,
  Layers3,
  MessageSquare,
  Mic,
  PenLine,
  Route,
  Search,
  ShieldCheck,
  Video,
  WalletCards,
  Zap,
} from 'lucide-react';
import type { TranslationKey } from '@/stores/localeStore';

export const brand = {
  name: 'MatrixAPI',
  email: '3315419516@qq.com',
  baseUrl: 'https://matrixapi.online/v1',
  envKey: 'MATRIX_API_KEY',
};

export const navLinks: { href: string; label: string; labelKey: TranslationKey }[] = [
  { href: '/', label: '首页', labelKey: 'home' },
  { href: '/models', label: '模型广场', labelKey: 'models' },
  { href: '/api-gateway', label: 'API 中转平台', labelKey: 'apiGateway' },
  { href: '/tools', label: '在线创作', labelKey: 'tools' },
  { href: '/solutions', label: '解决方案', labelKey: 'solutions' },
  { href: '/news', label: '资讯', labelKey: 'news' },
  { href: '/docs', label: '文档', labelKey: 'docs' },
  { href: '/about', label: '关于', labelKey: 'about' },
];

export const heroModels = ['OpenAI GPT-4o', 'Claude 3.5', 'Gemini 1.5 Pro', 'DeepSeek V3', 'Llama 3', 'Qwen Max', 'Mistral Large', 'Stable Diffusion 3'];

export const infrastructureCards = {
  zh: [
    { icon: Globe2, title: 'AI Gateway', desc: '统一鉴权、限流、审计和转发能力，把多家模型供应商接入同一个企业级网关。' },
    { icon: Code2, title: '统一 API 接口', desc: '兼容 OpenAI SDK 与常见 HTTP 调用方式，现有业务只需替换 Base URL 即可接入。' },
    { icon: Route, title: '多模型智能路由', desc: '按通道状态、延迟和可用性调度请求，主通道异常时自动切换备用上游。' },
    { icon: WalletCards, title: '成本优化', desc: '按模型、密钥、用户统计消耗，让调用成本、额度和预算清晰可控。' },
  ],
  en: [
    { icon: Globe2, title: 'AI Gateway', desc: 'Unified authentication, rate limits, audit logs, and forwarding across multiple model providers.' },
    { icon: Code2, title: 'Unified API', desc: 'Compatible with OpenAI SDKs and common HTTP calls. Existing apps only need a Base URL change.' },
    { icon: Route, title: 'Smart Routing', desc: 'Route by channel health, latency, and availability, with fallback when primary upstreams fail.' },
    { icon: WalletCards, title: 'Cost Control', desc: 'Track usage by model, key, and user so budget and quota stay transparent.' },
  ],
};

export const developerFeatures = {
  zh: [
    { icon: Zap, title: '一行代码切换 URL', desc: '让现有 OpenAI 应用快速接入 Claude、DeepSeek、Gemini、Qwen 等模型。' },
    { icon: MessageSquare, title: '支持流式输出', desc: '原生支持 SSE 打字机响应，适合聊天、Agent 和实时生成场景。' },
    { icon: Layers3, title: '支持工具调用', desc: '兼容主流模型的 Function Calling 与工具调用能力。' },
  ],
  en: [
    { icon: Zap, title: 'Switch URL In One Line', desc: 'Connect existing OpenAI apps to Claude, DeepSeek, Gemini, Qwen, and more.' },
    { icon: MessageSquare, title: 'Streaming Output', desc: 'Native SSE responses for chat, agents, and real-time generation.' },
    { icon: Layers3, title: 'Tool Calling', desc: 'Compatible with Function Calling and tool-use patterns from mainstream models.' },
  ],
};

export const steps = {
  zh: [
    { title: '注册账号', desc: '使用用户名、密码和邀请码快速创建账号。' },
    { title: '获取 API Key', desc: '在控制台创建专属密钥，完整密钥只展示一次。' },
    { title: '测试调用 API', desc: '复制代码示例，在终端或应用里完成首次验证。' },
    { title: '构建超级应用', desc: '把统一 API 集成进生产环境，持续扩展模型能力。' },
  ],
  en: [
    { title: 'Create Account', desc: 'Sign up quickly with a username, password, and optional invite code.' },
    { title: 'Get API Key', desc: 'Create a dedicated key in the console. The full secret is shown only once.' },
    { title: 'Test API Call', desc: 'Copy a code sample and verify the first request from your terminal or app.' },
    { title: 'Build Production Apps', desc: 'Integrate the unified API into production and keep expanding model coverage.' },
  ],
};

export const solutionCards = {
  zh: [
    { icon: Headphones, title: '智能 AI 客服', desc: '用大模型理解用户意图，全天候处理高频咨询和售后问题。' },
    { icon: PenLine, title: 'AI 写作助理', desc: '高并发生成营销文案、运营内容、脚本和知识库答案。' },
    { icon: Bot, title: 'AI Agent 系统', desc: '结合工具调用完成检索、分析、执行和自动化任务。' },
    { icon: Database, title: '企业知识库', desc: '结合 RAG 架构，让内部文档、FAQ 和产品资料可问可用。' },
    { icon: Search, title: '语义化 AI 搜索', desc: '从关键词匹配升级到意图理解，提高搜索召回与结果质量。' },
  ],
  en: [
    { icon: Headphones, title: 'AI Customer Support', desc: 'Use large models to understand intent and answer frequent support questions around the clock.' },
    { icon: PenLine, title: 'AI Writing Assistant', desc: 'Generate marketing copy, operations content, scripts, and knowledge-base answers at scale.' },
    { icon: Bot, title: 'AI Agent Systems', desc: 'Combine models and tools to complete retrieval, analysis, execution, and automation tasks.' },
    { icon: Database, title: 'Enterprise Knowledge Base', desc: 'Use RAG to make internal documents, FAQs, and product materials searchable and usable.' },
    { icon: Search, title: 'Semantic AI Search', desc: 'Upgrade from keyword matching to intent-aware retrieval and higher-quality results.' },
  ],
};

export const toolCards = {
  zh: [
    { icon: MessageSquare, title: 'AI 聊天', desc: '与先进模型对话，获取创意、代码和业务建议。' },
    { icon: Image, title: '图片生成', desc: '输入提示词，生成高质量图片、海报和视觉素材。' },
    { icon: Video, title: '视频生成', desc: '支持文本/图片到视频创作，覆盖短视频与营销场景。' },
    { icon: Mic, title: '音频生成', desc: '覆盖语音合成、语音识别和音频内容生产。' },
  ],
  en: [
    { icon: MessageSquare, title: 'AI Chat', desc: 'Talk with advanced models for ideas, code, and business guidance.' },
    { icon: Image, title: 'Image Generation', desc: 'Generate high-quality images, posters, and visual assets from prompts.' },
    { icon: Video, title: 'Video Generation', desc: 'Create short-form and marketing videos from text or image prompts.' },
    { icon: Mic, title: 'Audio Generation', desc: 'Cover text-to-speech, transcription, and audio content creation.' },
  ],
};

export const newsPosts = [
  {
    slug: 'model-cost-optimization',
    zh: {
      category: '模型评测',
      date: '2026年6月5日',
      title: '多模型 API 接入指南：如何在生产环境优化调用成本',
      excerpt: '从模型选择、缓存、路由和密钥隔离四个角度，梳理 MatrixAPI 的成本优化实践。',
    },
    en: {
      category: 'Model Review',
      date: 'Jun 5, 2026',
      title: 'Multi-model API Guide: Optimizing Production Usage Cost',
      excerpt: 'A practical look at model choice, caching, routing, and key isolation for better MatrixAPI cost control.',
    },
  },
  {
    slug: 'agent-tools-api',
    zh: {
      category: '开发教程',
      date: '2026年6月4日',
      title: '使用工具调用构建自动化 AI Agent 的实践路径',
      excerpt: '用统一 API 连接模型、工具和业务系统，快速搭建可执行任务的智能体。',
    },
    en: {
      category: 'Developer Guide',
      date: 'Jun 4, 2026',
      title: 'Building Automated AI Agents With Tool Calling',
      excerpt: 'Connect models, tools, and business systems through one API to build agents that can execute real tasks.',
    },
  },
  {
    slug: 'high-availability-routing',
    zh: {
      category: '系统架构',
      date: '2026年6月3日',
      title: '高可用揭秘：如何处理大模型 API 请求的智能路由',
      excerpt: '拆解通道健康检查、故障切换、限流和请求审计的设计要点。',
    },
    en: {
      category: 'Architecture',
      date: 'Jun 3, 2026',
      title: 'High Availability: Smart Routing For Model API Requests',
      excerpt: 'A breakdown of channel health checks, failover, rate limiting, and request auditing.',
    },
  },
];

export const gatewayProblems = {
  zh: [
    { icon: ShieldCheck, title: '官方 API 接入复杂', desc: '账号、网络、付款和合规成本高，接入周期长。' },
    { icon: Code2, title: '不同模型接口不统一', desc: '供应商格式差异大，多模型切换需要重复开发。' },
    { icon: WalletCards, title: '调用成本不透明', desc: '缺少统一账单和项目维度统计，预算难管理。' },
    { icon: Globe2, title: '访问稳定性不足', desc: '直连上游容易超时，生产环境需要可观测和容灾。' },
  ],
  en: [
    { icon: ShieldCheck, title: 'Official API Access Is Complex', desc: 'Accounts, network access, payment, and compliance can slow delivery.' },
    { icon: Code2, title: 'Model APIs Differ', desc: 'Provider formats vary and switching models often requires repeated engineering.' },
    { icon: WalletCards, title: 'Costs Are Hard To Track', desc: 'Without unified billing and project-level usage, budgets are difficult to manage.' },
    { icon: Globe2, title: 'Stability Needs Work', desc: 'Direct upstream access can timeout; production systems need observability and fallback.' },
  ],
};

export const gatewaySolutions = {
  zh: [
    { icon: Code2, title: '统一 API 接口', desc: '全系模型兼容 OpenAI 格式，减少改造成本。' },
    { icon: Route, title: '多模型智能路由', desc: '按上游状态自动选择可用通道，降低失败率。' },
    { icon: WalletCards, title: '统一计费系统', desc: '按用户、密钥、模型统计消耗，账单透明。' },
    { icon: ShieldCheck, title: '高可用架构', desc: '提供审计、限流、熔断和备用通道策略。' },
  ],
  en: [
    { icon: Code2, title: 'Unified API', desc: 'All model families use an OpenAI-compatible format to reduce integration work.' },
    { icon: Route, title: 'Smart Routing', desc: 'Select healthy upstream channels automatically and reduce request failure rates.' },
    { icon: WalletCards, title: 'Unified Billing', desc: 'Track usage by user, key, and model with transparent billing records.' },
    { icon: ShieldCheck, title: 'High Availability', desc: 'Audit, rate limit, circuit breaker, and fallback policies for production traffic.' },
  ],
};

export const supportedFamilies = ['GPT 系列', 'Claude 系列', 'Gemini 系列', 'DeepSeek', 'Llama', 'Qwen', 'Mistral', '图片模型', '视频模型', '语音模型'];

export const docSections = [
  { icon: KeyRound, title: '鉴权', items: ['所有请求使用 Bearer Token', '密钥可在控制台创建、停用和删除', '建议按项目隔离不同 API Key'] },
  { icon: FileText, title: '接口', items: ['模型列表：GET /v1/models', '聊天补全：POST /v1/chat/completions', '兼容 OpenAI SDK baseURL 配置'] },
  { icon: Brain, title: '模型', items: ['支持文本、视觉、图片、视频等模型', '价格在模型广场实时展示', '后台可调整模型状态与上游通道'] },
  { icon: ShieldCheck, title: '安全', items: ['服务端统一鉴权与审计', '支持令牌额度和过期时间', '请求日志用于用量追踪'] },
];

export const codeSamples = {
  Python: `from openai import OpenAI

client = OpenAI(
    api_key="${brand.envKey}",
    base_url="${brand.baseUrl}"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "你好，MatrixAPI"}],
)

print(response.choices[0].message.content)`,
  'Node.js': `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.${brand.envKey},
  baseURL: "${brand.baseUrl}",
});

const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "你好，MatrixAPI" }],
});

console.log(response.choices[0].message.content);`,
  cURL: `curl ${brand.baseUrl}/chat/completions \\
  -H "Authorization: Bearer $${brand.envKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role":"user","content":"你好，MatrixAPI"}]
  }'`,
};
