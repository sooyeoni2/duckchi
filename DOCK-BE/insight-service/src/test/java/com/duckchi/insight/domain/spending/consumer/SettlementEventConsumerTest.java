package com.duckchi.insight.domain.spending.consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.duckchi.insight.domain.spending.dto.event.SettlementFinishedEvent;
import com.duckchi.insight.domain.spending.repository.SpendingLogRepository;
import com.duckchi.insight.domain.spending.repository.UserMonthlySpendRepository;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext
@EmbeddedKafka(partitions = 1, topics = {"settlement-finished-event"})
class SettlementEventConsumerTest {

    @Autowired
    private EmbeddedKafkaBroker embeddedKafkaBroker;

    @Autowired
    private SpendingLogRepository spendingLogRepository;

    @Autowired
    private UserMonthlySpendRepository userMonthlySpendRepository;

    @Test
    @DisplayName("EmbeddedKafka로 정산 완료 이벤트를 발행하면 Consumer가 이를 수신하여 DB에 저장해야 한다")
    void kafkaConsumerIntegrationTest() {
        // 1. 테스트 전용 ProducerFactory 및 KafkaTemplate 생성 (타입 안전성 보장)
        // 랜덤으로 할당된 브로커 주소를 사용하도록 명시함
        Map<String, Object> producerProps = new HashMap<>(KafkaTestUtils.producerProps(embeddedKafkaBroker));
        producerProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, embeddedKafkaBroker.getBrokersAsString());
        producerProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        producerProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);

        DefaultKafkaProducerFactory<String, SettlementFinishedEvent> pf = new DefaultKafkaProducerFactory<>(producerProps);
        KafkaTemplate<String, SettlementFinishedEvent> template = new KafkaTemplate<>(pf);

        // 2. 테스트 데이터 생성
        Long userId = 777L;
        SettlementFinishedEvent event = SettlementFinishedEvent.builder()
                .userId(userId)
                .roomId(101L)
                .roomSessionId(999L)
                .roomName("최종 임베디드 테스트")
                .category("DINING")
                .amount(25000)
                .endedAt(LocalDateTime.now())
                .build();

        // 3. 메시지 전송
        template.send("settlement-finished-event", event);

        // 4. 검증 (Awaitility)
        await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
            boolean logExists = spendingLogRepository.findAll().stream()
                    .anyMatch(log -> log.getUserId().equals(userId) && log.getAmount() == 25000);
            assertThat(logExists).isTrue();

            var spend = userMonthlySpendRepository
                    .findByUserIdAndSpendMonthAndStatTypeAndStatValue(userId,
                            LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM")),
                            "TOTAL", "ALL");

            assertThat(spend).isPresent();
            assertThat(spend.get().getTotalAmount()).isEqualTo(25000);
        });
    }
}