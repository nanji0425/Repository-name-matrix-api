package model

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSortModelNamesAndModelsCaseInsensitively(t *testing.T) {
	names := []string{"zeta-model", "beta-model", "alpha-model", "Alpha-model"}
	SortModelNames(names)
	require.Equal(t, []string{
		"Alpha-model",
		"alpha-model",
		"beta-model",
		"zeta-model",
	}, names)

	models := []*Model{
		{ModelName: "zeta-model"},
		nil,
		{ModelName: "alpha-model"},
		{ModelName: "Alpha-model"},
	}
	SortModelsByName(models)
	require.Equal(t, []string{"Alpha-model", "alpha-model", "zeta-model"}, modelNames(models[:3]))
	require.Nil(t, models[3])
}

func TestModelQueriesSortByNameCaseInsensitively(t *testing.T) {
	require.NoError(t, DB.AutoMigrate(&Model{}))
	require.NoError(t, DB.Exec("DELETE FROM models").Error)
	t.Cleanup(func() {
		_ = DB.Exec("DELETE FROM models").Error
	})

	require.NoError(t, DB.Create(&[]Model{
		{ModelName: "zeta-model", Status: 1, SyncOfficial: 1},
		{ModelName: "beta-model", Status: 1, SyncOfficial: 1},
		{ModelName: "alpha-model", Status: 1, SyncOfficial: 1},
		{ModelName: "Alpha-model", Status: 1, SyncOfficial: 1},
	}).Error)

	models, err := GetAllModels(0, 20)
	require.NoError(t, err)
	require.Equal(t, []string{
		"Alpha-model",
		"alpha-model",
		"beta-model",
		"zeta-model",
	}, modelNames(models))

	models, _, err = SearchModels("", "", 0, 20)
	require.NoError(t, err)
	require.Equal(t, []string{
		"Alpha-model",
		"alpha-model",
		"beta-model",
		"zeta-model",
	}, modelNames(models))
}

func modelNames(models []*Model) []string {
	names := make([]string, 0, len(models))
	for _, item := range models {
		names = append(names, item.ModelName)
	}
	return names
}
