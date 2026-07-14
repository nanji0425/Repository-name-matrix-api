import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { supportsBalanceQuery } from './channel-utils'

describe('supportsBalanceQuery', () => {
  test('allows providers with implemented balance endpoints', () => {
    assert.equal(
      supportsBalanceQuery({
        type: 20,
        channel_info: {
          is_multi_key: false,
          multi_key_size: 0,
          multi_key_polling_index: 0,
          multi_key_mode: 'random',
        },
      }),
      true
    )
  })

  test('rejects unsupported and multi-key channels', () => {
    const singleKeyInfo = {
      is_multi_key: false,
      multi_key_size: 0,
      multi_key_polling_index: 0,
      multi_key_mode: 'random' as const,
    }
    assert.equal(
      supportsBalanceQuery({ type: 14, channel_info: singleKeyInfo }),
      false
    )
    assert.equal(
      supportsBalanceQuery({
        type: 1,
        channel_info: { ...singleKeyInfo, is_multi_key: true },
      }),
      false
    )
  })
})
