import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import type { Model } from '../types'
import { transformFormDataToModelPayload, transformModelToFormDefaults } from './model-form'

const model = {
  id: 42,
  model_name: 'gpt-5.4',
  description: 'MatrixAPI test model',
  icon: '',
  tags: '',
  vendor_id: 1,
  endpoints: '',
  name_rule: 0,
  status: 1,
  sync_official: 1,
  enable_groups: [],
  quota_types: [],
} as unknown as Model

describe('model description form flow', () => {
  test('loads the existing description into edit defaults', () => {
    assert.equal(transformModelToFormDefaults(model).description, 'MatrixAPI test model')
  })

  test('keeps description in the update payload', () => {
    const payload = transformFormDataToModelPayload({
      ...transformModelToFormDefaults(model),
      description: 'Updated description',
    })
    assert.equal(payload.description, 'Updated description')
  })

  test('normalizes an empty description instead of dropping the field', () => {
    const payload = transformFormDataToModelPayload({
      ...transformModelToFormDefaults(model),
      description: '   ',
    })
    assert.equal(payload.description, '')
  })
})
