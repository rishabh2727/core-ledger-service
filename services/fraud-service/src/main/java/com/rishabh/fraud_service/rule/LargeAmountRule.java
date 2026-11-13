package com.rishabh.fraud_service.rule;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.rishabh.fraud_service.event.TransferCompletedEvent;

// I mark it as component so spring can quickly find it and inject it into the listener.
@Component
public class LargeAmountRule implements FraudRule {

    private static final BigDecimal LARGE_AMOUNT_THRESHOLD = new BigDecimal("1000.00");

    @Override
    public int score(TransferCompletedEvent event) {
        if (event.getAmount().compareTo(LARGE_AMOUNT_THRESHOLD) > 0) {
            return 70;
        }

        return 0;
    }

    @Override
    public String reason() {
        return "LARGE_AMOUNT";
    }
}
