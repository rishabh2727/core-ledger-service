package com.rishabh.fraud_service.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.rishabh.fraud_service.dto.FraudEvaluation;
import com.rishabh.fraud_service.event.TransferCompletedEvent;
import com.rishabh.fraud_service.rule.FraudRule;

@Service
public class FraudEvaluationService {

    private final List<FraudRule> fraudRules;

    public FraudEvaluationService(List<FraudRule> fraudRules) {
        this.fraudRules = fraudRules;
    }

    public FraudEvaluation evaluate(TransferCompletedEvent event) {
        int totalScore = 0;
        List<String> reasons = new ArrayList<>();

        for (FraudRule fraudRule : fraudRules) {
            int ruleScore = fraudRule.score(event);

            if (ruleScore > 0) {
                totalScore += ruleScore;
                reasons.add(fraudRule.reason());
            }
        }

        String outcome = totalScore >= 50 ? "DECLINE" : "APPROVE";
        String reason = reasons.isEmpty() ? "NO_RULE_TRIGGERED" : String.join(",", reasons);

        return new FraudEvaluation(totalScore, outcome, reason);
    }
}
