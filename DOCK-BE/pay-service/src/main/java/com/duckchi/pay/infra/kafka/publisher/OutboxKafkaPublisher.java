package com.duckchi.pay.infra.kafka.publisher;

import com.duckchi.pay.infra.kafka.entity.OutboxEvent;
import com.duckchi.pay.infra.kafka.repository.OutboxEventRepository;
import com.duckchi.pay.infra.kafka.type.OutboxStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxKafkaPublisher {

    private static final int BATCH_SIZE = 100;
    private static final int RETRY_DELAY_SECONDS = 30;
    private static final int MAX_RETRY_COUNT = 5;

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> outboxKafkaTemplate;

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void publishPendingEvents() {
        //Outbox DB에서 이벤트들 가져오기
        List<OutboxEvent> events = outboxEventRepository
                .findTop100ByStatusAndNextRetryAtBeforeOrderByCreatedAtAsc(
                        OutboxStatus.PENDING,
                        LocalDateTime.now()
                );

        for (OutboxEvent event : events) {
            //순차 전송
            publish(event);
        }
    }

    //event publish 담당
    private void publish(OutboxEvent event) {
        try {
            outboxKafkaTemplate.send(
                    event.getTopic(),
                    String.valueOf(event.getAggregateId()),
                    event.getPayload()
            ).get();

            event.markPublished();
            log.info("Outbox event published. outboxId={}, topic={}, eventType={}",
                    event.getId(), event.getTopic(), event.getEventType());
        } catch (Exception e) {
            log.error("Outbox publish failed. outboxId={}, topic={}, eventType={}",
                    event.getId(), event.getTopic(), event.getEventType(), e);

            if (event.getRetryCount() + 1 >= MAX_RETRY_COUNT) {
                event.markFailed(LocalDateTime.now().plusSeconds(RETRY_DELAY_SECONDS));
                return;
            }

            event.reschedule(LocalDateTime.now().plusSeconds(RETRY_DELAY_SECONDS));
        }
    }
}