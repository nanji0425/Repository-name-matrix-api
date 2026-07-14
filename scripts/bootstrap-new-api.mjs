#!/usr/bin/env node

const baseUrl = (process.env.MATRIXAPI_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const username = process.env.NEW_API_ADMIN_USERNAME || process.env.ADMIN_USERNAME
const password = process.env.NEW_API_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD
const upstreamKey = process.env.UPSTREAM_API_KEY || process.env.OPENAI_API_KEY
const upstreamBaseUrlInput = process.env.UPSTREAM_BASE_URL || 'https://www.kukuai.fyi/api-proxy/china'
const zpayGatewayInput = process.env.ZPAY_GATEWAY || 'https://zpayz.cn/'
const zpayPid = process.env.ZPAY_PID
const zpayKey = process.env.ZPAY_KEY
let newUserQuota = process.env.NEW_API_QUOTA_FOR_NEW_USER || '500000'
const bootstrapModels = (process.env.NEW_API_DEFAULT_MODELS || 'gpt-5.5').split(',').map((model) => model.trim()).filter(Boolean)
const upstreamChannelName = 'kukuai-upstream'
const upstreamChannelTag = 'kukuai'
const channelPageSize = 100
let upstreamBaseUrl
let zpayGateway
let adminUserId

function requireEnv(name, value) {
  if (!value || String(value).trim() === '') {
    throw new Error(`${name} is required`)
  }
}

function validateQuota(value) {
  if (!/^\d+$/.test(String(value).trim())) {
    throw new Error('NEW_API_QUOTA_FOR_NEW_USER must be a non-negative integer')
  }
  return String(value).trim()
}

function normalizeUpstreamBaseUrl(value) {
  let parsed
  try {
    parsed = new URL(String(value).trim())
  } catch {
    throw new Error('UPSTREAM_BASE_URL must be a valid http(s) URL')
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error('UPSTREAM_BASE_URL must be a valid http(s) URL')
  }
  if (parsed.username || parsed.password) {
    throw new Error('UPSTREAM_BASE_URL must not contain credentials')
  }

  let pathname = parsed.pathname.replace(/\/+$/, '')
  pathname = pathname.replace(/\/v1$/i, '').replace(/\/+$/, '')
  return `${parsed.origin}${pathname}`
}

function normalizeZpayGateway(value) {
  let parsed
  try {
    parsed = new URL(String(value).trim())
  } catch {
    throw new Error('ZPAY_GATEWAY must be a valid http(s) URL')
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error('ZPAY_GATEWAY must be a valid http(s) URL')
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('ZPAY_GATEWAY must not contain credentials, query, or fragment')
  }

  let pathname = parsed.pathname.replace(/\/+$/, '')
  pathname = pathname.replace(/\/submit\.php$/i, '').replace(/\/+$/, '')
  return `${parsed.origin}${pathname}/`
}

function normalizedChannelBaseUrl(value) {
  if (!value) return null
  try {
    return normalizeUpstreamBaseUrl(value)
  } catch {
    return null
  }
}

function channelFailure(result) {
  let detail = ''
  if (typeof result.body === 'string') {
    detail = result.body
  } else if (typeof result.body?.message === 'string') {
    detail = result.body.message
  }
  if (upstreamKey && detail) {
    detail = detail.split(upstreamKey).join('[redacted]')
  }
  return detail ? `${result.status}: ${detail}` : String(result.status)
}

function normalizeModelList(data) {
  const models = Array.from(
    new Set(
      data
        .map((model) => (
          typeof model === 'string' ? model : model?.model_name || model?.id
        ))
        .filter((model) => typeof model === 'string' && model.trim() !== '')
        .map((model) => model.trim()),
    ),
  ).sort((left, right) => left.localeCompare(right))

  if (models.length === 0) {
    throw new Error('Fetch upstream models failed: upstream returned no models')
  }
  return models
}

async function fetchChannelModels(cookie, channelId) {
  const result = await request(`/api/channel/fetch_models/${channelId}`, {
    headers: { cookie },
  })
  if (result.ok && result.body?.success && Array.isArray(result.body?.data)) {
    return normalizeModelList(result.body.data)
  }

  const upstreamOrigin = new URL(upstreamBaseUrl).origin
  const response = await fetch(`${upstreamOrigin}/api/dist/site/models`, {
    headers: { accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(
      `Fetch upstream models failed: ${channelFailure(result)}; published catalog returned ${response.status}`,
    )
  }
  const body = await response.json()
  if (!body?.success || !Array.isArray(body?.data)) {
    throw new Error(
      `Fetch upstream models failed: ${channelFailure(result)}; published catalog response is invalid`,
    )
  }
  return normalizeModelList(body.data)
}

async function request(path, options = {}) {
  const headers = {
    'content-type': 'application/json',
    ...(options.headers || {}),
  }
  if (headers.cookie && adminUserId) {
    headers['New-Api-User'] = String(adminUserId)
  }
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    ...options,
    headers,
  })
  const text = await response.text()
  let body = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }
  return {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    body,
  }
}

