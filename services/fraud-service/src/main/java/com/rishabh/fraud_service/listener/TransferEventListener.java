package com.rishabh.fraud_service.listener;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.rishabh.fraud_service.event.TransferCompletedEvent;
import com.rishabh.fraud_service.model.FraudDecision;
import com.rishabh.fraud_service.repository.FraudDecisionRepository;
import com.rishabh.fraud_service.rule.FraudRule;


// this here is the main feature, which will listen for events.
// in this case, spring will call it when a message lands on transfer-
// events
@Component
public class TransferEventListener {

    private static final Logger log = LoggerFactory.getLogger(TransferEventListener.class);
    private final FraudDecisionRepository fraudDecisionRepository;
    private final List<FraudRule> fraudRules;

    // make the constructor to inject the repo.
    public TransferEventListener(FraudDecisionRepository fraudDecisionRepository,
                                 List<FraudRule> fraudRules) {
        this.fraudDecisionRepository = fraudDecisionRepository;
        this.fraudRules = fraudRules;

    }
    @KafkaListener(topics = "transfer-events")
    public void onTransferCompleted(TransferCompletedEvent event) {
        // record the event in the fraud database, save it as a row
        // record all transactions, and then later decide if it 
        // needs to be flagged.
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

        FraudDecision row = new FraudDecision();
        row.setTransactionId(event.getTransactionId());
        row.setAccountId(event.getFromAccountId());
        row.setAmount(event.getAmount());
        row.setReason(reason);
        row.setScore(totalScore);
        row.setOutcome(outcome);
        
        // now insert this object as a row, call save on repo.
        fraudDecisionRepository.save(row);

        log.info("Fraud decision for transfer {}: outcome={}, score={}, reason={}",
                event.getTransactionId(), outcome, totalScore, reason);
    }
}
