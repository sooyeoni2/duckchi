package com.duckchi.pay.domain.room.dto.response;

import java.time.LocalDateTime;

/**
 * ROOM-12 내 정산 목록의 단건 항목 응답 모델이다.
 */
public record RoomMySetItemResponse(
        Long settlementId,
        Long expenseId,
        String title,
        String requesterUserName,
        int setUserCount,
        int payableAmount,
        boolean isCompleted,
        LocalDateTime requestedAt
) {
}
