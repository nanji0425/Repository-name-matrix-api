package controller

import (
	"strings"
	"testing"

	"github.com/Calcium-Ion/go-epay/epay"
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/setting/system_setting"
	"github.com/stretchr/testify/require"
)

func TestBuildEpayPurchaseFormUsesZPayAndMatrixCallbacks(t *testing.T) {
	originalServerAddress := system_setting.ServerAddress
	originalCustomCallbackAddress := operation_setting.CustomCallbackAddress
	t.Cleanup(func() {
		system_setting.ServerAddress = originalServerAddress
		operation_setting.CustomCallbackAddress = originalCustomCallbackAddress
	})

	system_setting.ServerAddress = "https://matrixapi.online"
	operation_setting.CustomCallbackAddress = ""

	baseURL, err := normalizeEpayBaseURL("https://zpayz.cn/submit.php")
	require.NoError(t, err)
	client, err := epay.NewClient(&epay.Config{
		PartnerID: "unit-test-partner",
		Key:       strings.Repeat("x", 32),
	}, baseURL)
	require.NoError(t, err)
	returnURL, notifyURL, err := buildEpayPaymentURLs(
		"/api/user/epay/notify",
		"/console/log",
	)
	require.NoError(t, err)

	action, params, err := buildEpayPurchaseForm(client, epayPurchaseFormInput{
		PaymentMethod: "alipay",
		TradeNo:       "UNIT-TEST-NO-ORDER",
		Name:          "TUC100",
		Money:         "10.00",
		NotifyURL:     notifyURL,
		ReturnURL:     returnURL,
	})
	require.NoError(t, err)
	require.Equal(t, "https://zpayz.cn/submit.php", action)
	require.Equal(t, "alipay", params["type"])
	require.Equal(t, "https://matrixapi.online/api/user/epay/notify", params["notify_url"])
	require.Equal(t, "https://matrixapi.online/console/log", params["return_url"])
	require.NotEmpty(t, params["sign"])
}

func TestNormalizeEpayBaseURLRemovesSubmitPath(t *testing.T) {
	got, err := normalizeEpayBaseURL("https://zpayz.cn/submit.php")
	require.NoError(t, err)
	require.Equal(t, "https://zpayz.cn/", got)
}

func TestBuildEpayPaymentURLsUsesPublicCallbackAndReturnBase(t *testing.T) {
	originalServerAddress := system_setting.ServerAddress
	originalCustomCallbackAddress := operation_setting.CustomCallbackAddress
	originalTheme := common.GetTheme()
	t.Cleanup(func() {
		system_setting.ServerAddress = originalServerAddress
		operation_setting.CustomCallbackAddress = originalCustomCallbackAddress
		common.SetTheme(originalTheme)
	})

	system_setting.ServerAddress = "https://matrixapi.online"
	operation_setting.CustomCallbackAddress = ""
	common.SetTheme("default")

	returnURL, notifyURL, err := buildEpayPaymentURLs(
		"/api/user/epay/notify",
		"/console/log",
	)
	require.NoError(t, err)
	require.Equal(t, "https://matrixapi.online/console/log", returnURL.String())
	require.Equal(t, "https://matrixapi.online/api/user/epay/notify", notifyURL.String())
}
