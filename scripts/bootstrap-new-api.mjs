#!/usr/bin/env node

const baseUrl = (process.env.MATRIXAPI_URL || 'http://127.0.0.1').replace(/\/$/, '')
const username = process.env.NEW_API_ADMIN_USERNAME || process.env.ADMIN_USERNAME
const password = process.env.NEW_API_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD
const upstreamKey = process.env.UPSTREAM_API_KEY || process.env.OPENAI_API_KEY
const upstreamBaseUrl = (process.env.UPSTREAM_BASE_URL || 'https://api.bblabu.chat').replace(/\/$/, '')
const zpayGateway = process.env.ZPAY_GATEWAY || 'https://zpayz.cn/'
const zpayPid = process.env.ZPAY_PID
const zpayKey = process.env.ZPAY_KEY
const defaultModels = process.env.NEW_API_DEFAULT_MODELS || 'gpt-5.5,gpt-5.4,gpt-5.4-openai-compact,gpt-5.5-openai-compact,gpt-image2'

function requireEnv(name, value) {
  if (!value || String(value).trim() === '') {
    throw new Error(`${name} is required`)
  }
}

async function request(path, options = {}) {
  const headers = {
    'content-type': 'application/json',
    ...(options.headers || {}),
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
  })
  if (!result.ok || !result.body?.success) {
    throw new Error(`Payment compliance confirmation failed: ${JSON.stringify(result.body)}`)
  }
}

async function ensureZpay(cookie) {
  requireEnv('ZPAY_PID', zpayPid)
  requireEnv('ZPAY_KEY', zpayKey)

  try {
    await confirmPaymentCompliance(cookie)
  } catch (error) {
    console.warn(`${error.message}. Continue bootstrap; confirm payment compliance once in the admin console if payment settings stay locked.`)
  }
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
  const groupRatio = process.env.NEW_API_GROUP_RATIO || JSON.stringify({ default: 1.4 })
  await updateOption(cookie, 'GroupRatio', groupRatio)
  await updateOption(cookie, 'TopupGroupRatio', process.env.NEW_API_TOPUP_GROUP_RATIO || JSON.stringify({ default: 1 }))
  await updateOption(cookie, 'Price', process.env.NEW_API_PRICE || '0.1')
  await updateOption(cookie, 'Logo', '/matrix-assets/matrixapi-logo.png')
  await updateOption(cookie, 'general_setting.logo', '/matrix-assets/matrixapi-logo.png')
  await updateOption(cookie, 'DocsLink', '/docs')
  await updateOption(cookie, 'general_setting.docs_link', '/docs')
  await updateOption(cookie, 'HeaderNavModules', JSON.stringify({
    home: true,
    console: true,
    pricing: { enabled: true, requireAuth: false },
    docs: true,
    about: false,
  }))
}

async function getChannels(cookie) {
  const result = await request('/api/channel/?p=1&page_size=100', {
    headers: { cookie },
  })
  if (!result.ok || !result.body?.success) {
    throw new Error(`List channels failed: ${JSON.stringify(result.body)}`)
  }
  return result.body.data?.items || []
}

async function ensureUpstreamChannel(cookie) {
  requireEnv('UPSTREAM_API_KEY or OPENAI_API_KEY', upstreamKey)

  const channels = await getChannels(cookie)
  const exists = channels.some((channel) => channel.name === 'bblabu-upstream' || channel.base_url === upstreamBaseUrl)
  if (exists) {
    return
  }

  const result = await request('/api/channel/', {
    method: 'POST',
    headers: { cookie },
    body: JSON.stringify({
      mode: 'single',
      channel: {
        type: 1,
        name: 'bblabu-upstream',
        key: upstreamKey,
        base_url: upstreamBaseUrl,
        models: defaultModels,
        group: 'default',
        status: 1,
        priority: 0,
        weight: 100,
        auto_ban: 1,
        test_model: defaultModels.split(',')[0],
        tag: 'bblabu',
        remark: 'MatrixAPI upstream channel. Retail pricing must include 40% markup.',
        settings: '{}',
      },
    }),
  })
  if (!result.ok || !result.body?.success) {
    throw new Error(`Create upstream channel failed: ${JSON.stringify(result.body)}`)
  }
}

async function main() {
  await ensureSetup()
  const cookie = await login()
  await ensureZpay(cookie)
  await ensurePricing(cookie)
  await ensureUpstreamChannel(cookie)
  console.log('MatrixAPI New API bootstrap finished.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
