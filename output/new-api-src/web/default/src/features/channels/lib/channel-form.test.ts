import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  CHANNEL_FORM_DEFAULT_VALUES,
  transformFormDataToCreatePayload,
} from './channel-form'

describe('channel upstream price markup', () => {
  test('persists the configured percentage in channel settings', () => {
    const payload = transformFormDataToCreatePayload({
      ...CHANNEL_FORM_DEFAULT_VALUES,
      name: 'upstream',
      key: 'key',
      models: 'model-a',
      upstream_price_markup: 40,
    })

    assert.equal(
      JSON.parse(String(payload.channel.settings)).upstream_price_markup,
      40
    )
  })
})
