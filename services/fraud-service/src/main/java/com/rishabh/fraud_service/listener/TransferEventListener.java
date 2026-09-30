package com.rishabh.fraud_service.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.rishabh.fraud_service.event.TransferCompletedEvent;
import com.rishabh.fraud_service.model.FlaggedTransaction;
import com.rishabh.fraud_service.repository.FlaggedTransactionRepository;


// this here is the main feature, which will listen for events.
// in this case, spring will call it when a message lands on transfer-
// events
@Component
public class TransferEventListener {

    private static final Logger log = LoggerFactory.getLogger(TransferEventListener.class);
    private final FlaggedTransactionRepository flaggedTransactionRepository;

    // make the constructor to inject the repo.
    public TransferEventListener(FlaggedTransactionRepository flaggedTransactionRepository){
        this.flaggedTransactionRepository = flaggedTransactionRepository;

    }
    @KafkaListener(topics = "transfer-events")
    public void onTransferCompleted(TransferCompletedEvent event) {
        // record the event in the fraud database, save it as a row
        // record all transactions, and then later decide if it 
        // needs to be flagged.
        FlaggedTransaction row = new FlaggedTransaction();
        row.setTransactionId(event.getTransactionId());
        row.setAccountId(event.getFromAccountId());
        row.setAmount(event.getAmount());
        row.setReason("received");
        
        // now insert this object as a row, call save on repo.
        flaggedTransactionRepository.save(row);

        log.info("Received transfer event: {}", event);
    }
}
