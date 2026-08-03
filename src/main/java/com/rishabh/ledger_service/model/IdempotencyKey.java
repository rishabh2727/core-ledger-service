package com.rishabh.ledger_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "idempotency_keys")
public class IdempotencyKey {

    @Id
    private String key; // the client-provided unique key itself is the primary key

    @Column(nullable = false)
    private Long transactionId; // which transfer this key was already used for

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}