package services

import (
	"fmt"
	"math/rand"
	"regexp"
	"time"

	"github.com/google/uuid"
)

// MpesaDisbursementRequest mirrors Daraja B2C payload parameters.
type MpesaDisbursementRequest struct {
	ReceiverPhone string  `json:"receiver_phone"`
	Amount        float64 `json:"amount"`
	TaskID        string  `json:"task_id"`
}

// MpesaDisbursementResponse represents the result of a disbursement attempt.
type MpesaDisbursementResponse struct {
	ConversationID            string    `json:"conversation_id"`
	OriginatorConversationID  string    `json:"originator_conversation_id"`
	ResponseCode               string    `json:"response_code"`
	ResponseDescription        string    `json:"response_description"`
	TransactionID              string    `json:"transaction_id"`
	RecipientName              string    `json:"recipient_name"`
	DisbursedAmount            float64   `json:"disbursed_amount"`
	Timestamp                  time.Time `json:"timestamp"`
	Simulated                  bool      `json:"simulated"`
}

var phoneRegex = regexp.MustCompile(`^(?:254|\+254|0)?(7|1)\d{8}$`)

// DisburseContractorFunds simulates an M-Pesa B2C disbursement.
//
// NOTE: This is a simulation, not a real Safaricom Daraja API integration.
// It validates inputs and returns a plausible response, but no actual
// payment is processed. To enable real disbursements, integrate the
// Safaricom Daraja B2C API with proper OAuth, shortcode, and passkey
// credentials configured via environment variables.
func DisburseContractorFunds(req MpesaDisbursementRequest, contractorName string) (*MpesaDisbursementResponse, error) {
	if req.Amount <= 0 {
		return nil, fmt.Errorf("invalid disbursement amount: %.2f KSh (must be greater than 0)", req.Amount)
	}

	if !phoneRegex.MatchString(req.ReceiverPhone) {
		return nil, fmt.Errorf("invalid receiver phone format: %s. Must be a valid Kenyan mobile number (e.g. 2547XXXXXXXX)", req.ReceiverPhone)
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	sleepDuration := time.Duration(250+rng.Intn(600)) * time.Millisecond
	time.Sleep(sleepDuration)

	if rng.Float32() < 0.025 {
		return nil, fmt.Errorf("simulated gateway timeout - please retry")
	}

	txID := fmt.Sprintf("SIM%s", uuid.New().String()[:10])
	convID := uuid.New().String()
	origConvID := uuid.New().String()

	return &MpesaDisbursementResponse{
		ConversationID:           convID,
		OriginatorConversationID:  origConvID,
		ResponseCode:              "0",
		ResponseDescription:       "Simulated disbursement accepted.",
		TransactionID:             txID,
		RecipientName:             contractorName,
		DisbursedAmount:           req.Amount,
		Timestamp:                 time.Now(),
		Simulated:                 true,
	}, nil
}
