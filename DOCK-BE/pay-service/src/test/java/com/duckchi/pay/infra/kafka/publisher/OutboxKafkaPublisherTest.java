package com.duckchi.pay.infra.kafka.publisher;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.duckchi.pay.infra.kafka.entity.OutboxEvent;
import com.duckchi.pay.infra.kafka.repository.OutboxEventRepository;
import com.duckchi.pay.infra.kafka.type.OutboxStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class OutboxKafkaPublisherTest {

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private KafkaTemplate<String, String> outboxKafkaTemplate;

    @InjectMocks
    private OutboxKafkaPublisher outboxKafkaPublisher;

    @Test
    void publishPendingEvents_whenPendingOutboxExists_sendsKafkaMessageAndMarksPublished() {
        // given: 발행 대기 중인 outbox 이벤트가 하나 존재한다.
        OutboxEvent outboxEvent = OutboxEvent.create(
                "EXPENSE",
                301L,
                "EXPENSE_SETTLED",
                "expense-settled-notification-event",
                "{\"expenseId\":301}"
        );
        ReflectionTestUtils.setField(outboxEvent, "id", 1L);

        when(outboxEventRepository.findTop100ByStatusAndNextRetryAtBeforeOrderByCreatedAtAsc(
                eq(OutboxStatus.PENDING),
                any(LocalDateTime.class)
        )).thenReturn(List.of(outboxEvent));
        when(outboxKafkaTemplate.send(
                "expense-settled-notification-event",
                "301",
                "{\"expenseId\":301}"
        )).thenReturn(CompletableFuture.completedFuture(null));

        // when: publisher가 대기 중 이벤트를 발행한다.
        outboxKafkaPublisher.publishPendingEvents();

        // then: Kafka로 전송하고 outbox 상태를 PUBLISHED로 바꾼다.
        verify(outboxKafkaTemplate).send("expense-settled-notification-event", "301", "{\"expenseId\":301}");
        assertEquals(OutboxStatus.PUBLISHED, outboxEvent.getStatus());
        assertNotNull(outboxEvent.getPublishedAt());
    }
}
