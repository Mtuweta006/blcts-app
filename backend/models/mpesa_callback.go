package models

type CallbackMetadataItem struct {
	Name  string      `json:"Name"`
	Value interface{} `json:"Value,omitempty"`
}

type CallbackMetadata struct {
	Item []CallbackMetadataItem `json:"Item"`
}

type StkCallback struct {
	MerchantRequestID string            `json:"MerchantRequestID"`
	CheckoutRequestID string            `json:"CheckoutRequestID"`
	ResultCode        int               `json:"ResultCode"`
	ResultDesc        string            `json:"ResultDesc"`
	CallbackMetadata  *CallbackMetadata `json:"CallbackMetadata,omitempty"`
}

type mpesaCallbackBody struct {
	StkCallback StkCallback `json:"stkCallback"`
}

type MpesaCallbackPayload struct {
	Body mpesaCallbackBody `json:"Body"`
}
