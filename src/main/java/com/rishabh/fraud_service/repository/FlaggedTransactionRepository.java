package com.rishabh.fraud_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rishabh.fraud_service.model.FlaggedTransaction;
import java.util.List;


public interface FlaggedTransactionRepository extends JpaRepository<FlaggedTransaction, Long>{
    List<FlaggedTransaction> findByAccountId(Long accountId);

}
