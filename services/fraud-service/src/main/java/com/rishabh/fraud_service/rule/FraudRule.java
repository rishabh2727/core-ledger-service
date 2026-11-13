package com.rishabh.fraud_service.rule;

import com.rishabh.fraud_service.event.TransferCompletedEvent;

public interface FraudRule {
    int score(TransferCompletedEvent event);
    String reason();
}
