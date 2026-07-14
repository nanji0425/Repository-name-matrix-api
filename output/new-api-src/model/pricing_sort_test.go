package model

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSortPricingByModelNameCaseInsensitively(t *testing.T) {
	models := []Pricing{
		{ModelName: "zeta-model"},
		{ModelName: "beta-model"},
		{ModelName: "alpha-model"},
		{ModelName: "Alpha-model"},
	}

	SortPricingByModelName(models)

	require.Equal(t, []string{
		"Alpha-model",
		"alpha-model",
		"beta-model",
		"zeta-model",
	}, pricingNames(models))
}

func pricingNames(models []Pricing) []string {
	names := make([]string, 0, len(models))
	for _, item := range models {
		names = append(names, item.ModelName)
	}
	return names
}
