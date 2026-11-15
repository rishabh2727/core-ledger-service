package com.rishabh.payment_service.dto;

import java.math.BigDecimal;

public class LedgerTransferRequest {
    private Long fromAccountId;
    private Long toAccountId;
    private BigDecimal amount;
    private String description;
    private String idempotencyKey;

    public LedgerTransferRequest(Long fromAccountId,
                                 Long toAccountId,
                                 BigDecimal amount,
                                 String description,
                                 String idempotencyKey) {
        this.fromAccountId = fromAccountId;
        this.toAccountId = toAccountId;
        this.amount = amount;
        this.description = description;
        this.idempotencyKey = idempotencyKey;
    }

    public Long getFromAccountId() { return fromAccountId; }
    public Long getToAccountId() { return toAccountId; }
    public BigDecimal getAmount() { return amount; }
    public String getDescription() { return description; }
    public String getIdempotencyKey() { return idempotencyKey; }
}
