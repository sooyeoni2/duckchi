package com.duckchi.pay.domain.badge.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/*
 * Kafka Payload DTO — 뱃지 조건 체크 이벤트.
 * Pay Service에서 Outbox에 저장 → Publisher가 Kafka 토픽(badge-check-event)으로 발행.
 * Core Service의 BadgeCheckEventConsumer가 수신하여 뱃지 진행도를 갱신한다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeCheckNotificationEvent {

    private Long userId;           // 뱃지 체크 대상 사용자 ID
    private String eventType;      // SETTLEMENT_COMPLETED | ROOM_CREATED | EXPENSE_OCR_ADDED 등

    // 정산 관련 조건 플래그 (SETTLEMENT_COMPLETED 이벤트에서만 의미 있음)
    private Integer amount;        // 정산 금액 (원 단위)
    private Boolean isAssassin;    // 1시간 이내 입금 여부
    private Boolean isTurtle;      // 48시간 초과 지연 여부
    private Boolean isNightOwl;    // 새벽 0~5시 송금 여부

    // 방 참여 관련 (ROOM_JOINED 이벤트에서만 의미 있음)
    private Long inviterId;        // 초대 링크 생성자 ID
    private String category;       // 참여한 방 카테고리
    private Boolean isNewCategory; // 해당 유저의 새 카테고리 여부

    // 계좌 등록 관련 (ACCOUNT_REGISTERED 이벤트에서만 의미 있음)
    private Integer totalAccounts; // 현재 인증된 계좌 수

    private LocalDateTime occurredAt; // 이벤트 발생 시각
}
