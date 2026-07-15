import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const host = process.env.MATRIXAPI_HOST || '47.82.105.81';
export const keyPath = process.env.SSH_KEY_PATH || (
  existsSync(resolve('mz.pem'))
    ? resolve('mz.pem')
    : 'C:\\Users\\Administrator\\Downloads\\server_key_restrict.pem'
);
export const baseURL = process.env.MATRIXAPI_URL || 'https://matrixapi.online';

export function readSecret(name) {
  if (process.env[name]) return process.env[name];

  if (process.env.MATRIXAPI_LOCAL_SECRETS === '1') {
    return execFileSync('sh', [
      '-lc',
      `cd /workspace 2>/dev/null || cd /root/token_API; sed -n 's/^${name}=//p' .env`,
    ], { encoding: 'utf8', timeout: 15000 }).trim();
  }

  return execFileSync('ssh', [
    '-i',
    keyPath,
    '-o',
    'StrictHostKeyChecking=no',
    `root@${host}`,
    `cd /root/token_API && sed -n 's/^${name}=//p' .env`,
  ], { encoding: 'utf8', timeout: 15000 }).trim();
}

export function redact(value) {
  return String(value)
    .replace(/(pid|sign|out_trade_no|notify_url|return_url|name|money)=([^&"]+)/g, '$1=[REDACTED]')
    .replace(/"session":"[^"]+"/g, '"session":"[REDACTED]"')
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, 'sk-[REDACTED]');
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loginAsAdmin(page, options = {}) {
  const username = options.username || readSecret('NEW_API_ADMIN_USERNAME');
  const password = options.password || readSecret('NEW_API_ADMIN_PASSWORD');
  const maxAttempts = options.maxAttempts || 5;

  let lastError = '';
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await page.request.post(`${baseURL}/api/user/login`, {
      ignoreHTTPSErrors: true,
      data: { username, password },
    });
    const text = await response.text();

    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (_) {
      lastError = `non-JSON ${response.status()}: ${redact(text.slice(0, 240))}`;
    }

    if (json?.success) {
      return {
        userId: String(json.data.id),
        userData: json.data,
        response,
        json,
      };
    }

    const message = json?.message || lastError || `HTTP ${response.status()}`;
    lastError = `attempt ${attempt}/${maxAttempts}: ${message}`;
    if (response.status() === 429 || /rate|too many|频繁|请求/.test(message)) {
      await sleep(Math.min(30000, 2500 * attempt));
      continue;
    }

    throw new Error(`Login failed: ${message}`);
  }

  throw new Error(`Login failed after ${maxAttempts} attempts: ${lastError}`);
}

export async function installAdminSession(page, loginData, options = {}) {
  const { userId, userData } = loginData;
  await page.route('**/api/**', async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        'New-Api-User': userId,
      },
    });
  });

  await page.addInitScript(({ userId, userData, locale, theme }) => {
    localStorage.setItem('uid', userId);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('locale', locale);
    localStorage.setItem('matrix-lang', locale);
    localStorage.setItem('theme-mode', theme);
    localStorage.setItem('matrix-theme', theme);
  }, {
    userId,
    userData,
    locale: options.locale || 'zh',
    theme: options.theme || 'dark',
  });

  return { userId, userData };
}

export async function loginAndInstallAdmin(page, options = {}) {
  const loginData = await loginAsAdmin(page, options);
  await installAdminSession(page, loginData, options);
  return loginData;
}

export async function requestJsonWithRetry(requestContext, method, url, options = {}) {
  const maxAttempts = options.maxAttempts || 4;
  const retryBaseMs = options.retryBaseMs || 1800;
  let lastError = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await requestContext[method](url, {
      ...options,
      ignoreHTTPSErrors: true,
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (_) {
      lastError = `${method.toUpperCase()} ${url} returned non-JSON ${response.status()}: ${redact(text.slice(0, 240))}`;
    }

    if (json) return { response, json, text };

    if (response.status() === 429 || !text) {
      lastError ||= `${method.toUpperCase()} ${url} returned empty ${response.status()}`;
      await sleep(Math.min(45000, retryBaseMs * attempt));
      continue;
    }

    throw new Error(lastError);
  }

  throw new Error(`${method.toUpperCase()} ${url} failed after ${maxAttempts} attempts: ${lastError}`);
}
