import { createHash } from 'crypto';

export type ZpayParams = Record<string, string | number | null | undefined>;

export function signZpayParams(params: ZpayParams, merchantKey: string): string {
  const payload = Object.keys(params)
    .filter((key) => key !== 'sign' && key !== 'sign_type')
    .filter((key) => params[key] !== undefined && params[key] !== null && String(params[key]) !== '')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return createHash('md5').update(`${payload}${merchantKey}`).digest('hex').toLowerCase();
}

export function verifyZpaySignature(params: ZpayParams, merchantKey: string): boolean {
  const sign = params.sign;
  if (!sign) return false;
  return signZpayParams(params, merchantKey) === String(sign).toLowerCase();
}

export function buildZpayPaymentUrl(gateway: string, params: ZpayParams): string {
  const base = gateway.endsWith('/') ? gateway : `${gateway}/`;
  const url = new URL('submit.php', base);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value) !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export function normalizeZpayGateway(gateway?: string): string {
  return gateway?.trim() || 'https://zpayz.cn/';
}