function cookieFrom(response) {
  const setCookie = response.headers.get('set-cookie')
  if (!setCookie) return ''
  return setCookie
    .split(/,(?=[^ ;]+=)/)
    .map((part) => part.split(';')[0])
    .join('; ')
}

async function ensureSetup() {
  const setup = await request('/api/setup')
  if (!setup.ok || !setup.body?.success) {
    throw new Error(`Unable to read setup status: ${setup.status}`)
  }
  if (setup.body.data?.status) {
    return
  }

  requireEnv('NEW_API_ADMIN_USERNAME or ADMIN_USERNAME', username)
  requireEnv('NEW_API_ADMIN_PASSWORD or ADMIN_PASSWORD', password)

  const result = await request('/api/setup', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      confirmPassword: password,
      SelfUseModeEnabled: false,
      DemoSiteEnabled: false,
    }),
  })
  if (!result.ok || !result.body?.success) {
    throw new Error(`Setup failed: ${JSON.stringify(result.body)}`)
  }
}

async function login() {
  requireEnv('NEW_API_ADMIN_USERNAME or ADMIN_USERNAME', username)
  requireEnv('NEW_API_ADMIN_PASSWORD or ADMIN_PASSWORD', password)

  const result = await request('/api/user/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  if (!result.ok || !result.body?.success) {
    throw new Error(`Login failed: ${JSON.stringify(result.body)}`)
  }
  adminUserId = Number(result.body?.data?.id)
  if (!Number.isInteger(adminUserId) || adminUserId <= 0) {
    throw new Error('Login succeeded but no valid user id was returned')
  }
  const cookie = cookieFrom(result)
  if (!cookie) {
    throw new Error('Login succeeded but no session cookie was returned')
  }
  return cookie
}

async function updateOption(cookie, key, value) {
  const result = await request('/api/option/', {
    method: 'PUT',
    headers: { cookie },
    body: JSON.stringify({ key, value }),
  })
  if (!result.ok || !result.body?.success) {
    throw new Error(`Update option ${key} failed: ${JSON.stringify(result.body)}`)
  }
}

async function confirmPaymentCompliance(cookie) {
  const result = await request('/api/option/payment_compliance', {
    method: 'POST',
    headers: { cookie },
    body: JSON.stringify({ confirmed: true }),
  })
  if (!result.ok || !result.body?.success) {
    throw new Error(`Payment compliance confirmation failed: ${JSON.stringify(result.body)}`)
  }
}

async function ensureZpay(cookie) {
  requireEnv('ZPAY_PID', zpayPid)
  requireEnv('ZPAY_KEY', zpayKey)

  await confirmPaymentCompliance(cookie)
  await updateOption(cookie, 'PayAddress', zpayGateway)
  await updateOption(cookie, 'EpayId', zpayPid)
  await updateOption(cookie, 'EpayKey', zpayKey)
  await updateOption(cookie, 'PayMethods', JSON.stringify([
    {
      name: 'Alipay',
      icon: 'SiAlipay',
      type: 'alipay',
    },
  ]))
  await updateOption(cookie, 'MinTopUp', String(process.env.NEW_API_MIN_TOPUP || '1'))
}

