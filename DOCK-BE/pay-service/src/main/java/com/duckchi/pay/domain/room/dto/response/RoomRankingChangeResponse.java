package com.duckchi.pay.domain.room.dto.response;

public record RoomRankingChangeResponse(
        Long userId,
        int rank,
        int rankDelta,
        int amount,
        int amountDelta
) {
}
