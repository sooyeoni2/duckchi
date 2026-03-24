package com.duckchi.pay.domain.room.dto.response;

/**
 * ROOM-13 참여자별 품목 분담 상세 응답 모델이다.
 */
public record RoomSettlementItemSplitResponse(
        Long expenseItemId,
        String itemName,
        int quantity,
        int splitAmount
) {
}
