package com.rishabh.fraud_service.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rishabh.fraud_service.model.FlaggedTransaction;
import com.rishabh.fraud_service.repository.FlaggedTransactionRepository;

@RestController
@RequestMapping("/fraud-decisions")
public class FraudDecisionController {

    private final FlaggedTransactionRepository flaggedTransactionRepository;

    public FraudDecisionController(FlaggedTransactionRepository flaggedTransactionRepository) {
        this.flaggedTransactionRepository = flaggedTransactionRepository;
    }

    @GetMapping
    public Page<FlaggedTransaction> listDecisions(@PageableDefault(size = 20) Pageable pageable) {
        return flaggedTransactionRepository.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlaggedTransaction> getDecision(@PathVariable Long id) {
        return flaggedTransactionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
