package controller

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/Calcium-Ion/go-epay/epay"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/system_setting"
)

type epayPurchaser interface {
	Purchase(args *epay.PurchaseArgs) (string, map[string]string, error)
}

type epayPurchaseFormInput struct {
	PaymentMethod string
	TradeNo       string
	Name          string
	Money         string
	NotifyURL     *url.URL
	ReturnURL     *url.URL
}

func buildEpayPurchaseForm(client epayPurchaser, input epayPurchaseFormInput) (string, map[string]string, error) {
	return client.Purchase(&epay.PurchaseArgs{
		Type:           input.PaymentMethod,
		ServiceTradeNo: input.TradeNo,
		Name:           input.Name,
		Money:          input.Money,
		Device:         epay.PC,
		NotifyUrl:      input.NotifyURL,
		ReturnUrl:      input.ReturnURL,
	})
}

// normalizeEpayBaseURL keeps PayAddress at the gateway origin. The go-epay
// client appends /submit.php itself, so accepting a stored /submit.php path
// would produce a broken double path.
func normalizeEpayBaseURL(raw string) (string, error) {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return "", fmt.Errorf("invalid Epay gateway URL")
	}
	if parsed.User != nil || parsed.RawQuery != "" || parsed.Fragment != "" {
		return "", fmt.Errorf("Epay gateway URL must not contain credentials, query, or fragment")
	}

	path := strings.TrimRight(parsed.Path, "/")
	if strings.EqualFold(path, "/submit.php") {
		path = ""
	}
	if path == "" {
		parsed.Path = "/"
	} else {
		parsed.Path = path + "/"
	}
	parsed.RawPath = ""
	return parsed.String(), nil
}

// buildEpayPaymentURLs builds public callback and browser return URLs from
// the configured callback base and the active frontend theme.
func buildEpayPaymentURLs(notifySuffix, returnSuffix string) (returnURL, notifyURL *url.URL, err error) {
	callbackBase := strings.TrimRight(strings.TrimSpace(service.GetCallbackAddress()), "/")
	if callbackBase == "" {
		return nil, nil, fmt.Errorf("callback address is not configured")
	}

	notifyURL, err = url.Parse(callbackBase + "/" + strings.TrimLeft(notifySuffix, "/"))
	if err != nil {
		return nil, nil, fmt.Errorf("invalid notify callback URL: %w", err)
	}
	returnBase := strings.TrimRight(strings.TrimSpace(system_setting.ServerAddress), "/")
	if returnBase == "" {
		return nil, nil, fmt.Errorf("server address is not configured")
	}
	returnURL, err = url.Parse(returnBase + "/" + strings.TrimLeft(returnSuffix, "/"))
	if err != nil {
		return nil, nil, fmt.Errorf("invalid payment return URL: %w", err)
	}
	return returnURL, notifyURL, nil
}
