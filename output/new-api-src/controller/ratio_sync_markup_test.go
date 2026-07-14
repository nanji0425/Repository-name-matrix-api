package controller

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestApplyUpstreamPriceMarkupOnlyChangesBasePricing(t *testing.T) {
	input := map[string]any{
		"model_ratio": map[string]any{
			"ratio-model": 2.0,
		},
		"model_price": map[string]any{
			"fixed-model": 0.5,
		},
		"completion_ratio": map[string]any{
			"ratio-model": 3.0,
		},
		"cache_ratio": map[string]any{
			"ratio-model": 0.25,
		},
	}

	result := applyUpstreamPriceMarkup(input, 40)

	require.Equal(t, 2.8, result["model_ratio"].(map[string]any)["ratio-model"])
	require.Equal(t, 0.7, result["model_price"].(map[string]any)["fixed-model"])
	require.Equal(t, 3.0, result["completion_ratio"].(map[string]any)["ratio-model"])
	require.Equal(t, 0.25, result["cache_ratio"].(map[string]any)["ratio-model"])
}

func TestApplyUpstreamPriceMarkupRejectsOutOfRangePercent(t *testing.T) {
	input := map[string]any{"model_price": map[string]any{"model": 1.0}}
	require.Equal(t, 1.0, applyUpstreamPriceMarkup(input, -1)["model_price"].(map[string]any)["model"])
	require.Equal(t, 1.0, applyUpstreamPriceMarkup(input, 1001)["model_price"].(map[string]any)["model"])
}
