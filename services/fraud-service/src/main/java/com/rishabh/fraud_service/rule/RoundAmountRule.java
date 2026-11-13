package com.rishabh.fraud_service.rule;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

import com.rishabh.fraud_service.event.TransferCompletedEvent;

@Component
public class RoundAmountRule implements FraudRule {

    private static final BigDecimal ROUND_AMOUNT_UNIT = new BigDecimal("100.00");

    @Override
    public int score(TransferCompletedEvent event) {
        if (event.getAmount().remainder(ROUND_AMOUNT_UNIT).compareTo(BigDecimal.ZERO) == 0) {
            return 10;
        }

        return 0;
    }

    @Override
    public String reason() {
        return "ROUND_AMOUNT";
    }
}
