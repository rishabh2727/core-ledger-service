package com.rishabh.ledger_service.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.*;

// creating the entity here.
@Entity
@Table(name="accounts")
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String accountNumber; // account number will be unique

    @Column(nullable = false)
    private String accountType; // Checking , SAVINGS, LOAN

    @Column(nullable = false)
    private String status; // ACTIVE, FROZEN, CLOSED

    private BigDecimal interestRate; // nullable, not every account will earn interest
    // like chequeing will not earn interest.

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();



        // Getters and setters, Spring needs these to map JSON <-> object

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public BigDecimal getInterestRate() { return interestRate; }
    public void setInterestRate(BigDecimal interestRate) { this.interestRate = interestRate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}





