package com.duckchi.pay.domain.room.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record RoomRankingSnapshotResponse(
        Long roomId,
        LocalDateTime asOf,
        long revision,
        RoomRankingMyResponse my,
        List<RoomRankingItemResponse> top3,
        List<RoomRankingItemResponse> items
) {
}
