package com.rishabh.fraud_service.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.rishabh.fraud_service.event.TransferCompletedEvent;
import com.rishabh.fraud_service.model.FraudDecision;
import com.rishabh.fraud_service.repository.FraudDecisionRepository;
import com.rishabh.fraud_service.dto.FraudEvaluation;
import com.rishabh.fraud_service.service.FraudEvaluationService;


// this here is the main feature, which will listen for events.
// in this case, spring will call it when a message lands on transfer-
// events
@Component
public class TransferEventListener {

    private static final Logger log = LoggerFactory.getLogger(TransferEventListener.class);
    private final FraudDecisionRepository fraudDecisionRepository;
    private final FraudEvaluationService fraudEvaluationService;

    // make the constructor to inject the repo.
    public TransferEventListener(FraudDecisionRepository fraudDecisionRepository,
                                 FraudEvaluationService fraudEvaluationService) {
        this.fraudDecisionRepository = fraudDecisionRepository;
        this.fraudEvaluationService = fraudEvaluationService;

    }
    @KafkaListener(topics = "transfer-events")
    public void onTransferCompleted(TransferCompletedEvent event) {
        // record the event in the fraud database, save it as a row
        // record all transactions, and then later decide if it 
        // needs to be flagged.
        FraudEvaluation evaluation = fraudEvaluationService.evaluate(event);

        FraudDecision row = new FraudDecision();
        row.setTransactionId(event.getTransactionId());
        row.setAccountId(event.getFromAccountId());
        row.setAmount(event.getAmount());
        row.setReason(evaluation.reason());
        row.setScore(evaluation.score());
        row.setOutcome(evaluation.outcome());
        
        // now insert this object as a row, call save on repo.
        fraudDecisionRepository.save(row);

        log.info("Fraud decision for transfer {}: outcome={}, score={}, reason={}",
                event.getTransactionId(), evaluation.outcome(), evaluation.score(), evaluation.reason());
    }
}
