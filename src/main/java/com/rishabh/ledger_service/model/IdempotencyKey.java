package com.rishabh.ledger_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// this table is to assign a key to every transaction, so every transaction stays 
// unique, we have only 3 fields, id, transcationid and time it was created.
@Entity
@Table(name = "idempotency_keys")
public class IdempotencyKey {

    @Id
    @Column(unique = true, nullable = false)
    private String key; // the client-provided unique key itself is the primary key

    @Column(nullable = false)
    private Long transactionId; // which transfer this key was already used for

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public String getKey(){return key;}
    public void setKey(String key){this.key = key;}

    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

}