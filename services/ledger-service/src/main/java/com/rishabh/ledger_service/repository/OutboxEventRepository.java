package com.rishabh.ledger_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rishabh.ledger_service.model.OutboxEvent;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {
    List<OutboxEvent> findTop10ByStatusOrderByCreatedAtAsc(OutboxEvent.Status status);
}
