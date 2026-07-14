package model

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestModelQueriesApplyStatusAndOfficialSyncFilters(t *testing.T) {
	require.NoError(t, DB.AutoMigrate(&Model{}))
	require.NoError(t, DB.Exec("DELETE FROM models").Error)
	t.Cleanup(func() {
		_ = DB.Exec("DELETE FROM models").Error
	})

	require.NoError(t, DB.Create(&[]Model{
		{ModelName: "enabled-official", Status: 1, SyncOfficial: 1},
		{ModelName: "disabled-official", Status: 0, SyncOfficial: 1},
		{ModelName: "enabled-local", Status: 1, SyncOfficial: 1},
	}).Error)
	require.NoError(t, DB.Model(&Model{}).
		Where("model_name = ?", "disabled-official").
		Updates(map[string]interface{}{"status": 0}).Error)
	require.NoError(t, DB.Model(&Model{}).
		Where("model_name = ?", "enabled-local").
		Updates(map[string]interface{}{"sync_official": 0}).Error)

	status := 1
	official := 0
	models, err := GetAllModelsWithFilter(0, 20, ModelQueryFilter{
		Status:       &status,
		SyncOfficial: &official,
	})
	require.NoError(t, err)
	require.Equal(t, []string{"enabled-local"}, modelNames(models))

	models, total, err := SearchModelsWithFilter("enabled", "", 0, 20, ModelQueryFilter{
		Status:       &status,
		SyncOfficial: &official,
	})
	require.NoError(t, err)
	require.EqualValues(t, 1, total)
	require.Equal(t, []string{"enabled-local"}, modelNames(models))
}
