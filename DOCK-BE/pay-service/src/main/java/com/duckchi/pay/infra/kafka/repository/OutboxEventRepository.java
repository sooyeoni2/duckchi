package com.duckchi.pay.infra.kafka.repository;

import com.duckchi.pay.infra.kafka.entity.OutboxEvent;
import com.duckchi.pay.infra.kafka.type.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {
    List<OutboxEvent> findTop100ByStatusAndNextRetryAtBeforeOrderByCreatedAtAsc(
            OutboxStatus status,
            LocalDateTime nextRetryAt
    );
}
