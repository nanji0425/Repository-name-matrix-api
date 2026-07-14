/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
export function formatCompactNumber(value: number | null | undefined): string {
  const normalized = Number(value || 0)
  return new Intl.NumberFormat(undefined, {
    notation: Math.abs(normalized) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(normalized) >= 10000 ? 1 : 0,
  }).format(normalized)
}

export function formatTokens(value: number | null | undefined): string {
  const normalized = Number(value || 0)
  if (normalized >= 1_000_000_000)
    return `${(normalized / 1_000_000_000).toFixed(2)}B`
  if (normalized >= 1_000_000) return `${(normalized / 1_000_000).toFixed(2)}M`
  if (normalized >= 1_000) return `${(normalized / 1_000).toFixed(1)}K`
  return String(Math.round(normalized))
}

export function formatHourLabel(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000))
}

export function formatErrorType(type: string): string {
  switch (type) {
    case 'insufficient_quota':
      return 'Insufficient balance'
    case 'model_not_found':
      return 'Model not found'
    case 'timeout':
      return 'Request timeout'
    default:
      return 'Other exceptions'
  }
}
