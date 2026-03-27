package com.duckchi.pay.domain.room.dto.response;

public record RoomRankingItemResponse(
        Long userId,
        String userName,
        String userTag,
        String profileImageUrl,
        int amount,
        int rank
) {
}