async function ensurePricing(cookie) {
  const groupRatio = process.env.NEW_API_GROUP_RATIO || JSON.stringify({ default: 1 })
  await updateOption(cookie, 'SystemName', 'Matrix API')
  await updateOption(cookie, 'ServerAddress', baseUrl)
  await updateOption(cookie, 'GroupRatio', groupRatio)
  await updateOption(cookie, 'TopupGroupRatio', process.env.NEW_API_TOPUP_GROUP_RATIO || JSON.stringify({ default: 1 }))
  await updateOption(cookie, 'Price', process.env.NEW_API_PRICE || '1.0')
  await updateOption(cookie, 'QuotaForNewUser', newUserQuota) // default 500000 quota units (USD 1)
  await updateOption(cookie, 'SystemName', 'Matrix API')
  await updateOption(cookie, 'general_setting.system_name', 'Matrix API')
  await updateOption(cookie, 'Logo', '/matrix-assets/matrixapi-logo.png?v=2026071419')
  await updateOption(cookie, 'general_setting.logo', '/matrix-assets/matrixapi-logo.png?v=2026071419')
  await updateOption(cookie, 'DocsLink', '/docs')
  await updateOption(cookie, 'general_setting.docs_link', '/docs')
  await updateOption(cookie, 'RegisterEnabled', 'true')
  await updateOption(cookie, 'PasswordRegisterEnabled', 'true')
  await updateOption(cookie, 'EmailVerificationEnabled', 'false')
  await updateOption(cookie, 'TurnstileCheckEnabled', 'false')
  await updateOption(cookie, 'HeaderNavModules', JSON.stringify({
    home: true,
    console: true,
    pricing: { enabled: true, requireAuth: false },
    docs: true,
    about: false,
  }))
  await updateOption(cookie, 'SidebarModulesAdmin', JSON.stringify({
    chat: { enabled: true, playground: true, chat: false },
    console: { enabled: true, detail: true, token: true, log: true, midjourney: false, task: true },
    personal: { enabled: true, topup: true, personal: true },
    admin: { enabled: true, channel: true, models: true, deployment: true, redemption: true, user: true, subscription: true, setting: true },
  }))
  await updateOption(cookie, 'console_setting.announcements_enabled', 'true')
  await updateOption(cookie, 'console_setting.announcements', JSON.stringify([
    {
      id: 1,
      type: 'success',
      content: 'MatrixAPI OpenAI-compatible API routes are available.',
      publishDate: '2026-07-07T00:00:00+08:00',
      enabled: true,
    },
    {
      id: 2,
      type: 'warning',
      content: 'Only Alipay top-up is currently enabled.',
      publishDate: '2026-07-07T00:10:00+08:00',
      enabled: true,
    },
    {
      id: 3,
      type: 'ongoing',
      content: 'MatrixAPI documentation is available on /docs and will continue to be expanded.',
      publishDate: '2026-07-07T00:20:00+08:00',
      enabled: true,
    },
  ]))
}

async function ensureChatOptions(cookie) {
  const chats = [
    { 'Cherry Studio': 'cherrystudio://providers/api-keys?v=1&data={cherryConfig}' },
    { AionUI: 'aionui://provider/add?v=1&data={aionuiConfig}' },
    { '流畅阅读': 'fluentread' },
    { 'CC Switch': 'ccswitch' },
    { DeepChat: 'deepchat://provider/install?v=1&data={deepchatConfig}' },
    { 'AMA 问天': 'ama://set-api-key?server={address}&key={key}' },
    { OpenCat: 'opencat://team/join?domain={address}&token={key}' },
  ]
  const serialized = JSON.stringify(chats)
  await updateOption(cookie, 'chats', serialized)
  await updateOption(cookie, 'Chats', serialized)
  await updateOption(cookie, 'console_setting.chats', serialized)
}

async function getChannels(cookie) {
  const channels = []
  let page = 1

  while (true) {
    const result = await request(`/api/channel/?p=${page}&page_size=${channelPageSize}`, {
      headers: { cookie },
    })
    if (!result.ok || !result.body?.success) {
      throw new Error(`List channels failed: ${channelFailure(result)}`)
    }

    const items = result.body.data?.items
    if (!Array.isArray(items)) {
      throw new Error('List channels failed: response items are missing')
    }
    channels.push(...items)

    const total = Number(result.body.data?.total)
    if (
      items.length === 0 ||
      items.length < channelPageSize ||
      (Number.isFinite(total) && channels.length >= total)
    ) {
      return channels
    }
    page += 1
  }
}

function isUpstreamChannel(channel) {
  const name = String(channel.name || '').trim().toLowerCase()
  if (name === 'bblabu-upstream' || name === upstreamChannelName) {
    return true
  }

  const knownBaseUrls = new Set([
    'https://api.bblabu.chat',
    'https://ozlzs.kukuai.fyi',
    'https://kukuai.fyi',
    'https://www.kukuai.fyi',
    'https://www.kukuai.fyi/api-proxy/china',
    upstreamBaseUrl,
  ])
  return knownBaseUrls.has(normalizedChannelBaseUrl(channel.base_url))
}

