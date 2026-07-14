package console_setting

import (
	"reflect"
	"testing"
	"time"
)

func TestGetAnnouncementsAtFiltersDisabledAndFutureItems(t *testing.T) {
	previous := consoleSetting
	t.Cleanup(func() {
		consoleSetting = previous
	})

	consoleSetting.Announcements = `[
		{"id":1,"content":"Published","publishDate":"2026-07-10T08:00:00Z","enabled":true},
		{"id":2,"content":"Disabled","publishDate":"2026-07-10T09:00:00Z","enabled":false},
		{"id":3,"content":"Future","publishDate":"2026-07-13T08:00:00Z","enabled":true},
		{"id":4,"content":"Legacy","publishDate":"2026-07-10T10:00:00Z"}
	]`

	items := getAnnouncementsAt(time.Date(2026, 7, 12, 0, 0, 0, 0, time.UTC))
	ids := make([]int, 0, len(items))
	for _, item := range items {
		ids = append(ids, int(item["id"].(float64)))
	}

	if want := []int{4, 1}; !reflect.DeepEqual(ids, want) {
		t.Fatalf("visible announcement ids = %v, want %v", ids, want)
	}
}

func TestValidateAnnouncementsRejectsNonBooleanEnabled(t *testing.T) {
	err := ValidateConsoleSettings(
		`[{"id":1,"content":"Invalid","publishDate":"2026-07-10T08:00:00Z","enabled":"true"}]`,
		"Announcements",
	)
	if err == nil {
		t.Fatal("expected a validation error for non-boolean enabled")
	}
}
