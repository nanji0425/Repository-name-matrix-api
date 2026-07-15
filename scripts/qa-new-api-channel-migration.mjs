#!/usr/bin/env node

import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.dirname(scriptsDir)
const apiBootstrap = path.join(scriptsDir, 'bootstrap-new-api.mjs')
const dbBootstrap = path.join(scriptsDir, 'bootstrap-new-api-db.sh')
const placeholderKey = 'qa-placeholder-upstream-key'
const bootstrapSource = await readFile(apiBootstrap, 'utf8')
assert.match(
  bootstrapSource,
  /api-proxy\/china/,
  'bootstrap must use the upstream OpenAI-compatible API proxy base URL',
)

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, {
    'content-type': 'application/json',
    ...headers,
  })
  response.end(JSON.stringify(body))
}

async function readJson(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  if (chunks.length === 0) return null
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function channelPages() {
  const unrelated = Array.from({ length: 100 }, (_, index) => ({
    id: 100 + index,
    name: `unrelated-${index}`,
    base_url: `https://unrelated-${index}.invalid`,
    status: 1,
  }))
  const migrationCandidates = [
    {
      id: 9,
      name: 'kukuai-upstream',
      base_url: 'https://ozlzs.kukuai.fyi/v1/',
      status: 1,
    },
    {
      id: 7,
      name: 'renamed-legacy-channel',
      base_url: 'https://api.bblabu.chat/v1/?source=legacy',
      status: 1,
    },
    {
      id: 3,
      name: 'bblabu-upstream',
      base_url: 'https://api.bblabu.chat',
      models: 'legacy-model',
      status: 1,
    },
  ]
  return [unrelated, migrationCandidates]
}

async function startMockNewApi({ failingDeleteId = null } = {}) {
  const requests = []
  const pages = channelPages()
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1')
      const body = await readJson(request)
      requests.push({ method: request.method, url, body, headers: request.headers })

      if (request.method === 'GET' && url.pathname === '/api/setup') {
        sendJson(response, 200, { success: true, data: { status: true } })
        return
      }
      if (request.method === 'POST' && url.pathname === '/api/user/login') {
        sendJson(response, 200, { success: true, data: { id: 42 } }, { 'set-cookie': 'session=qa; Path=/' })
        return
      }
      if (request.method === 'GET' && url.pathname === '/v1/models') {
        response.writeHead(200, { 'content-type': 'text/html' })
        response.end('<!DOCTYPE html><title>upstream compatibility page</title>')
        return
      }
      if (request.method === 'GET' && url.pathname === '/api/channel/fetch_models/3') {
        const baseWasUpdated = requests.slice(0, -1).some(({ method, url: seenUrl, body: seenBody }) => (
          method === 'PUT' &&
          seenUrl.pathname === '/api/channel/' &&
          seenBody?.id === 3 &&
          seenBody?.base_url === origin
        ))
        if (!baseWasUpdated) {
          sendJson(response, 200, { success: false, message: 'channel base URL was not updated before fetch' })
          return
        }
        sendJson(response, 200, {
          success: false,
          message: "invalid character '<' looking for beginning of value",
        })
        return
      }
      if (request.method === 'GET' && url.pathname === '/api/dist/site/models') {
        sendJson(response, 200, {
          success: true,
          data: [
            { id: 'upstream-z' },
            { id: 'gpt-5.5' },
            { id: 'upstream-a' },
            { id: 'upstream-z' },
          ].map((model) => ({ model_name: model.id })),
        })
        return
      }
      if (
        request.method === 'POST' &&
        url.pathname === '/api/option/payment_compliance'
      ) {
        sendJson(response, 200, { success: true })
        return
      }
      if (request.method === 'PUT' && url.pathname === '/api/option/') {
        sendJson(response, 200, { success: true })
        return
      }
      if (
        request.method === 'GET' &&
        (url.pathname === '/api/channel/' || url.pathname === '/api/channel')
      ) {
        const page = Number(url.searchParams.get('p'))
        const items = pages[page - 1] || []
        sendJson(response, 200, {
          success: true,
          data: { items, total: 103, page, page_size: 100 },
        })
        return
      }
      if (request.method === 'PUT' && url.pathname === '/api/channel/') {
        sendJson(response, 200, { success: true })
        return
      }
      if (
        request.method === 'POST' &&
        /^\/api\/channel\/\d+\/status$/.test(url.pathname)
      ) {
        sendJson(response, 200, { success: true, data: true })
        return
      }
      if (request.method === 'DELETE' && /^\/api\/channel\/\d+$/.test(url.pathname)) {
        const id = Number(url.pathname.split('/').at(-1))
        if (id === failingDeleteId) {
          sendJson(response, 200, { success: false, message: 'simulated delete failure' })
        } else {
          sendJson(response, 200, { success: true })
        }
        return
      }
      if (request.method === 'POST' && url.pathname === '/api/channel/') {
        sendJson(response, 200, { success: true })
        return
      }

      sendJson(response, 404, { success: false, message: 'unexpected QA route' })
    } catch (error) {
      sendJson(response, 500, { success: false, message: error.message })
    }
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  const origin = `http://127.0.0.1:${address.port}`
  return {
    requests,
    origin,
    close: () => new Promise((resolve, reject) => server.close((error) => {
      if (error) reject(error)
      else resolve()
    })),
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => child.kill(), 20_000)
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.once('error', reject)
    child.once('close', (code, signal) => {
      clearTimeout(timer)
      resolve({ code, signal, stdout, stderr })
    })
  })
}

