package com.rishabh.fraud_service.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rishabh.fraud_service.dto.FraudEvaluation;
import com.rishabh.fraud_service.event.TransferCompletedEvent;
import com.rishabh.fraud_service.service.FraudEvaluationService;

@RestController
@RequestMapping("/fraud-checks")
public class FraudCheckController {

    private final FraudEvaluationService fraudEvaluationService;

    public FraudCheckController(FraudEvaluationService fraudEvaluationService) {
        this.fraudEvaluationService = fraudEvaluationService;
    }

    @PostMapping
    public FraudEvaluation evaluatePayment(@RequestBody TransferCompletedEvent event) {
        return fraudEvaluationService.evaluate(event);
    }
}
