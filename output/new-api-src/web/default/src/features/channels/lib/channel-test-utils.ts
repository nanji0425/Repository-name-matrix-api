type UnknownRecord = Record<string, unknown>

export type ChannelTestNormalizedResult = {
  success: boolean
  status?: number
  upstreamStatus?: number
  time?: number
  responseTime?: number
  error?: string
  errorCode?: string
}

export type ChannelTestCachePatch = {
  responseTime: number
  testTime: number
}

export type ChannelTestResultSnapshot = {
  status: 'idle' | 'testing' | 'success' | 'error'
  responseTime?: number
  completedAt?: number
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function asRecord(value: unknown): UnknownRecord | undefined {
  return isRecord(value) ? value : undefined
}

function finiteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

function nestedMessage(value: unknown): string | undefined {
  const record = asRecord(value)
  if (!record) return undefined
  return firstString(
    record.message,
    record.detail,
    record.error_description,
    record.reason
  )
}

function errorText(value: unknown): string | undefined {
  const record = asRecord(value)
  if (!record) return firstString(value)

  const error = record.error
  return firstString(
    record.message,
    nestedMessage(error),
    typeof error === 'string' ? error : undefined,
    record.detail,
    record.error_description,
    record.reason
  )
}

function formatFailureMessage(options: {
  status?: number
  upstreamStatus?: number
  message?: string
  errorCode?: string
  network: boolean
  empty: boolean
  fallback: string
}): string {
  const {
    status,
    upstreamStatus,
    message,
    errorCode,
    network,
    empty,
    fallback,
  } = options
  const detail = message || errorCode || fallback

  if (empty) {
    return 'Empty response from channel test endpoint.'
  }

  if (network) {
    return `Network error while testing channel: ${detail}. Check the base URL, connectivity, and proxy settings.`
  }

  const effectiveStatus = upstreamStatus ?? status
  if (effectiveStatus === 401) {
    return `Authentication failed (HTTP 401): ${detail}. Check the channel API key.`
  }
  if (effectiveStatus === 403) {
    return `Permission denied (HTTP 403): ${detail}. Check the channel credentials and upstream permissions.`
  }
  if (effectiveStatus === 429) {
    return `Rate limited (HTTP 429): ${detail}. Retry after the upstream limit resets.`
  }

  if (upstreamStatus !== undefined) {
    return `Upstream HTTP ${upstreamStatus}: ${detail}`
  }
  if (status !== undefined && status >= 400) {
    return `Channel test request failed (HTTP ${status}): ${detail}`
  }
  return detail
}

export function createChannelTestCachePatch(
  responseTime?: number,
  completedAt = Date.now()
): ChannelTestCachePatch | undefined {
  if (typeof responseTime !== 'number' || !Number.isFinite(responseTime)) {
    return undefined
  }

  return {
    responseTime,
    testTime: Math.floor(completedAt / 1000),
  }
}

export function getLatestSuccessfulChannelTestCachePatch(
  results: ChannelTestResultSnapshot[]
): ChannelTestCachePatch | undefined {
  const latest = results
    .filter((result) => result.status === 'success')
    .reduce<{ patch: ChannelTestCachePatch; completedAt: number } | undefined>(
      (latestPatch, result) => {
        const completedAt = result.completedAt ?? 0
        const patch = createChannelTestCachePatch(
          result.responseTime,
          completedAt
        )
        if (!patch) return latestPatch
        if (!latestPatch || completedAt >= latestPatch.completedAt) {
          return { patch, completedAt }
        }
        return latestPatch
      },
      undefined
    )

  return latest?.patch
}

/**
 * Normalize both the API's `{success:false,...}` payloads and Axios errors
 * into one shape that the channel test UI can safely render. The helper is
 * deliberately side-effect free so it can be covered without a browser.
 */
export function normalizeChannelTestResponse(
  value: unknown,
  fallback = 'Test failed'
): ChannelTestNormalizedResult {
  const root = asRecord(value)
  const response = asRecord(root?.response)
  const payload = asRecord(response?.data) || root
  const payloadData = asRecord(payload?.data)
  const nestedError = asRecord(payload?.error)

  const status = finiteNumber(response?.status ?? root?.status)
  const upstreamStatus = finiteNumber(
    payload?.upstream_status ??
      payloadData?.upstream_status ??
      payload?.status_code ??
      payloadData?.status_code ??
      nestedError?.upstream_status ??
      nestedError?.status_code
  )
  const time = finiteNumber(payload?.time ?? payloadData?.time)
  const responseTime = finiteNumber(
    payload?.response_time ??
      payloadData?.response_time ??
      (time !== undefined ? time * 1000 : undefined)
  )
  const errorCode = firstString(
    payload?.error_code,
    payloadData?.error_code,
    nestedError?.code,
    nestedError?.error_code
  )
  const responseDataText = firstString(response?.data)
  const message = firstString(
    errorText(payload),
    errorText(payloadData),
    responseDataText,
    firstString(root?.message),
    errorText(root?.error)
  )
  const hasPayload = payload !== undefined && Object.keys(payload).length > 0
  const empty =
    !hasPayload ||
    (response !== undefined &&
      (response.data == null ||
        (typeof response.data === 'string' && response.data.trim() === '')))
  const network =
    !response &&
    root !== undefined &&
    (root.request !== undefined ||
      /network|timeout|econn|enotfound|fetch failed/i.test(message || ''))
  const success =
    payload?.success === true &&
    !network &&
    !empty &&
    !(status && status >= 400)

  const result: ChannelTestNormalizedResult = { success }
  if (status !== undefined) result.status = status
  if (upstreamStatus !== undefined) result.upstreamStatus = upstreamStatus
  if (time !== undefined) result.time = time
  if (responseTime !== undefined) result.responseTime = responseTime
  if (!success) {
    result.error = formatFailureMessage({
      status,
      upstreamStatus,
      message,
      errorCode,
      network,
      empty,
      fallback,
    })
  }
  if (errorCode !== undefined) result.errorCode = errorCode
  return result
}
