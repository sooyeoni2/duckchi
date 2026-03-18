package com.duckchi.pay.domain.room.repository.projection;

public interface RoomSettlementSummaryProjection {

    Long getRoomId();

    Long getCompletedCount();

    Long getTargetCount();
}