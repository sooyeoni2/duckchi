package com.duckchi.core.domain.notification.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/*
 * Kafka 수신용 DTO — 뱃지 조건 체크 이벤트.
 * Pay Service에서 badge-check-event 토픽으로 발행한 메시지를 역직렬화한다.
 * BadgeCheckEventConsumer에서 수신 후 BadgeCheckServiceImpl로 전달한다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeCheckNotificationEvent {

    private Long userId;           // 뱃지 체크 대상 사용자 ID
    private String eventType;      // SETTLEMENT_COMPLETED | ROOM_CREATED | EXPENSE_OCR_ADDED 등

    // 정산 관련 조건 플래그
    private Integer amount;        // 정산 금액 (원 단위)
    private Boolean isAssassin;    // 1시간 이내 입금 여부
    private Boolean isTurtle;      // 48시간 초과 지연 여부
    private Boolean isNightOwl;    // 새벽 0~5시 송금 여부

    // 방 참여 관련
    private Long inviterId;
    private String category;
    private Boolean isNewCategory;

    // 계좌 등록 관련
    private Integer totalAccounts;

    private LocalDateTime occurredAt;
}
