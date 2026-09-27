package com.rishabh.fraud_service.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.rishabh.fraud_service.event.TransferCompletedEvent;


// this here is the main feature, which will listen for events.
// in this case, spring will call it when a message lands on transfer-
// events
@Component
public class TransferEventListener {

    private static final Logger log = LoggerFactory.getLogger(TransferEventListener.class);

    @KafkaListener(topics = "transfer-events")
    public void onTransferCompleted(TransferCompletedEvent event) {
        log.info("Received transfer event: {}", event);
    }
}