async function runApiBootstrap(options = {}) {
  const mock = await startMockNewApi(options)
  try {
    const result = await run(process.execPath, [apiBootstrap], {
      env: {
        ...process.env,
        MATRIXAPI_URL: mock.origin,
        NEW_API_ADMIN_USERNAME: 'qa-admin',
        NEW_API_ADMIN_PASSWORD: 'qa-password',
        UPSTREAM_API_KEY: placeholderKey,
        UPSTREAM_BASE_URL: mock.origin,
        ZPAY_GATEWAY: 'https://payments.invalid/',
        ZPAY_PID: 'qa-pid',
        ZPAY_KEY: 'qa-payment-key',
      },
    })
    return { ...result, requests: mock.requests, origin: mock.origin }
  } finally {
    await mock.close()
  }
}

function channelRequests(requests) {
  return requests.filter(({ url }) => url.pathname.startsWith('/api/channel'))
}

async function testApiMigration() {
  const result = await runApiBootstrap()
  assert.equal(result.code, 0, result.stderr)

  const requests = channelRequests(result.requests)
  const listPages = requests
    .filter(({ method, url }) => method === 'GET' && (url.pathname === '/api/channel/' || url.pathname === '/api/channel'))
    .map(({ url }) => Number(url.searchParams.get('p')))
  assert.deepEqual(listPages, [1, 2], 'bootstrap must inspect every channel page')

  const updates = requests.filter(({ method, url }) => (
    method === 'PUT' && url.pathname === '/api/channel/'
  ))
  const update = updates.at(-1)
  assert.ok(update, 'legacy canonical channel must be updated in place')
  assert.equal(update.body.id, 3, 'the smallest matching channel id is canonical')
  assert.equal(update.body.name, 'kukuai-upstream')
  assert.equal(update.body.base_url, result.origin)
  assert.equal(update.body.key, placeholderKey)
  assert.equal(update.body.tag, 'kukuai')
  assert.equal(
    update.body.models,
    'gpt-5.5,upstream-a,upstream-z',
    'the canonical channel must receive the complete deduplicated upstream model list',
  )
  assert.equal(update.body.test_model, 'gpt-5.5')
  assert.equal('status' in update.body, false, 'PUT rejects the protected status field')

  assert.equal(updates[0]?.body.base_url, result.origin)
  assert.equal(updates[0]?.body.models, 'legacy-model')
  assert.ok(
    result.requests.some(({ method, url }) => method === 'GET' && url.pathname === '/api/dist/site/models'),
    'bootstrap must fall back to the upstream published model catalog',
  )

  const status = requests.find(({ method, url }) => (
    method === 'POST' && url.pathname === '/api/channel/3/status'
  ))
  assert.deepEqual(status?.body, { status: 1 })

  const protectedRequests = requests.filter(({ url }) =>
    url.pathname.startsWith('/api/') && url.pathname !== '/api/setup' && url.pathname !== '/api/user/login',
  )
  assert.ok(
    protectedRequests.every(({ headers }) => headers['new-api-user'] === '42'),
    'all authenticated admin requests must include the logged-in user id header',
  )

  const disabledIds = requests
    .filter(({ method, url, body }) => (
      method === 'POST' &&
      /^\/api\/channel\/\d+\/status$/.test(url.pathname) &&
      body?.status === 2
    ))
    .map(({ url }) => Number(url.pathname.split('/').at(-2)))
  assert.deepEqual(disabledIds, [7, 9], 'duplicates must be disabled before deletion')

  const deletedIds = requests
    .filter(({ method }) => method === 'DELETE')
    .map(({ url }) => Number(url.pathname.split('/').at(-1)))
  assert.deepEqual(deletedIds, [7, 9])
  assert.equal(
    requests.some(({ method, url }) => method === 'POST' && url.pathname === '/api/channel/'),
    false,
    'a legacy channel must be migrated instead of replaced with a new row',
  )
  assert.equal(result.stderr.includes(placeholderKey), false, 'keys must not be logged')
}

