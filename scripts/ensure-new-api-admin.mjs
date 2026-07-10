#!/usr/bin/env node

const baseUrl = (process.env.MATRIXAPI_URL || 'http://127.0.0.1').replace(/\/$/, '');
const username = process.env.NEW_API_ADMIN_USERNAME || process.env.ADMIN_USERNAME;
const password = process.env.NEW_API_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

function requireEnv(name, value) {
  if (!value || String(value).trim() === '') {
    throw new Error(`${name} is required`);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { ok: response.ok, status: response.status, body };
}

function safeMessage(value) {
  return String(value || '')
    .replace(/password[^,}\]]*/gi, 'password:[REDACTED]')
    .replace(/token[^,}\]]*/gi, 'token:[REDACTED]')
    .slice(0, 300);
}

async function login() {
  return request('/api/user/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

async function register() {
  const payloads = [
    { username, password, password2: password },
    { username, password, confirmPassword: password },
  ];

  const paths = ['/api/user/register', '/api/user/register?turnstile='];
  const errors = [];
  for (const path of paths) {
    for (const payload of payloads) {
      const result = await request(path, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (result.ok && result.body?.success) return result;

      const message = result.body?.message || result.body?.error || result.status;
      if (/exist|already|已存在|用户名已被使用/i.test(String(message))) return result;
      errors.push(`${path}: ${safeMessage(message)}`);
    }
  }

  throw new Error(`Unable to create admin user through New API registration: ${errors.join(' | ')}`);
}

async function main() {
  requireEnv('NEW_API_ADMIN_USERNAME or ADMIN_USERNAME', username);
  requireEnv('NEW_API_ADMIN_PASSWORD or ADMIN_PASSWORD', password);

  let result = await login();
  if (!result.ok || !result.body?.success) {
    await register();
    result = await login();
  }

  if (!result.ok || !result.body?.success) {
    throw new Error(`Admin account exists/registration attempted but login failed: ${safeMessage(result.body?.message || result.status)}`);
  }

  console.log('MatrixAPI admin account can authenticate.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
