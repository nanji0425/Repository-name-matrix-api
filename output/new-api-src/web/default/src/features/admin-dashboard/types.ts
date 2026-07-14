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
export type AdminDashboardHourlyRequest = {
  hour: number
  requests: number
  tokens: number
}

export type AdminDashboardTopModel = {
  model: string
  requests: number
  tokens: number
  quota: number
}

export type AdminDashboardErrorSummary = {
  type: string
  count: number
}

export type AdminDashboardUserActivity = {
  created_api_key_users: number
  active_users: number
  topup_users: number
}

export type AdminDashboardMetrics = {
  today_new_users: number
  total_users: number
  today_requests: number
  today_tokens: number
  total_tokens: number
  today_quota: number
  today_topup: number
  today_failed_requests: number
  hourly_requests: AdminDashboardHourlyRequest[]
  top_models: AdminDashboardTopModel[]
  error_summary: AdminDashboardErrorSummary[]
  user_activity: AdminDashboardUserActivity
}

export type AdminDashboardMetricsResponse = {
  success: boolean
  message: string
  data: AdminDashboardMetrics
}
