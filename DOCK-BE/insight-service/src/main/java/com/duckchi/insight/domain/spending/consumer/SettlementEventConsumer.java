package com.duckchi.insight.domain.spending.consumer;

import com.duckchi.insight.domain.spending.dto.event.SettlementFinishedEvent;
import com.duckchi.insight.domain.spending.service.SpendingInsightService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SettlementEventConsumer {

    private final SpendingInsightService spendingInsightService;

    /**
     * Kafka 토픽 'settlement-finished-event'를 리스닝함.
     */
    @KafkaListener(
            topics = "settlement-finished-event",
            groupId = "insight-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(SettlementFinishedEvent event, Acknowledgment ack) {
        log.info("정산 완료 이벤트 수신 - 사용자 ID: {}, 방 ID: {}", event.getUserId(), event.getRoomId());

        try {
            // 1. 비즈니스 로직 수행 (지출 로그 저장 및 통계 업데이트)
            spendingInsightService.processSettlementEvent(event);

            // 2. 수동 커밋 수행 (로직 성공 시에만 Kafka에 완료 보고함)
            ack.acknowledge();
            log.info("이벤트 처리 및 커밋 완료 - 회차 ID: {}", event.getRoomSessionId());

        } catch (Exception e) {
            log.error("정산 이벤트 처리 중 오류 발생: {}", e.getMessage(), e);
            // 에러 발생 시 ack.acknowledge()를 호출하지 않음으로써, Kafka가 나중에 재전송하도록 함.
        }
    }
}
