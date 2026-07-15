/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import {
  BookOpen,
  CircleDollarSign,
  Code2,
  FileText,
  KeyRound,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  MessageCircle,
  Settings2,
  ShieldCheck,
  Terminal,
  WalletCards,
} from 'lucide-react'

import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { PageTransition } from '@/components/page-transition'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type DocSection = {
  id: string
  eyebrow: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  items: string[]
}

const quickSteps = [
  {
    title: '注册账号',
    description: '创建 Matrix API 账号并完成登录。',
  },
  {
    title: '充值余额',
    description: '进入钱包页完成充值，到账后即可开始调用。',
  },
  {
    title: '创建 API Key',
    description: '在控制台生成密钥，按需设置额度、模型权限和有效期。',
  },
  {
    title: '配置客户端',
    description: 'Base URL 填写 https://matrixapi.online/v1，模型名使用模型广场展示名称。',
  },
]

const sections: DocSection[] = [
  {
    id: 'quick-start',
    eyebrow: '01',
    title: '快速开始',
    description: '从账号、余额、密钥到第一次请求，按顺序完成即可接入。',
    icon: ListChecks,
    items: [
      '进入注册页创建账号，登录后打开控制台。',
      '在钱包页充值余额，支付完成后等待余额自动入账。',
      '进入 API Key 管理页面创建密钥，复制后妥善保存。',
      '用模型广场中的模型名称发起请求。',
    ],
  },
  {
    id: 'api',
    eyebrow: '02',
    title: 'API 接入',
    description: 'Matrix API 提供 OpenAI 兼容接口，适合直接接入常见 SDK 与客户端。',
    icon: Code2,
    items: [
      'Base URL：https://matrixapi.online/v1',
      '鉴权方式：Authorization: Bearer YOUR_API_KEY',
      '模型列表：GET /v1/models',
      '对话接口：POST /v1/chat/completions',
    ],
  },
  {
    id: 'clients',
    eyebrow: '03',
    title: '客户端配置',
    description: '支持 Cherry Studio、ChatBox、OpenCat、DeepChat 等常见客户端的自定义服务商模式。',
    icon: Settings2,
    items: [
      '服务商类型选择 OpenAI Compatible 或自定义 OpenAI。',
      'API 地址填写 https://matrixapi.online/v1。',
      'API Key 填写控制台创建的密钥。',
      '模型名称保持和模型广场展示一致。',
    ],
  },
  {
    id: 'pricing',
    eyebrow: '04',
    title: '模型与价格',
    description: '模型广场展示 Matrix API 当前对外价格，实际消耗按请求模型和 Token 用量计算。',
    icon: CircleDollarSign,
    items: [
      '价格单位以模型广场展示为准。',
      '计费会区分输入 Token、输出 Token 和部分任务类型。',
      '不同模型的上下文、能力标签和价格可能不同。',
      '实际扣费可在使用日志中查看。',
    ],
  },
  {
    id: 'wallet',
    eyebrow: '05',
    title: '充值与余额',
    description: '余额用于支付模型调用费用，余额不足时请求会被拦截。',
    icon: WalletCards,
    items: [
      '进入钱包页选择充值金额并确认支付。',
      '支付完成后余额会根据支付结果自动入账。',
      '如长时间未到账，请联系支持并提供支付时间和订单信息。',
      '建议批量调用前确认余额充足。',
    ],
  },
  {
    id: 'logs',
    eyebrow: '06',
    title: '使用日志',
    description: '日志用于核对请求状态、Token 用量、扣费金额和 API Key 来源。',
    icon: FileText,
    items: [
      '控制台使用日志可查看每次调用记录。',
      '失败请求可根据状态码和错误信息排查。',
      '可按时间、模型、密钥等维度筛选。',
      '如需定位问题，联系支持时请提供日志时间和请求 ID。',
    ],
  },
  {
    id: 'faq',
    eyebrow: '07',
    title: '常见问题',
    description: '优先检查密钥、模型名、余额和 Base URL，大多数接入问题都在这里。',
    icon: MessageCircle,
    items: [
      '提示未授权：检查 API Key 是否完整、是否被停用。',
      '提示模型不存在：确认模型名来自模型广场或 /v1/models。',
      '提示余额不足：充值到账后重新发起请求。',
      '客户端连接失败：确认 Base URL 末尾包含 /v1。',
    ],
  },
  {
    id: 'security',
    eyebrow: '08',
    title: '账户安全',
    description: 'API Key 等同调用凭证，请只保存在可信服务端或本机客户端。',
    icon: LockKeyhole,
    items: [
      '不要把完整 API Key 发送到公开聊天、截图或代码仓库。',
      '为不同项目创建不同密钥，方便单独停用和轮换。',
      '离职、泄露或项目结束后及时停用旧密钥。',
      '联系支持时不要发送支付密码或完整 API Key。',
    ],
  },
]

