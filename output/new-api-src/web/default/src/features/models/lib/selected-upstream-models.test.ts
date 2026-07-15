import { strict as assert } from 'node:assert'

import type { Model } from '../types'
import {
  buildSelectedUpstreamModelRows,
  type SelectedUpstreamChannel,
} from './selected-upstream-models'

const metadata: Model[] = [
  {
    id: 7,
    model_name: 'gpt-4o',
    description: 'OpenAI model',
    status: 1,
    sync_official: 1,
    created_time: 1,
    updated_time: 1,
    name_rule: 0,
  },
]

const channels: SelectedUpstreamChannel[] = [
  { id: 11, name: 'OpenAI 主账号', models: 'gpt-4o, claude-3-7-sonnet' },
  { id: 12, name: 'OpenAI 备用账号', models: 'gpt-4o' },
  { id: 13, name: '未选择渠道', models: 'gemini-2.5-pro' },
]

const rows = buildSelectedUpstreamModelRows(channels, metadata, [11, 12])
assert.deepEqual(
  rows.map((row) => [row.model_name, row.source_channel_name]),
  [
    ['gpt-4o', 'OpenAI 主账号'],
    ['claude-3-7-sonnet', 'OpenAI 主账号'],
    ['gpt-4o', 'OpenAI 备用账号'],
  ]
)
assert.equal(rows[0].id, 7)
assert.equal(rows[1].id, 0)

const selectedRows = buildSelectedUpstreamModelRows(channels, metadata, [11])
assert.deepEqual(selectedRows.map((row) => row.model_name), [
  'gpt-4o',
  'claude-3-7-sonnet',
])
