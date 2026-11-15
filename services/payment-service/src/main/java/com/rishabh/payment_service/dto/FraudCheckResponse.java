package com.rishabh.payment_service.dto;

public record FraudCheckResponse(int score, String outcome, String reason) {
}
