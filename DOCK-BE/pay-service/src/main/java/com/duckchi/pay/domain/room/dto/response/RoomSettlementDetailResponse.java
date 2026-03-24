package com.duckchi.pay.domain.room.dto.response;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ROOM-13 정산 현황 조회 응답 모델이다.
 */
public record RoomSettlementDetailResponse(
        Long expenseId,
        Long roomId,
        Long roomSessionId,
        String roomName,
        String title,
        int totalAmount,
        String inputType,
        boolean isItemized,
        String expenseStatus,
        Long requesterUserId,
        String requesterUserName,
        int participantCount,
        int pendingCount,
        int completedCount,
        int myPayableAmount,
        boolean isRequester,
        LocalDateTime requestedAt,
        List<RoomSettlementParticipantStatusResponse> participants
) {
}
