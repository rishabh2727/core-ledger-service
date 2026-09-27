package com.rishabh.fraud_service.event;

import java.math.BigDecimal;

/**
 * Fraud's own copy of the transfer message shape.
 * Kafka carries JSON, not Java classes, so this must live in Fraud
 * even though Ledger has a class with the same field names.
 */
// 
public class TransferCompletedEvent {

    private Long transactionId;
    private Long fromAccountId;
    private Long toAccountId;
    private BigDecimal amount;

    public TransferCompletedEvent() {
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public Long getFromAccountId() {
        return fromAccountId;
    }

    public void setFromAccountId(Long fromAccountId) {
        this.fromAccountId = fromAccountId;
    }

    public Long getToAccountId() {
        return toAccountId;
    }

    public void setToAccountId(Long toAccountId) {
        this.toAccountId = toAccountId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    @Override
    public String toString() {
        return "TransferCompletedEvent{" +
                "transactionId=" + transactionId +
                ", fromAccountId=" + fromAccountId +
                ", toAccountId=" + toAccountId +
                ", amount=" + amount +
                '}';
    }
}
