package com.duckchi.core.domain.badge.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [BADGE-02] 뱃지 조건 체크 요청 DTO.
 * Kafka 이벤트 수신 후 또는 내부 호출 시 사용한다.
 */
@Getter
@NoArgsConstructor
public class BadgeCheckRequest {

    // 대상 유저 ID
    @NotNull(message = "userId는 필수입니다.")
    private Long userId;

    // 이벤트 타입 (ex: SETTLEMENT_COMPLETED, ROOM_ENDED 등)
    @NotNull(message = "eventType은 필수입니다.")
    private String eventType;

    // 모임방 ID (이벤트에 따라 nullable)
    private Long roomId;
}
