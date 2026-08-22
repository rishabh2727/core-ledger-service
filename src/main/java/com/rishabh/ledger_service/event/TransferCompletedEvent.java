package com.rishabh.ledger_service.event;
import java.math.*;

// this file describes the shape of the message.
public class TransferCompletedEvent {
    private Long transactionId;
    private Long toAccountId;
    private Long fromAccountId;
    private BigDecimal amount;
    // I need all these fields to send to fraud service.


// we need an empty constructor so kafka can rebuild this object later
    public TransferCompletedEvent(){}

    public TransferCompletedEvent(Long transactionId, Long toAccountId, Long fromAccountId,BigDecimal amount){
        this.transactionId = transactionId;
        this.toAccountId = toAccountId;
        this.fromAccountId = fromAccountId;
        this.amount = amount;

        // getters and setters
    }

    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }

    public Long getFromAccountId() { return fromAccountId; }
    public void setFromAccountId(Long fromAccountId) { this.fromAccountId = fromAccountId; }

    public Long getToAccountId() { return toAccountId; }
    public void setToAccountId(Long toAccountId) { this.toAccountId = toAccountId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    
}
