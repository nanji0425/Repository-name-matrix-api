package model

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestParseSelectedChannelIDs(t *testing.T) {
	require.Equal(t, []int{11, 12}, parseSelectedChannelIDs(`[11,12,11,0,-1]`))
	require.Empty(t, parseSelectedChannelIDs(`{"channel_ids":[11]}`))
	require.Empty(t, parseSelectedChannelIDs(`not-json`))
}
