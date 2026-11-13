package com.rishabh.fraud_service.rule;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.rishabh.fraud_service.event.TransferCompletedEvent;

class FraudRuleTests {

    private final LargeAmountRule largeAmountRule = new LargeAmountRule();
    private final RoundAmountRule roundAmountRule = new RoundAmountRule();

    @Test
    void scoresNormalAndRiskyTransferAmounts() {
        TransferCompletedEvent normalTransfer = transferWithAmount("50.00");
        TransferCompletedEvent riskyTransfer = transferWithAmount("2000.00");

        assertEquals(0, largeAmountRule.score(normalTransfer));
        assertEquals(0, roundAmountRule.score(normalTransfer));

        // I expect this rule to return 70. if it returns anything else then fail the test.
        assertEquals(70, largeAmountRule.score(riskyTransfer));
        assertEquals(10, roundAmountRule.score(riskyTransfer));
    }

    private TransferCompletedEvent transferWithAmount(String amount) {
        TransferCompletedEvent event = new TransferCompletedEvent();
        event.setTransactionId(1L);
        event.setFromAccountId(100L);
        event.setToAccountId(200L);
        event.setAmount(new BigDecimal(amount));
        return event;
    }
}