async function testDeleteFailureStopsMigration() {
  const result = await runApiBootstrap({ failingDeleteId: 7 })
  assert.notEqual(result.code, 0, 'a failed duplicate deletion must fail bootstrap')
  assert.match(result.stderr, /Delete duplicate channel 7 failed/)
  assert.equal(result.stdout.includes('bootstrap finished'), false)
  assert.equal(result.stderr.includes(placeholderKey), false, 'keys must not be logged')

  const deletedIds = channelRequests(result.requests)
    .filter(({ method }) => method === 'DELETE')
    .map(({ url }) => Number(url.pathname.split('/').at(-1)))
  assert.deepEqual(deletedIds, [7], 'migration must stop at the first failed delete')

  const disabledIds = channelRequests(result.requests)
    .filter(({ method, url, body }) => (
      method === 'POST' &&
      /^\/api\/channel\/\d+\/status$/.test(url.pathname) &&
      body?.status === 2
    ))
    .map(({ url }) => Number(url.pathname.split('/').at(-2)))
  assert.deepEqual(disabledIds, [7, 9], 'all duplicates stay disabled after delete failure')
}

function findWindowsExecutable(name, predicate = () => true) {
  const output = execFileSync('where.exe', [name], { encoding: 'utf8' })
  const candidates = output.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)
  const match = candidates.find(predicate)
  if (!match) throw new Error(`Unable to find ${name}`)
  return match
}

function findBash() {
  if (process.platform !== 'win32') return '/usr/bin/env'
  const shell = findWindowsExecutable('sh.exe', (candidate) => !candidate.includes('System32'))
  return path.join(path.dirname(shell), 'bash.exe')
}

async function runDbBootstrap() {
  const temporaryDir = await mkdtemp(path.join(os.tmpdir(), 'matrixapi-channel-qa-'))
  const captureSql = path.join(temporaryDir, 'bootstrap.sql')
  const captureUrl = path.join(temporaryDir, 'upstream-url.txt')
  const fakeDocker = path.join(temporaryDir, 'docker')
  const fakePython = path.join(temporaryDir, 'python3')

  const fakeDockerSource = `#!/usr/bin/env bash
capture_sql="$QA_CAPTURE_SQL"
capture_url="$QA_CAPTURE_URL"
if command -v cygpath >/dev/null 2>&1; then
  capture_sql="$(cygpath -u "$capture_sql")"
  capture_url="$(cygpath -u "$capture_url")"
fi
if [ "$1" = "cp" ]; then
  cp "$2" "$capture_sql"
elif [ "$1" = "exec" ]; then
  printf '%s' "$UPSTREAM_BASE_URL" > "$capture_url"
else
  exit 64
fi
`
  await writeFile(fakeDocker, fakeDockerSource, 'utf8')
  await chmod(fakeDocker, 0o755)

  let command
  let args
  const environment = {
    ...process.env,
    PATH: `${temporaryDir}${path.delimiter}${process.env.PATH}`,
    QA_CAPTURE_SQL: captureSql,
    QA_CAPTURE_URL: captureUrl,
    ZPAY_GATEWAY: 'https://payments.invalid/',
    ZPAY_PID: 'qa-pid',
    ZPAY_KEY: 'qa-payment-key',
    UPSTREAM_API_KEY: placeholderKey,
    UPSTREAM_BASE_URL: 'https://kukuai.fyi/v1/?utm_source=qa#fragment',
  }

  if (process.platform === 'win32') {
    const python = findWindowsExecutable(
      'python.exe',
      (candidate) => !candidate.includes('WindowsApps'),
    )
    const fakePythonSource = `#!/usr/bin/env bash
python_exe="$QA_PYTHON_EXE"
if command -v cygpath >/dev/null 2>&1; then
  python_exe="$(cygpath -u "$python_exe")"
fi
exec "$python_exe" "$@"
`
    await writeFile(fakePython, fakePythonSource, 'utf8')
    await chmod(fakePython, 0o755)
    environment.QA_PYTHON_EXE = python
    command = findBash()
    args = [dbBootstrap]
  } else {
    command = findBash()
    args = ['bash', dbBootstrap]
  }

  try {
    const result = await run(command, args, { env: environment })
    const sql = await readFile(captureSql, 'utf8').catch(() => '')
    const normalizedUrl = await readFile(captureUrl, 'utf8').catch(() => '')
    return { ...result, sql, normalizedUrl }
  } finally {
    await rm(temporaryDir, { recursive: true, force: true })
  }
}

