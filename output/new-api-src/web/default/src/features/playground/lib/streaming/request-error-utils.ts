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
import { ERROR_MESSAGES } from '../../constants'

type RequestErrorLike = {
  message?: unknown
  response?: {
    data?: unknown
  }
}

export type RequestErrorDetails = {
  errorCode?: string
  errorMessage: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null
}

function nestedString(value: unknown, key: string): string | undefined {
  const record = asRecord(value)
  const candidate = record?.[key]
  return typeof candidate === 'string' && candidate.trim() !== ''
    ? candidate
    : undefined
}

function nestedMessage(value: unknown, depth = 0): string | undefined {
  if (depth > 4) return undefined
  if (typeof value === 'string' && value.trim() !== '') return value

  return (
    nestedString(value, 'message') ??
    nestedMessage(asRecord(value)?.error, depth + 1)
  )
}

function nestedCode(value: unknown, depth = 0): string | undefined {
  if (depth > 4) return undefined

  return (
    nestedString(value, 'code') ??
    nestedCode(asRecord(value)?.error, depth + 1)
  )
}

export function parseRequestErrorDetails(error: unknown): RequestErrorDetails {
  const requestError = error as RequestErrorLike
  const responseData = requestError?.response?.data

  return {
    errorCode: nestedCode(responseData),
    errorMessage:
      nestedMessage(responseData) ||
      (typeof requestError?.message === 'string'
        ? requestError.message
        : undefined) ||
      ERROR_MESSAGES.API_REQUEST_ERROR,
  }
}
