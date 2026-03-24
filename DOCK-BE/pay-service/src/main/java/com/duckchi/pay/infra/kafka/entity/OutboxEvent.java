package com.duckchi.pay.infra.kafka.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

import com.duckchi.pay.infra.kafka.type.OutboxStatus;

@Entity
@Table(name = "outbox_events")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class OutboxEvent {

    //아이디
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //도메인 종류
    @Column(name="aggregate_type", nullable = false, length = 50)
    private String aggregateType;

    //해당 도메인 PK
    @Column(name="aggregate_id", nullable = false)
    private Long aggregateId;

    //이벤트 타입
    @Column(name="event_type",nullable = false, length = 100)
    private String eventType;

    //실제 Kafka 토픽명
    @Column(nullable = false, length = 150)
    private String topic;

    //JSON 문자열
    @Lob
    @Column(nullable = false)
    private String payload;

    //Outbox Status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OutboxStatus status;

    //재시도 횟수
    @Column(name="retry_count",nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    //다음 발행 시도 가능 시각
    @Column(name="next_retry_at")
    private LocalDateTime nextRetryAt;

    //최종 발행 성공 시각
    @Column(name="published_at")
    private LocalDateTime publishedAt;

    //Outbox 생성 시각
    @Column(name="created_at",nullable = false, updatable = false)
    private LocalDateTime createdAt;


    @Column(name="updated_at",nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        if (status == null) {
            status = OutboxStatus.PENDING;
        }
        if (retryCount == null) {
            retryCount = 0;
        }
        if (nextRetryAt == null) {
            nextRetryAt = now;
        }
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    public static OutboxEvent create(
            String aggregateType,
            Long aggregateId,
            String eventType,
            String topic,
            String payload
    ) {
        return OutboxEvent.builder()
                .aggregateType(aggregateType)
                .aggregateId(aggregateId)
                .eventType(eventType)
                .topic(topic)
                .payload(payload)
                .status(OutboxStatus.PENDING)
                .retryCount(0)
                .nextRetryAt(LocalDateTime.now())
                .build();
    }

    public void markPublished() {
        this.status = OutboxStatus.PUBLISHED;
        this.publishedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void markFailed(LocalDateTime nextRetryAt) {
        this.status = OutboxStatus.FAILED;
        this.retryCount += 1;
        this.nextRetryAt = nextRetryAt;
        this.updatedAt = LocalDateTime.now();
    }

    public void reschedule(LocalDateTime nextRetryAt) {
        this.retryCount += 1;
        this.nextRetryAt = nextRetryAt;
        this.updatedAt = LocalDateTime.now();
    }
}