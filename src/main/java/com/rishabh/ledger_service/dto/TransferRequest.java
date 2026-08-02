package com.rishabh.ledger_service.dto;

import java.math.BigDecimal;

// I need this class to help make a transfer request, and see what accounts 
// involved, how much money.
// this is shape of "request to move money"
// this is an instruction, not a record in the database, so separate
public class TransferRequest {
    private Long fromAccountId;
    private Long toAccountId;
    private BigDecimal amount;
    private String description;

    // Getters and setters
    public Long getFromAccountId() { return fromAccountId; }
    public void setFromAccountId(Long fromAccountId) { this.fromAccountId = fromAccountId; }

    public Long getToAccountId() { return toAccountId; }
    public void setToAccountId(Long toAccountId) { this.toAccountId = toAccountId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}