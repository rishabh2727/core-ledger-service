package com.rishabh.ledger_service.publisher;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.rishabh.ledger_service.model.OutboxEvent;
import com.rishabh.ledger_service.repository.OutboxEventRepository;

@Component
public class OutboxPublisher {

    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public OutboxPublisher(OutboxEventRepository outboxEventRepository,
                           KafkaTemplate<String, String> kafkaTemplate) {
        this.outboxEventRepository = outboxEventRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Scheduled(fixedDelayString = "${outbox.publisher.fixed-delay-ms:2000}")
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepository
                .findTop10ByStatusOrderByCreatedAtAsc(OutboxEvent.Status.PENDING);

        for (OutboxEvent event : pendingEvents) {
            publish(event);
        }
    }

    private void publish(OutboxEvent event) {
        try {
            kafkaTemplate.send(event.getTopic(), event.getEventKey(), event.getPayload())
                    .get(10, TimeUnit.SECONDS);

            event.setStatus(OutboxEvent.Status.PUBLISHED);
            event.setPublishedAt(LocalDateTime.now());
            event.setLastError(null);

            log.info("Published outbox event {} to topic {}", event.getId(), event.getTopic());
        } catch (Exception exception) {
            event.setAttempts(event.getAttempts() + 1);
            event.setLastError(exception.getMessage());

            log.warn("Could not publish outbox event {}. It will be retried later.",
                    event.getId(), exception);
        }
    }
}
