package model

import (
	"time"

	"github.com/QuantumNous/new-api/common"
)

type AdminDashboardSummary struct {
	TodayNewUsers       int64 `json:"today_new_users"`
	TotalUsers          int64 `json:"total_users"`
	TodayRequests       int64 `json:"today_requests"`
	TodayTokens         int64 `json:"today_tokens"`
	TotalTokens         int64 `json:"total_tokens"`
	TodayQuota          int64 `json:"today_quota"`
	TodayTopup          int64 `json:"today_topup"`
	TodayFailedRequests int64 `json:"today_failed_requests"`
}

type AdminDashboardHourlyRequest struct {
	Hour     int64 `json:"hour"`
	Requests int64 `json:"requests"`
	Tokens   int64 `json:"tokens"`
}

type AdminDashboardTopModel struct {
	Model    string `json:"model"`
	Requests int64  `json:"requests"`
	Tokens   int64  `json:"tokens"`
	Quota    int64  `json:"quota"`
}

type AdminDashboardErrorSummary struct {
	Type  string `json:"type"`
	Count int64  `json:"count"`
}

type AdminDashboardUserActivity struct {
	CreatedApiKeyUsers int64 `json:"created_api_key_users"`
	ActiveUsers        int64 `json:"active_users"`
	TopupUsers         int64 `json:"topup_users"`
}

type AdminDashboardMetrics struct {
	AdminDashboardSummary
	HourlyRequests []AdminDashboardHourlyRequest `json:"hourly_requests"`
	TopModels      []AdminDashboardTopModel      `json:"top_models"`
	ErrorSummary   []AdminDashboardErrorSummary  `json:"error_summary"`
	UserActivity   AdminDashboardUserActivity    `json:"user_activity"`
}

type dashboardTokenSum struct {
	Tokens int64 `gorm:"column:tokens"`
}

type dashboardQuotaSum struct {
	Quota int64 `gorm:"column:quota"`
}

type dashboardTopupSum struct {
	Amount int64 `gorm:"column:amount"`
}

func GetAdminDashboardMetrics(now time.Time) (AdminDashboardMetrics, error) {
	startOfToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).Unix()
	endOfToday := startOfToday + 24*60*60 - 1

	metrics := AdminDashboardMetrics{}
	var err error

	if metrics.TodayNewUsers, err = countTodayUsers(startOfToday, endOfToday); err != nil {
		return metrics, err
	}
	if metrics.TotalUsers, err = countTotalUsers(); err != nil {
		return metrics, err
	}
	if metrics.TodayRequests, err = countTodayRequests(startOfToday, endOfToday); err != nil {
		return metrics, err
	}
	if metrics.TodayFailedRequests, err = countLogsByType(LogTypeError, startOfToday, endOfToday); err != nil {
		return metrics, err
	}
	if metrics.TodayTokens, err = sumLogTokens(startOfToday, endOfToday); err != nil {
		return metrics, err
	}
	if metrics.TotalTokens, err = sumLogTokens(0, 0); err != nil {
		return metrics, err
	}
	if metrics.TodayQuota, err = sumLogQuota(startOfToday, endOfToday); err != nil {
		return metrics, err
	}
	if metrics.TodayTopup, err = sumTodayTopup(startOfToday, endOfToday); err != nil {
		return metrics, err
	}
	if metrics.HourlyRequests, err = getHourlyRequests(startOfToday); err != nil {
		return metrics, err
	}
	if metrics.TopModels, err = getTopModels(startOfToday, endOfToday, 5); err != nil {
		return metrics, err
	}
	if metrics.ErrorSummary, err = getErrorSummary(startOfToday, endOfToday); err != nil {
		return metrics, err
	}
	if metrics.UserActivity, err = getUserActivity(startOfToday, endOfToday); err != nil {
		return metrics, err
	}

	return metrics, nil
}

func countTodayUsers(startTimestamp int64, endTimestamp int64) (int64, error) {
	var count int64
	err := DB.Model(&User{}).
		Where("created_at >= ? AND created_at <= ?", startTimestamp, endTimestamp).
		Count(&count).Error
	return count, err
}

func countTotalUsers() (int64, error) {
	var count int64
	err := DB.Model(&User{}).Count(&count).Error
	return count, err
}

func countLogsByType(logType int, startTimestamp int64, endTimestamp int64) (int64, error) {
	var count int64
	tx := LOG_DB.Model(&Log{}).Where("type = ?", logType)
	if startTimestamp > 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	err := tx.Count(&count).Error
	return count, err
}

func countTodayRequests(startTimestamp int64, endTimestamp int64) (int64, error) {
	var count int64
	err := LOG_DB.Model(&Log{}).
		Where("created_at >= ? AND created_at <= ?", startTimestamp, endTimestamp).
		Where("type IN ?", []int{LogTypeConsume, LogTypeError}).
		Count(&count).Error
	return count, err
}

func sumLogTokens(startTimestamp int64, endTimestamp int64) (int64, error) {
	sum := dashboardTokenSum{}
	tx := LOG_DB.Model(&Log{}).
		Select("COALESCE(sum(prompt_tokens), 0) + COALESCE(sum(completion_tokens), 0) AS tokens").
		Where("type = ?", LogTypeConsume)
	if startTimestamp > 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	err := tx.Scan(&sum).Error
	return sum.Tokens, err
}