const apiExample = `curl https://matrixapi.online/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      { "role": "user", "content": "你好，Matrix API" }
    ]
  }'`

export function Docs() {
  return (
    <PublicLayout showMainContainer={false}>
      <div className='relative overflow-hidden'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 top-0 h-[620px] opacity-25 dark:opacity-[0.12]'
          style={{
            background: [
              'radial-gradient(ellipse 55% 45% at 18% 12%, oklch(0.72 0.18 250 / 80%) 0%, transparent 70%)',
              'radial-gradient(ellipse 44% 38% at 82% 10%, oklch(0.68 0.17 300 / 58%) 0%, transparent 70%)',
              'radial-gradient(ellipse 38% 30% at 52% 42%, oklch(0.76 0.12 190 / 34%) 0%, transparent 72%)',
            ].join(', '),
            maskImage:
              'linear-gradient(to bottom, black 48%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 48%, transparent 100%)',
          }}
        />
        <div
          aria-hidden
          className='absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_48%_at_50%_18%,black_18%,transparent_100%)] bg-[size:4rem_4rem] opacity-[0.07]'
        />

        <PageTransition className='relative mx-auto w-full max-w-[1240px] px-4 pt-24 pb-14 sm:px-6 lg:px-8'>
          <section className='grid gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start'>
            <div className='max-w-3xl'>
              <Badge
                variant='outline'
                className='border-blue-500/20 bg-blue-500/5 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/5 dark:text-blue-400'
              >
                官方使用手册
              </Badge>
              <h1 className='mt-5 text-[clamp(2.4rem,5vw,4.25rem)] leading-[1.05] font-bold tracking-tight'>
                Matrix API 文档
                <span className='mt-2 block bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent'>
                  3 分钟完成接入
                </span>
              </h1>
              <p className='text-muted-foreground mt-6 max-w-2xl text-base leading-8 sm:text-lg'>
                从注册、充值、创建 API Key，到客户端配置、模型价格和问题排查，一页完成接入。
                Matrix API 提供 OpenAI 兼容接口，你可以把它当作统一的 AI 模型入口。
              </p>
              <div className='mt-8 flex flex-wrap gap-3'>
                <Button className='h-10 rounded-lg px-4' render={<Link to='/sign-up' />}>
                  立即开始
                </Button>
                <Button
                  variant='outline'
                  className='h-10 rounded-lg px-4'
                  render={<Link to='/pricing' />}
                >
                  查看模型广场
                </Button>
                <Button
                  variant='ghost'
                  className='h-10 rounded-lg px-4'
                  render={<Link to='/dashboard' />}
                >
                  打开控制台
                </Button>
              </div>
            </div>

            <Card className='border-border/70 bg-card/80 shadow-2xl shadow-blue-500/5 backdrop-blur-xl'>
              <CardHeader>
                <div className='bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl'>
                  <LifeBuoy className='size-5' />
                </div>
                <CardTitle>联系支持</CardTitle>
                <CardDescription>
                  账号、支付、接口或模型调用问题，请附上问题时间、页面路径、状态码或订单信息。
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3 text-sm'>
                <SupportLine label='邮箱' value='3315419516@qq.com' href='mailto:3315419516@qq.com' />
                <SupportLine label='QQ 群' value='1050365180' />
                <p className='text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs leading-5'>
                  为了账户安全，请不要发送完整 API Key、支付密码或后台登录密码。
                </p>
              </CardContent>
            </Card>
          </section>

          <section className='mt-10 grid gap-4 md:grid-cols-4'>
            {quickSteps.map((step, index) => (
              <Card
                key={step.title}
                className='border-border/70 bg-card/70 backdrop-blur-sm'
              >
                <CardHeader>
                  <div className='text-primary text-sm font-semibold'>
                    0{index + 1}
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </section>

          <section className='mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]'>
            <aside className='hidden lg:block'>
              <div className='sticky top-24 rounded-2xl border bg-card/70 p-4 backdrop-blur-sm'>
                <div className='mb-3 flex items-center gap-2 text-sm font-medium'>
                  <BookOpen className='text-primary size-4' />
                  文档目录
                </div>
                <nav className='space-y-1'>
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className='text-muted-foreground hover:bg-muted hover:text-foreground block rounded-lg px-3 py-2 text-sm transition-colors'
                    >
                      {section.eyebrow} {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className='space-y-5'>
              <Card
                id='api-example'
                className='border-border/70 bg-zinc-950 text-zinc-50 shadow-xl shadow-black/10 dark:bg-black/60'
              >
                <CardHeader>
                  <div className='flex items-center gap-2 text-sm text-zinc-300'>
                    <Terminal className='size-4' />
                    OpenAI 兼容请求示例
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className='overflow-x-auto rounded-xl bg-black/30 p-4 text-xs leading-6 text-zinc-100'>
                    <code>{apiExample}</code>
                  </pre>
                </CardContent>
              </Card>

              <div className='grid gap-5'>
                {sections.map((section) => (
                  <DocSectionCard key={section.id} section={section} />
                ))}
              </div>
            </div>
          </section>

          <section className='mt-10 rounded-3xl border bg-card/70 p-6 backdrop-blur-sm md:p-8'>
            <div className='grid gap-6 md:grid-cols-[1fr_auto] md:items-center'>
              <div>
                <div className='flex items-center gap-2 text-sm font-medium text-primary'>
                  <ShieldCheck className='size-4' />
                  接入前最后检查
                </div>
                <h2 className='mt-3 text-2xl font-semibold tracking-tight'>
                  Base URL、API Key、模型名称三项一致，基本就能跑通。
                </h2>
                <p className='text-muted-foreground mt-3 max-w-2xl text-sm leading-6'>
                  如果调用失败，先看控制台使用日志；如果日志里没有请求，通常是客户端地址或密钥没有配置正确。
                </p>
              </div>
              <Button render={<Link to='/keys' />}>创建 API Key</Button>
            </div>
          </section>
        </PageTransition>
      </div>
      <Footer />
    </PublicLayout>
  )
}

function SupportLine(props: { label: string; value: string; href?: string }) {
  const content = (
    <span className='font-medium text-foreground'>{props.value}</span>
  )

  return (
    <div className='flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2'>
      <span className='text-muted-foreground'>{props.label}</span>
      {props.href ? (
        <a className='hover:text-primary transition-colors' href={props.href}>
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  )
}

function DocSectionCard({ section }: { section: DocSection }) {
  const Icon = section.icon

  return (
    <Card
      id={section.id}
      className='scroll-mt-28 border-border/70 bg-card/80 backdrop-blur-sm'
    >
      <CardHeader>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start'>
          <div className='bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl'>
            <Icon className='size-5' />
          </div>
          <div className='min-w-0'>
            <div className='text-primary text-xs font-semibold tracking-[0.2em] uppercase'>
              {section.eyebrow}
            </div>
            <CardTitle className='mt-1 text-xl'>{section.title}</CardTitle>
            <CardDescription className='mt-2 max-w-2xl leading-6'>
              {section.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className='grid gap-3 sm:grid-cols-2'>
          {section.items.map((item) => (
            <li
              key={item}
              className={cn(
                'flex gap-3 rounded-xl border border-border/60 bg-muted/25 px-3 py-3 text-sm leading-6'
              )}
            >
              <KeyRound className='text-primary mt-0.5 size-4 shrink-0' />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
