package com.rishabh.fraud_service.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rishabh.fraud_service.model.FraudDecision;
import com.rishabh.fraud_service.repository.FraudDecisionRepository;

@RestController
@RequestMapping("/fraud-decisions")
public class FraudDecisionController {

    private final FraudDecisionRepository fraudDecisionRepository;

    public FraudDecisionController(FraudDecisionRepository fraudDecisionRepository) {
        this.fraudDecisionRepository = fraudDecisionRepository;
    }

    @GetMapping
    public Page<FraudDecision> listDecisions(@PageableDefault(size = 20) Pageable pageable) {
        return fraudDecisionRepository.findAll(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FraudDecision> getDecision(@PathVariable Long id) {
        return fraudDecisionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
