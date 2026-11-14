package com.rishabh.fraud_service.rule;

import org.springframework.stereotype.Component;

import com.rishabh.fraud_service.event.TransferCompletedEvent;
import com.rishabh.fraud_service.service.TransactionVelocityTracker;

@Component
public class VelocityRule implements FraudRule {

    private static final long MAX_TRANSFERS_IN_WINDOW = 3;
    private static final int VELOCITY_SCORE = 50;

    private final TransactionVelocityTracker velocityTracker;

    public VelocityRule(TransactionVelocityTracker velocityTracker) {
        this.velocityTracker = velocityTracker;
    }

    @Override
    public int score(TransferCompletedEvent event) {
        long recentTransferCount = velocityTracker.recordAndCountRecentTransfers(
                event.getFromAccountId(),
                event.getTransactionId());

        if (recentTransferCount >= MAX_TRANSFERS_IN_WINDOW) {
            return VELOCITY_SCORE;
        }

        return 0;
    }

    @Override
    public String reason() {
        return "HIGH_VELOCITY";
    }
}
