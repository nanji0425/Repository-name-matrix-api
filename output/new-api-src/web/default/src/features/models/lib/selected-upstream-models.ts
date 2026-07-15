import type { Model } from '../types'

export type SelectedUpstreamChannel = {
  id: number
  name: string
  models?: string
}

export type SelectedUpstreamModel = Model & {
  source_channel_id: number
  source_channel_name: string
}

export function parseSelectedUpstreamChannelIds(raw: string | undefined): number[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (id): id is number =>
        typeof id === 'number' && Number.isInteger(id) && id > 0
    )
  } catch {
    return []
  }
}

function createMissingModel(modelName: string): Model {
  return {
    id: 0,
    model_name: modelName,
    description: '',
    icon: '',
    tags: '',
    endpoints: '',
    status: 1,
    sync_official: 0,
    created_time: 0,
    updated_time: 0,
    name_rule: 0,
  }
}

export function buildSelectedUpstreamModelRows(
  channels: SelectedUpstreamChannel[],
  metadata: Model[],
  selectedChannelIds: number[]
): SelectedUpstreamModel[] {
  const selectedIds = new Set(selectedChannelIds)
  const metadataByName = new Map(metadata.map((model) => [model.model_name, model]))
  const rows: SelectedUpstreamModel[] = []

  for (const channel of channels) {
    if (!selectedIds.has(channel.id)) continue

    const modelNames = (channel.models || '')
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)

    for (const modelName of modelNames) {
      rows.push({
        ...(metadataByName.get(modelName) || createMissingModel(modelName)),
        source_channel_id: channel.id,
        source_channel_name: channel.name,
      })
    }
  }

  return rows
}
