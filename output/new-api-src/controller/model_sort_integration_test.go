package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestListModelsSortsTokenLimitedModelsByName(t *testing.T) {
	setupModelListControllerTestDB(t)
	originalSelfUseMode := operation_setting.SelfUseModeEnabled
	operation_setting.SelfUseModeEnabled = true
	t.Cleanup(func() {
		operation_setting.SelfUseModeEnabled = originalSelfUseMode
	})

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/v1/models", nil)
	common.SetContextKey(ctx, constant.ContextKeyUserGroup, "default")
	common.SetContextKey(ctx, constant.ContextKeyTokenModelLimitEnabled, true)
	common.SetContextKey(ctx, constant.ContextKeyTokenModelLimit, map[string]bool{
		"zeta-model":  true,
		"beta-model":  true,
		"alpha-model": true,
		"Alpha-model": true,
	})

	ListModels(ctx, constant.ChannelTypeOpenAI)

	require.Equal(t, http.StatusOK, recorder.Code)
	var response struct {
		Success bool               `json:"success"`
		Data    []dto.OpenAIModels `json:"data"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	require.True(t, response.Success)
	names := make([]string, 0, len(response.Data))
	for _, item := range response.Data {
		names = append(names, item.Id)
	}
	require.Equal(t, []string{
		"Alpha-model",
		"alpha-model",
		"beta-model",
		"zeta-model",
	}, names)
}

func TestPricingCacheSortsModelsByName(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	require.NoError(t, db.Create(&model.Channel{
		Id:     1,
		Type:   constant.ChannelTypeOpenAI,
		Key:    "sort-test-key",
		Status: common.ChannelStatusEnabled,
		Name:   "sort-test-channel",
	}).Error)
	require.NoError(t, db.Create(&[]model.Ability{
		{Group: "default", Model: "zeta-model", ChannelId: 1, Enabled: true},
		{Group: "default", Model: "beta-model", ChannelId: 1, Enabled: true},
		{Group: "default", Model: "alpha-model", ChannelId: 1, Enabled: true},
		{Group: "default", Model: "Alpha-model", ChannelId: 1, Enabled: true},
	}).Error)
	model.InvalidatePricingCache()
	t.Cleanup(model.InvalidatePricingCache)

	pricing := model.GetPricing()
	names := make([]string, 0, len(pricing))
	for _, item := range pricing {
		names = append(names, item.ModelName)
	}
	require.Equal(t, []string{
		"Alpha-model",
		"alpha-model",
		"beta-model",
		"zeta-model",
	}, names)
}
