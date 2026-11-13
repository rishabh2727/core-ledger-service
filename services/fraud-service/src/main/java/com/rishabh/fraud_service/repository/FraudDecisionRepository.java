package com.rishabh.fraud_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rishabh.fraud_service.model.FraudDecision;

public interface FraudDecisionRepository extends JpaRepository<FraudDecision, Long> {
    List<FraudDecision> findByAccountId(Long accountId);
}