function upstreamChannelPayload(models, id) {
  return {
    ...(id === undefined ? {} : { id }),
    type: 1,
    name: upstreamChannelName,
    key: upstreamKey,
    base_url: upstreamBaseUrl,
    models: models.join(','),
    group: 'default',
    priority: 0,
    weight: 100,
    auto_ban: 1,
    test_model: models[0],
    tag: upstreamChannelTag,
    remark: 'MatrixAPI upstream channel. Pricing follows the configured group ratio.',
    settings: '{}',
  }
}

async function createUpstreamChannel(cookie, models) {
  const result = await request('/api/channel/', {
    method: 'POST',
    headers: { cookie },
    body: JSON.stringify({
      mode: 'single',
      channel: {
        ...upstreamChannelPayload(models),
        status: 1,
      },
    }),
  })
  if (!result.ok || !result.body?.success) {
    throw new Error(`Create upstream channel failed: ${channelFailure(result)}`)
  }
}

async function updateUpstreamChannel(cookie, id, models) {
  const result = await request('/api/channel/', {
    method: 'PUT',
    headers: { cookie },
    body: JSON.stringify(upstreamChannelPayload(models, id)),
  })
  if (!result.ok || !result.body?.success) {
    throw new Error(`Update upstream channel ${id} failed: ${channelFailure(result)}`)
  }

  await updateChannelStatus(cookie, id, 1, 'Enable upstream channel')
}

async function updateChannelStatus(cookie, id, status, action) {
  const result = await request(`/api/channel/${id}/status`, {
    method: 'POST',
    headers: { cookie },
    body: JSON.stringify({ status }),
  })
  if (!result.ok || !result.body?.success) {
    throw new Error(`${action} ${id} failed: ${channelFailure(result)}`)
  }
}

async function deleteDuplicateChannel(cookie, id) {
  const result = await request(`/api/channel/${id}`, {
    method: 'DELETE',
    headers: { cookie },
  })
  if (!result.ok || !result.body?.success) {
    throw new Error(`Delete duplicate channel ${id} failed: ${channelFailure(result)}`)
  }
}

async function ensureUpstreamChannel(cookie) {
  requireEnv('UPSTREAM_API_KEY or OPENAI_API_KEY', upstreamKey)
  const channels = await getChannels(cookie)
  let candidates = channels
    .filter(isUpstreamChannel)
    .map((channel) => ({ ...channel, id: Number(channel.id) }))
    .sort((left, right) => left.id - right.id)

  if (candidates.some((channel) => !Number.isInteger(channel.id) || channel.id <= 0)) {
    throw new Error('A matching upstream channel has an invalid id')
  }
  if (candidates.length === 0) {
    await createUpstreamChannel(cookie, bootstrapModels)
    candidates = (await getChannels(cookie))
      .filter(isUpstreamChannel)
      .map((channel) => ({ ...channel, id: Number(channel.id) }))
      .sort((left, right) => left.id - right.id)
    if (candidates.length === 0) {
      throw new Error('Created upstream channel could not be reloaded')
    }
  }

  const [canonical, ...duplicates] = candidates
  const configuredModels = String(canonical.models || '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean)
  await updateUpstreamChannel(
    cookie,
    canonical.id,
    configuredModels.length > 0 ? configuredModels : bootstrapModels,
  )
  const models = await fetchChannelModels(cookie, canonical.id)
  await updateUpstreamChannel(cookie, canonical.id, models)
  for (const duplicate of duplicates) {
    await updateChannelStatus(cookie, duplicate.id, 2, 'Disable duplicate channel')
  }
  for (const duplicate of duplicates) {
    await deleteDuplicateChannel(cookie, duplicate.id)
  }
}

async function main() {
  upstreamBaseUrl = normalizeUpstreamBaseUrl(upstreamBaseUrlInput)
  zpayGateway = normalizeZpayGateway(zpayGatewayInput)
  newUserQuota = validateQuota(newUserQuota)
  await ensureSetup()
  const cookie = await login()
  await ensureZpay(cookie)
  await ensurePricing(cookie)
  await ensureChatOptions(cookie)
  await ensureUpstreamChannel(cookie)
  console.log('Matrix API bootstrap finished.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
