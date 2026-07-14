package model

import (
	"sort"
	"strings"
)

// CompareModelNames orders names case-insensitively, then uses the original
// spelling as a deterministic tie-breaker.
func CompareModelNames(a, b string) bool {
	lowerA, lowerB := strings.ToLower(a), strings.ToLower(b)
	if lowerA != lowerB {
		return lowerA < lowerB
	}
	return a < b
}

func SortModelNames(names []string) {
	sort.SliceStable(names, func(i, j int) bool {
		return CompareModelNames(names[i], names[j])
	})
}

func SortModelsByName(models []*Model) {
	sort.SliceStable(models, func(i, j int) bool {
		if models[i] == nil {
			return false
		}
		if models[j] == nil {
			return true
		}
		return CompareModelNames(models[i].ModelName, models[j].ModelName)
	})
}

func SortPricingByModelName(pricing []Pricing) {
	sort.SliceStable(pricing, func(i, j int) bool {
		return CompareModelNames(pricing[i].ModelName, pricing[j].ModelName)
	})
}

// sortPricingByModelName keeps the local package helper name used by pricing
// cache tests and callers while the exported variant remains available to
// controllers outside this package.
func sortPricingByModelName(pricing []Pricing) {
	SortPricingByModelName(pricing)
}