async function testDbFallbackMigration() {
  const result = await runDbBootstrap()
  const source = await readFile(dbBootstrap, 'utf8')
  assert.equal(result.code, 0, result.stderr)
  assert.equal(result.normalizedUrl, 'https://kukuai.fyi')
  assert.match(
    result.sql,
    /\('About', '[\s\S]*?'\),\r?\n  \('general_setting\.docs_link'/,
    'the multiline About option must close before the next option row',
  )
  assert.match(
    result.sql,
    /\('legal\.user_agreement', '[\s\S]*?'\),\r?\n  \('legal\.privacy_policy'/,
    'the multiline user agreement must close before the privacy policy row',
  )
  assert.match(
    result.sql,
    /\('legal\.privacy_policy', '[\s\S]*?'\),\r?\n  \('PayAddress'/,
    'the multiline privacy policy must close before the payment rows',
  )

  const chatOptions = Array.from(
    result.sql.matchAll(/\('(?:chats|Chats|console_setting\.chats)', '([^']+)'\)/g),
    (match) => JSON.parse(match[1]),
  )
  assert.equal(chatOptions.length, 3, 'all chat option aliases must be generated')
  assert.deepEqual(chatOptions[1], chatOptions[0])
  assert.deepEqual(chatOptions[2], chatOptions[0])

  const integrationUrls = chatOptions[0].flatMap((integration) =>
    Object.values(integration).filter((value) => typeof value === 'string'),
  )
  const lobeUrl = integrationUrls.find((value) =>
    value.startsWith('https://chat-preview.lobehub.com/'),
  )
  const workspaceUrl = integrationUrls.find((value) => value.startsWith('https://aiaw.app/'))
  assert.ok(lobeUrl, 'Lobe Chat import URL must remain available')
  assert.ok(workspaceUrl, 'AI as Workspace import URL must remain available')
  assert.doesNotThrow(() => JSON.parse(new URL(lobeUrl).searchParams.get('settings')))
  assert.doesNotThrow(() => JSON.parse(new URL(workspaceUrl).searchParams.get('provider')))
  assert.match(source, /psql\s+-v\s+ON_ERROR_STOP=1/, 'psql errors must stop bootstrap')
  assert.match(result.sql, /'bblabu-upstream'/)
  assert.match(result.sql, /https:\/\/api\.bblabu\.chat/)
  assert.match(
    result.sql,
    /update channels set[\s\S]*name = 'kukuai-upstream'[\s\S]*where id = \([\s\S]*select min\(id\)/,
    'the smallest legacy/new row must be upgraded in place',
  )
  assert.match(
    result.sql,
    /delete from abilities[\s\S]*delete from channels[\s\S]*delete from abilities[\s\S]*insert into abilities/,
    'duplicate abilities/channels must be removed before canonical abilities are rebuilt',
  )
  assert.equal(result.stderr.includes(placeholderKey), false, 'keys must not be logged')
}

const tests = [
  ['API migrates the oldest legacy channel across all pages', testApiMigration],
  ['API aborts when duplicate deletion fails', testDeleteFailureStopsMigration],
  ['DB fallback normalizes and migrates legacy rows', testDbFallbackMigration],
]

let failures = 0
for (const [name, test] of tests) {
  try {
    await test()
    console.log(`ok - ${name}`)
  } catch (error) {
    failures += 1
    console.error(`not ok - ${name}: ${error.message}`)
  }
}

if (failures > 0) process.exitCode = 1
