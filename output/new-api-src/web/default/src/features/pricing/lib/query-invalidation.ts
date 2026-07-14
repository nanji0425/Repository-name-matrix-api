type PricingQueryClient = {
  invalidateQueries: (options: { queryKey: string[] }) => Promise<unknown> | unknown
}

export const PRICING_QUERY_KEY = ['pricing'] as const

export function invalidatePricingQueries(queryClient: PricingQueryClient) {
  return queryClient.invalidateQueries({ queryKey: [...PRICING_QUERY_KEY] })
}
