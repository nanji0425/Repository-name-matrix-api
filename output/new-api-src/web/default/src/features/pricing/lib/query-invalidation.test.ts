import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

const { invalidatePricingQueries } = await import(
  new URL('./query-invalidation.ts', import.meta.url).href
)

describe('pricing query invalidation', () => {
  test('refreshes the model square pricing query', async () => {
    const calls: unknown[] = []

    await invalidatePricingQueries({
      invalidateQueries: (options: unknown) => {
        calls.push(options)
        return Promise.resolve()
      },
    })

    assert.deepEqual(calls, [{ queryKey: ['pricing'] }])
  })
})