func sumLogQuota(startTimestamp int64, endTimestamp int64) (int64, error) {
	sum := dashboardQuotaSum{}
	tx := LOG_DB.Model(&Log{}).
		Select("COALESCE(sum(quota), 0) AS quota").
		Where("type = ?", LogTypeConsume)
	if startTimestamp > 0 {
		tx = tx.Where("created_at >= ?", startTimestamp)
	}
	if endTimestamp > 0 {
		tx = tx.Where("created_at <= ?", endTimestamp)
	}
	err := tx.Scan(&sum).Error
	return sum.Quota, err
}

func sumTodayTopup(startTimestamp int64, endTimestamp int64) (int64, error) {
	sum := dashboardTopupSum{}
	err := DB.Model(&TopUp{}).
		Select("COALESCE(sum(amount), 0) AS amount").
		Where("status = ?", common.TopUpStatusSuccess).
		Where("complete_time >= ? AND complete_time <= ?", startTimestamp, endTimestamp).
		Scan(&sum).Error
	return sum.Amount, err
}

func getHourlyRequests(startOfToday int64) ([]AdminDashboardHourlyRequest, error) {
	items := make([]AdminDashboardHourlyRequest, 0, 24)
	for hour := 0; hour < 24; hour++ {
		start := startOfToday + int64(hour)*60*60
		end := start + 60*60 - 1
		var requests int64
		if err := LOG_DB.Model(&Log{}).
			Where("created_at >= ? AND created_at <= ?", start, end).
			Where("type IN ?", []int{LogTypeConsume, LogTypeError}).
			Count(&requests).Error; err != nil {
			return nil, err
		}
		tokens, err := sumLogTokens(start, end)
		if err != nil {
			return nil, err
		}
		items = append(items, AdminDashboardHourlyRequest{
			Hour:     start,
			Requests: requests,
			Tokens:   tokens,
		})
	}
	return items, nil
}

func getTopModels(startTimestamp int64, endTimestamp int64, limit int) ([]AdminDashboardTopModel, error) {
	type row struct {
		Model    string `gorm:"column:model"`
		Requests int64  `gorm:"column:requests"`
		Tokens   int64  `gorm:"column:tokens"`
		Quota    int64  `gorm:"column:quota"`
	}
	rows := make([]row, 0, limit)
	err := LOG_DB.Model(&Log{}).
		Select("model_name AS model, count(*) AS requests, COALESCE(sum(prompt_tokens), 0) + COALESCE(sum(completion_tokens), 0) AS tokens, COALESCE(sum(quota), 0) AS quota").
		Where("type = ?", LogTypeConsume).
		Where("created_at >= ? AND created_at <= ?", startTimestamp, endTimestamp).
		Where("model_name <> ?", "").
		Group("model_name").
		Order("tokens DESC").
		Limit(limit).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	items := make([]AdminDashboardTopModel, 0, len(rows))
	for _, row := range rows {
		items = append(items, AdminDashboardTopModel(row))
	}
	return items, nil
}

func getErrorSummary(startTimestamp int64, endTimestamp int64) ([]AdminDashboardErrorSummary, error) {
	definitions := []struct {
		name    string
		pattern string
	}{
		{name: "insufficient_quota", pattern: "%余额%"},
		{name: "model_not_found", pattern: "%模型%"},
		{name: "timeout", pattern: "%timeout%"},
	}

	items := make([]AdminDashboardErrorSummary, 0, len(definitions)+1)
	var knownTotal int64
	for _, definition := range definitions {
		var count int64
		err := LOG_DB.Model(&Log{}).
			Where("type = ?", LogTypeError).
			Where("created_at >= ? AND created_at <= ?", startTimestamp, endTimestamp).
			Where("content LIKE ?", definition.pattern).
			Count(&count).Error
		if err != nil {
			return nil, err
		}
		if count > 0 {
			items = append(items, AdminDashboardErrorSummary{Type: definition.name, Count: count})
			knownTotal += count
		}
	}

	total, err := countLogsByType(LogTypeError, startTimestamp, endTimestamp)
	if err != nil {
		return nil, err
	}
	otherCount := total - knownTotal
	if otherCount > 0 {
		items = append(items, AdminDashboardErrorSummary{Type: "other", Count: otherCount})
	}
	return items, nil
}

func getUserActivity(startTimestamp int64, endTimestamp int64) (AdminDashboardUserActivity, error) {
	activity := AdminDashboardUserActivity{}

	err := DB.Model(&Token{}).
		Where("created_time >= ? AND created_time <= ?", startTimestamp, endTimestamp).
		Distinct("user_id").
		Count(&activity.CreatedApiKeyUsers).Error
	if err != nil {
		return activity, err
	}

	err = LOG_DB.Model(&Log{}).
		Where("created_at >= ? AND created_at <= ?", startTimestamp, endTimestamp).
		Where("type IN ?", []int{LogTypeConsume, LogTypeError}).
		Distinct("user_id").
		Count(&activity.ActiveUsers).Error
	if err != nil {
		return activity, err
	}

	err = DB.Model(&TopUp{}).
		Where("status = ?", common.TopUpStatusSuccess).
		Where("complete_time >= ? AND complete_time <= ?", startTimestamp, endTimestamp).
		Distinct("user_id").
		Count(&activity.TopupUsers).Error
	if err != nil {
		return activity, err
	}

	return activity, nil
}
