package com.duckchi.pay.domain.room.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record RoomRankingUpdateEventResponse(
        Long roomId,
        LocalDateTime asOf,
        long revision,
        List<RoomRankingChangeResponse> changes,
        List<RoomRankingItemResponse> top3,
        List<RoomRankingItemResponse> items
) {
}
