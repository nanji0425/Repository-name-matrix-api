package controller

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/require"
)

func TestBuildFetchModelsChannelPreservesRequestSettings(t *testing.T) {
	req := fetchModelsRequest{
		Type:           constant.ChannelTypeAli,
		BaseURL:        "https://provider.example/",
		Key:            " key-1\nkey-2 ",
		Setting:        `{"proxy":"http://proxy.example"}`,
		HeaderOverride: `{"X-Upstream":"{api_key}"}`,
		OtherSettings:  `{"upstream_model_update_check_enabled":true}`,
		ModelMapping:   `{"alias":"actual"}`,
	}

	channel, err := buildFetchModelsChannel(req)
	require.NoError(t, err)
	require.Equal(t, constant.ChannelTypeAli, channel.Type)
	require.Equal(t, "https://provider.example", channel.GetBaseURL())
	require.Equal(t, " key-1\nkey-2 ", channel.Key)
	require.Equal(t, "http://proxy.example", channel.GetSetting().Proxy)
	require.Equal(t, "{\"X-Upstream\":\"{api_key}\"}", *channel.HeaderOverride)
	require.Equal(t, `{"upstream_model_update_check_enabled":true}`, channel.OtherSettings)
	require.Equal(t, `{"alias":"actual"}`, *channel.ModelMapping)
}

func TestFetchModelsUsesTypeSpecificPathAndHeaderOverride(t *testing.T) {
	var requestPath string
	var requestHeader string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestPath = r.URL.Path
		requestHeader = r.Header.Get("X-Upstream")
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"data": []map[string]string{{"id": "model-a"}},
		})
	}))
	defer server.Close()

	key := "secret-key"
	headerOverride := `{"X-Upstream":"{api_key}"}`
	channel := &model.Channel{
		Type:           constant.ChannelTypeAli,
		Key:            key,
		BaseURL:        &server.URL,
		HeaderOverride: &headerOverride,
	}

	models, err := fetchChannelUpstreamModelIDs(channel)
	require.NoError(t, err)
	require.Equal(t, []string{"model-a"}, models)
	require.Equal(t, "/compatible-mode/v1/models", requestPath)
	require.Equal(t, key, requestHeader)
}

func TestFetchModelsSortsNamesCaseInsensitively(t *testing.T) {
	var requestPath string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestPath = r.URL.Path
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"data": []map[string]string{
				{"id": "Zeta-model"},
				{"id": "alpha-model"},
				{"id": "beta-model"},
			},
		})
	}))
	defer server.Close()

	models, err := fetchChannelUpstreamModelIDs(&model.Channel{
		Type:    constant.ChannelTypeOpenAI,
		Key:     "test-key",
		BaseURL: &server.URL,
	})
	require.NoError(t, err)
	require.Equal(t, "/v1/models", requestPath)
	require.Equal(t, []string{"alpha-model", "beta-model", "Zeta-model"}, models)
}

func TestFetchKukuaiPublishedModelCatalogNormalizesModels(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "/api/dist/site/models", r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"data": []map[string]string{
				{"model_name": "model-z"},
				{"id": "model-a"},
				{"model_name": "model-z"},
			},
		})
	}))
	defer server.Close()

	models, err := fetchKukuaiPublishedModelCatalog(server.URL)
	require.NoError(t, err)
	require.Equal(t, []string{"model-a", "model-z"}, models)
}

func TestFetchKukuaiPublishedModelCatalogSortsNamesCaseInsensitively(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"success": true,
			"data": []map[string]string{
				{"model_name": "Zeta-model"},
				{"model_name": "alpha-model"},
				{"model_name": "beta-model"},
			},
		})
	}))
	defer server.Close()

	models, err := fetchKukuaiPublishedModelCatalog(server.URL)
	require.NoError(t, err)
	require.Equal(t, []string{"alpha-model", "beta-model", "Zeta-model"}, models)
}

func TestBalanceQueryCapabilityRejectsUnsupportedAndMultiKeyChannels(t *testing.T) {
	require.True(t, supportsChannelBalanceQuery(&model.Channel{Type: constant.ChannelTypeOpenAI}))
	require.True(t, supportsChannelBalanceQuery(&model.Channel{Type: constant.ChannelTypeMoonshot}))
	require.False(t, supportsChannelBalanceQuery(&model.Channel{Type: constant.ChannelTypeAnthropic}))
	require.False(t, supportsChannelBalanceQuery(&model.Channel{
		Type:        constant.ChannelTypeOpenAI,
		ChannelInfo: model.ChannelInfo{IsMultiKey: true},
	}))
}
