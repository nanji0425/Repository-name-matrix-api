package controller

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func withModelSyncUpstream(t *testing.T, modelsJSON string) string {
	t.Helper()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/api/newapi/models.json":
			_, _ = w.Write([]byte(modelsJSON))
		case "/api/newapi/vendors.json":
			_, _ = w.Write([]byte(`{"success":true,"data":[]}`))
		default:
			http.NotFound(w, r)
		}
	}))

	originalBase, hadBase := os.LookupEnv("SYNC_UPSTREAM_BASE")
	require.NoError(t, os.Setenv("SYNC_UPSTREAM_BASE", server.URL))

	cacheMutex.Lock()
	etagCache = make(map[string]string)
	bodyCache = make(map[string][]byte)
	cacheMutex.Unlock()

	t.Cleanup(func() {
		server.Close()
		if hadBase {
			require.NoError(t, os.Setenv("SYNC_UPSTREAM_BASE", originalBase))
		} else {
			require.NoError(t, os.Unsetenv("SYNC_UPSTREAM_BASE"))
		}
		cacheMutex.Lock()
		etagCache = make(map[string]string)
		bodyCache = make(map[string][]byte)
		cacheMutex.Unlock()
	})

	return server.URL
}

func performSyncUpstreamModels(t *testing.T, body string) *httptest.ResponseRecorder {
	t.Helper()

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/models/sync_upstream", strings.NewReader(body))
	ctx.Request.Header.Set("Content-Type", "application/json")

	SyncUpstreamModels(ctx)

	require.Equal(t, http.StatusOK, recorder.Code)
	var payload struct {
		Success bool `json:"success"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &payload))
	require.True(t, payload.Success, recorder.Body.String())
	return recorder
}

func TestSyncUpstreamModelsCreatesMissingModelWithEmptyDescription(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	withModelSyncUpstream(t, `{
		"success": true,
		"data": [{
			"model_name": "zz-sync-empty-description-model",
			"description": "Upstream default description must not be shown",
			"icon": "Sparkles",
			"tags": "chat",
			"status": 1,
			"name_rule": 0
		}]
	}`)

	require.NoError(t, db.Create(&model.Channel{
		Id:     1,
		Type:   constant.ChannelTypeOpenAI,
		Key:    "test-key",
		Status: common.ChannelStatusEnabled,
		Name:   "test-channel",
	}).Error)
	require.NoError(t, db.Create(&model.Ability{
		Group:     "default",
		Model:     "zz-sync-empty-description-model",
		ChannelId: 1,
		Enabled:   true,
	}).Error)

	performSyncUpstreamModels(t, `{}`)

	var stored model.Model
	require.NoError(t, db.Where("model_name = ?", "zz-sync-empty-description-model").First(&stored).Error)
	require.Empty(t, stored.Description)
	require.Equal(t, "Sparkles", stored.Icon)
	require.Equal(t, "chat", stored.Tags)
}

func TestSyncUpstreamModelsDoesNotOverwriteAdminDescriptionFromUpstream(t *testing.T) {
	db := setupModelListControllerTestDB(t)
	withModelSyncUpstream(t, `{
		"success": true,
		"data": [{
			"model_name": "zz-sync-preserve-admin-description-model",
			"description": "Upstream replacement must not be shown",
			"icon": "UpdatedIcon",
			"tags": "updated",
			"status": 1,
			"name_rule": 0
		}]
	}`)

	require.NoError(t, db.Create(&model.Model{
		ModelName:    "zz-sync-preserve-admin-description-model",
		Description:  "Admin controlled description",
		Icon:         "OldIcon",
		Tags:         "old",
		Status:       1,
		SyncOfficial: 1,
		NameRule:     model.NameRuleExact,
	}).Error)

	performSyncUpstreamModels(t, `{
		"overwrite": [{
			"model_name": "zz-sync-preserve-admin-description-model",
			"fields": ["description", "icon", "tags"]
		}]
	}`)

	var stored model.Model
	require.NoError(t, db.Where("model_name = ?", "zz-sync-preserve-admin-description-model").First(&stored).Error)
	require.Equal(t, "Admin controlled description", stored.Description)
	require.Equal(t, "UpdatedIcon", stored.Icon)
	require.Equal(t, "updated", stored.Tags)
}
