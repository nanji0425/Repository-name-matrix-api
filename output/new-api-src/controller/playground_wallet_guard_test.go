package controller

import (
	"net/http"
	"testing"

	"github.com/QuantumNous/new-api/types"
	"github.com/stretchr/testify/require"
)

func TestPlaygroundWalletQuotaErrorRequiresPositiveBalance(t *testing.T) {
	tests := []struct {
		name     string
		quota    int
		wantErr  bool
		wantCode types.ErrorCode
	}{
		{name: "negative quota", quota: -1, wantErr: true, wantCode: types.ErrorCodeInsufficientUserQuota},
		{name: "zero quota", quota: 0, wantErr: true, wantCode: types.ErrorCodeInsufficientUserQuota},
		{name: "positive quota", quota: 1, wantErr: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := playgroundWalletQuotaError(tt.quota)
			if !tt.wantErr {
				require.Nil(t, err)
				return
			}

			require.NotNil(t, err)
			require.Equal(t, http.StatusForbidden, err.StatusCode)
			require.Equal(t, tt.wantCode, err.GetErrorCode())
			require.Contains(t, err.Error(), "wallet")
		})
	}
}
