/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or (at your
option) any later version.
*/
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  getLatestSuccessfulChannelTestCachePatch,
  normalizeChannelTestResponse,
  type ChannelTestNormalizedResult,
} from './channel-test-utils.ts'

function normalize(value: unknown): ChannelTestNormalizedResult {
  return normalizeChannelTestResponse(value, 'Test failed')
}

describe('channel test response normalization', () => {
  test('keeps successful response timing from the API payload', () => {
    assert.deepEqual(
      normalize({
        success: true,
        time: 0.42,
        data: { response_time: 420 },
      }),
      {
        success: true,
        time: 0.42,
        responseTime: 420,
      }
    )
  })

  test('preserves nested upstream errors and status codes', () => {
    const result = normalize({
      success: false,
      error_code: 'bad_response_status_code',
      upstream_status: 502,
      error: { message: 'upstream overloaded' },
    })

    assert.equal(result.success, false)
    assert.equal(result.errorCode, 'bad_response_status_code')
    assert.equal(result.upstreamStatus, 502)
    assert.match(result.error || '', /502/)
    assert.match(result.error || '', /upstream overloaded/)
  })

  test('turns HTTP authorization failures into actionable messages', () => {
    for (const [status, keyword] of [
      [401, 'authentication'],
      [403, 'permission'],
      [429, 'rate'],
    ] as const) {
      const result = normalize({
        response: {
          status,
          data: { error: { message: 'provider rejected the request' } },
        },
      })
      assert.equal(result.success, false)
      assert.match(result.error || '', new RegExp(keyword, 'i'))
      assert.match(result.error || '', /provider rejected the request/)
      assert.equal(result.status, status)
    }

    const upstream = normalize({
      success: false,
      upstream_status: 401,
      message: 'upstream rejected the API key',
    })
    assert.match(upstream.error || '', /authentication/i)
    assert.match(upstream.error || '', /upstream rejected the API key/)
  })

  test('distinguishes network and empty responses', () => {
    const network = normalize({
      message: 'Network Error',
      request: {},
    })
    assert.match(network.error || '', /network/i)

    const empty = normalize(undefined)
    assert.match(empty.error || '', /empty response/i)

    const upstreamText = normalize({
      response: { status: 500, data: 'upstream down' },
    })
    assert.match(upstreamText.error || '', /upstream down/)

    const emptyBody = normalize({
      response: { status: 204, data: '' },
    })
    assert.match(emptyBody.error || '', /empty response/i)
  })

  test('falls back to an error code when the server omits a message', () => {
    const result = normalize({ success: false, error_code: 'provider_error' })
    assert.match(result.error || '', /provider_error/)
  })

  test('only successful tests refresh the channel timing cache', () => {
    assert.deepEqual(
      getLatestSuccessfulChannelTestCachePatch([
        {
          status: 'error',
          responseTime: 900,
          completedAt: 3000,
        },
        {
          status: 'success',
          responseTime: 240,
          completedAt: 2000,
        },
        {
          status: 'error',
          responseTime: 100,
          completedAt: 4000,
        },
      ]),
      { responseTime: 240, testTime: 2 }
    )
    assert.equal(
      getLatestSuccessfulChannelTestCachePatch([
        { status: 'error', responseTime: 900, completedAt: 3000 },
      ]),
      undefined
    )
  })
})
