package com.duckchi.pay.infra.kafka.service;

import com.duckchi.pay.infra.kafka.entity.OutboxEvent;
import com.duckchi.pay.infra.kafka.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class OutboxEventCommandService {

    private final OutboxEventRepository outboxEventRepository;
    private final OutboxPayloadSerializer outboxPayloadSerializer;

    //OutboxEvent 저장하는 로직
    public Long save(
            String aggregateType, //도메인 종류
            Long aggregateId, //해당 도메인 PK
            String eventType, //이벤트 타입
            String topic, //실제 Kafka 토픽명
            Object payload //JSON 문자열
    ) {
        //Payload json 문자열로 직렬화
        String serializedPayload = outboxPayloadSerializer.serialize(payload);
        //OutboxEvent 생성
        OutboxEvent outboxEvent = OutboxEvent.create(
                aggregateType,
                aggregateId,
                eventType,
                topic,
                serializedPayload
        );

        //Outbox Event table에 저장
        return outboxEventRepository.save(outboxEvent).getId();
    }
}
