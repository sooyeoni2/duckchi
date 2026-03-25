package com.duckchi.pay.domain.room.dto.response;

import java.util.List;

/**
 * ROOM-13 참여자별 정산 상태 응답 모델이다.
 */
public record RoomSettlementParticipantStatusResponse(
        Long settlementId,
        Long userId,
        String userName,
        String userTag,
        String profileImageUrl,
        int payableAmount,
        String status,
        boolean isMe,
        List<RoomSettlementItemSplitResponse> itemSplits
) {
}
