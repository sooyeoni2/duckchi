package com.duckchi.pay.domain.room.dto.response;

import java.util.List;

/**
 * ROOM-12 내 정산 목록 조회 응답 모델이다.
 */
public record RoomMySetResponse(
        int myTotal,
        List<RoomMySetItemResponse> mySet,
        int roomTotalAmount
) {
}
