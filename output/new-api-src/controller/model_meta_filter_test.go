package controller

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestParseModelQueryFlag(t *testing.T) {
	for _, value := range []string{"", "all", "invalid", "2"} {
		require.Nil(t, parseModelQueryFlag(value), value)
	}
	for _, value := range []string{"0", "1", " 1 "} {
		require.NotNil(t, parseModelQueryFlag(value), value)
	}
}
